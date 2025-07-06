import * as cdk from 'aws-cdk-lib';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class FrontendAppRunnerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // App Runner インスタンスロール
    const instanceRole = new iam.Role(this, 'AppRunnerInstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
      ],
    });

    // App Runner アクセスロール（ECR用）
    const accessRole = new iam.Role(this, 'AppRunnerAccessRole', {
      assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'),
      ],
    });

    // Frontend サービス
    const frontendService = new apprunner.CfnService(this, 'FrontendService', {
      serviceName: 'graphhopper-frontend',
      sourceConfiguration: {
        imageRepository: {
          imageIdentifier: '201486033314.dkr.ecr.ap-northeast-1.amazonaws.com/graphhopper-frontend:latest',
          imageConfiguration: {
            port: '3000',
            runtimeEnvironmentVariables: [
              {
                name: 'PUBLIC_GRAPHHOPPER_URL',
                value: 'https://2qdyg9js3i.ap-northeast-1.awsapprunner.com',
              },
            ],
          },
          imageRepositoryType: 'ECR',
        },
        authenticationConfiguration: {
          accessRoleArn: accessRole.roleArn,
        },
      },
      instanceConfiguration: {
        cpu: '0.5 vCPU',
        memory: '1 GB',
        instanceRoleArn: instanceRole.roleArn,
      },
      healthCheckConfiguration: {
        protocol: 'HTTP',
        path: '/',
        interval: 10,
        timeout: 5,
        healthyThreshold: 1,
        unhealthyThreshold: 5,
      },
    });

    // Frontend URL を出力
    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${frontendService.attrServiceUrl}`,
      description: 'Frontend URL',
    });
  }
}