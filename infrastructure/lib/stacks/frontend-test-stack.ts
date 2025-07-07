import * as cdk from 'aws-cdk-lib';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class FrontendTestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // App Runner インスタンスロール
    const instanceRole = new iam.Role(this, 'TestAppRunnerInstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
      ],
    });

    // App Runner アクセスロール（ECR用）
    const accessRole = new iam.Role(this, 'TestAppRunnerAccessRole', {
      assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'),
      ],
    });

    // Test Frontend サービス
    const testService = new apprunner.CfnService(this, 'TestFrontendService', {
      serviceName: 'graphhopper-frontend-test',
      sourceConfiguration: {
        autoDeploymentsEnabled: false,
        imageRepository: {
          imageIdentifier: '201486033314.dkr.ecr.ap-northeast-1.amazonaws.com/graphhopper-frontend:test-minimal',
          imageConfiguration: {
            port: '3000',
            runtimeEnvironmentVariables: [
              {
                name: 'PORT',
                value: '3000',
              },
              {
                name: 'NODE_ENV',
                value: 'production',
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
        cpu: '0.25 vCPU',
        memory: '0.5 GB',
        instanceRoleArn: instanceRole.roleArn,
      },
      healthCheckConfiguration: {
        protocol: 'HTTP',
        path: '/',
        interval: 20,
        timeout: 20,
        healthyThreshold: 1,
        unhealthyThreshold: 10,
      },
    });

    // Frontend URL を出力
    new cdk.CfnOutput(this, 'TestFrontendUrl', {
      value: `https://${testService.attrServiceUrl}`,
      description: 'Test Frontend URL',
    });
  }
}