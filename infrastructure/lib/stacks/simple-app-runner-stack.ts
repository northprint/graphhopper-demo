import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class SimpleAppRunnerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ECRリポジトリを作成
    const apiRepository = new ecr.Repository(this, 'ApiRepository', {
      repositoryName: 'graphhopper-api',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      lifecycleRules: [{
        maxImageCount: 3,
        description: 'Keep only 3 most recent images',
      }],
    });

    const frontendRepository = new ecr.Repository(this, 'FrontendRepository', {
      repositoryName: 'graphhopper-frontend',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      lifecycleRules: [{
        maxImageCount: 3,
        description: 'Keep only 3 most recent images',
      }],
    });

    // App Runner用のIAMロール（ECRアクセス用）
    const appRunnerAccessRole = new iam.Role(this, 'AppRunnerAccessRole', {
      assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
      description: 'Role for App Runner to access ECR images',
    });

    // ECRへのアクセス権限を付与
    apiRepository.grantPull(appRunnerAccessRole);
    frontendRepository.grantPull(appRunnerAccessRole);

    // App Runner用のインスタンスロール（アプリケーション実行用）
    const appRunnerInstanceRole = new iam.Role(this, 'AppRunnerInstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
      description: 'Role for App Runner service instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
      ],
    });

    // GraphHopper API Service
    const apiService = new apprunner.CfnService(this, 'ApiService', {
      serviceName: 'graphhopper-api',
      sourceConfiguration: {
        authenticationConfiguration: {
          accessRoleArn: appRunnerAccessRole.roleArn,
        },
        autoDeploymentsEnabled: false,
        imageRepository: {
          imageIdentifier: `${apiRepository.repositoryUri}:latest`,
          imageRepositoryType: 'ECR',
          imageConfiguration: {
            port: '8989',
            runtimeEnvironmentVariables: [
              {
                name: 'JAVA_OPTS',
                value: '-Xmx1g -Xms512m',
              },
            ],
          },
        },
      },
      healthCheckConfiguration: {
        protocol: 'HTTP',
        path: '/',
        interval: 20,
        timeout: 10,
        healthyThreshold: 1,
        unhealthyThreshold: 3,
      },
      instanceConfiguration: {
        cpu: '1 vCPU',
        memory: '2 GB',
        instanceRoleArn: appRunnerInstanceRole.roleArn,
      },
    });

    // Frontend Service
    const frontendService = new apprunner.CfnService(this, 'FrontendService', {
      serviceName: 'graphhopper-frontend',
      sourceConfiguration: {
        authenticationConfiguration: {
          accessRoleArn: appRunnerAccessRole.roleArn,
        },
        autoDeploymentsEnabled: false,
        imageRepository: {
          imageIdentifier: `${frontendRepository.repositoryUri}:latest`,
          imageRepositoryType: 'ECR',
          imageConfiguration: {
            port: '3000',
            runtimeEnvironmentVariables: [
              {
                name: 'PUBLIC_GRAPHHOPPER_URL',
                value: `https://${apiService.attrServiceUrl}`,
              },
            ],
          },
        },
      },
      healthCheckConfiguration: {
        protocol: 'HTTP',
        path: '/',
        interval: 20,
        timeout: 10,
        healthyThreshold: 1,
        unhealthyThreshold: 3,
      },
      instanceConfiguration: {
        cpu: '0.25 vCPU',
        memory: '0.5 GB',
        instanceRoleArn: appRunnerInstanceRole.roleArn,
      },
    });

    // 出力
    new cdk.CfnOutput(this, 'ApiRepositoryUri', {
      value: apiRepository.repositoryUri,
      description: 'API ECR Repository URI',
    });

    new cdk.CfnOutput(this, 'FrontendRepositoryUri', {
      value: frontendRepository.repositoryUri,
      description: 'Frontend ECR Repository URI',
    });

    new cdk.CfnOutput(this, 'ApiServiceUrl', {
      value: `https://${apiService.attrServiceUrl}`,
      description: 'GraphHopper API URL',
    });

    new cdk.CfnOutput(this, 'FrontendServiceUrl', {
      value: `https://${frontendService.attrServiceUrl}`,
      description: 'Frontend URL',
    });
  }
}