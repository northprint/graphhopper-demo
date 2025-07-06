import * as cdk from 'aws-cdk-lib';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class MinimalAppRunnerStack extends cdk.Stack {
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

    // GraphHopper API サービス
    const graphhopperApi = new apprunner.CfnService(this, 'GraphHopperApi', {
      serviceName: 'graphhopper-api-minimal',
      sourceConfiguration: {
        imageRepository: {
          imageIdentifier: '201486033314.dkr.ecr.ap-northeast-1.amazonaws.com/graphhopper-api:latest',
          imageConfiguration: {
            port: '8989',
            runtimeEnvironmentVariables: [
              {
                name: 'JAVA_OPTS',
                value: '-Xmx1g -Xms512m',
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
        cpu: '1 vCPU',
        memory: '2 GB',
        instanceRoleArn: instanceRole.roleArn,
      },
      healthCheckConfiguration: {
        protocol: 'HTTP',
        path: '/health',
        interval: 10,
        timeout: 5,
        healthyThreshold: 1,
        unhealthyThreshold: 5,
      },
    });

    // API URL を出力
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: `https://${graphhopperApi.attrServiceUrl}`,
      description: 'GraphHopper API URL',
    });
  }
}