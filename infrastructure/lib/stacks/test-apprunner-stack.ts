import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class TestAppRunnerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 既存のECRリポジトリを参照
    const apiRepository = ecr.Repository.fromRepositoryName(
      this,
      'ApiRepository',
      'graphhopper-api'
    );

    // App Runner用のIAMロール（ECRアクセス用）
    const appRunnerAccessRole = new iam.Role(this, 'AppRunnerAccessRole', {
      assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
      description: 'Role for App Runner to access ECR images',
    });

    // ECRへのアクセス権限を付与
    apiRepository.grantPull(appRunnerAccessRole);

    // App Runner用のインスタンスロール（アプリケーション実行用）
    const appRunnerInstanceRole = new iam.Role(this, 'AppRunnerInstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
      description: 'Role for App Runner service instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
      ],
    });

    // GraphHopper API Service - 最小限の設定でテスト
    const apiService = new apprunner.CfnService(this, 'ApiService', {
      serviceName: 'graphhopper-api-test',
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
            // メモリを少し増やす
            runtimeEnvironmentVariables: [
              {
                name: 'JAVA_OPTS',
                value: '-Xmx1500m -Xms512m',
              },
            ],
          },
        },
      },
      // ヘルスチェックを緩めに設定
      healthCheckConfiguration: {
        protocol: 'HTTP',
        path: '/',
        interval: 20,
        timeout: 20,  // タイムアウトを延長
        healthyThreshold: 1,
        unhealthyThreshold: 5,  // 失敗の許容度を上げる
      },
      // インスタンスサイズを大きくする
      instanceConfiguration: {
        cpu: '2 vCPU',  // CPUを増やす
        memory: '4 GB',  // メモリを増やす
        instanceRoleArn: appRunnerInstanceRole.roleArn,
      },
    });

    // 出力
    new cdk.CfnOutput(this, 'ApiServiceUrl', {
      value: `https://${apiService.attrServiceUrl}`,
      description: 'GraphHopper API URL',
    });
  }
}