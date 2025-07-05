import * as cdk from 'aws-cdk-lib';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface MinimalAppRunnerStackProps extends cdk.StackProps {
  apiRepositoryName: string;
  frontendRepositoryName: string;
}

/**
 * 最小限のApp Runnerサービスを作成するスタック
 */
export class MinimalAppRunnerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MinimalAppRunnerStackProps) {
    super(scope, id, props);

    // 既存のリソースを参照
    const apiRepository = ecr.Repository.fromRepositoryName(
      this,
      'ApiRepository',
      props.apiRepositoryName
    );

    const frontendRepository = ecr.Repository.fromRepositoryName(
      this,
      'FrontendRepository',
      props.frontendRepositoryName
    );

    // App Runner用のアクセスロール
    const apiAccessRole = new iam.Role(this, 'ApiAccessRole', {
      assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
    });

    apiAccessRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
        ],
        resources: ['*'],
      })
    );

    apiRepository.grantPull(apiAccessRole);

    const frontendAccessRole = new iam.Role(this, 'FrontendAccessRole', {
      assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
    });

    frontendAccessRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
        ],
        resources: ['*'],
      })
    );

    frontendRepository.grantPull(frontendAccessRole);

    // GraphHopper API (App Runner) - 最小限の設定
    const apiService = new apprunner.CfnService(this, 'GraphHopperAPI', {
      serviceName: 'graphhopper-api-minimal',
      sourceConfiguration: {
        authenticationConfiguration: {
          accessRoleArn: apiAccessRole.roleArn,
        },
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
        unhealthyThreshold: 5,
      },
      instanceConfiguration: {
        cpu: '1 vCPU',
        memory: '2 GB',
      },
    });

    // Frontend (App Runner) - 最小限の設定  
    const frontendService = new apprunner.CfnService(this, 'FrontendSSR', {
      serviceName: 'graphhopper-frontend-minimal',
      sourceConfiguration: {
        authenticationConfiguration: {
          accessRoleArn: frontendAccessRole.roleArn,
        },
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
    });

    // 出力
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: `https://${apiService.attrServiceUrl}`,
      description: 'GraphHopper API URL',
    });

    new cdk.CfnOutput(this, 'FrontendUrl', {
      value: `https://${frontendService.attrServiceUrl}`,
      description: 'Frontend URL',
    });
  }
}