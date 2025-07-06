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
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:ListBucket',
              ],
              resources: [
                `arn:aws:s3:::graphhopper-data-*`,
                `arn:aws:s3:::graphhopper-data-*/*`,
              ],
            }),
          ],
        }),
      },
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
            port: '8990',
            runtimeEnvironmentVariables: [
              {
                name: 'JAVA_OPTS',
                value: '-Xmx2g -Xms512m',
              },
              {
                name: 'DATA_BUCKET',
                value: 'graphhopper-data-201486033314-ap-northeast-1',
              },
              {
                name: 'OSM_FILE',
                value: 'osm-data/kanto-latest.osm.pbf',
              },
              {
                name: 'GRAPH_PROFILE',
                value: 'kanto-car',
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
        cpu: '2 vCPU',
        memory: '4 GB',
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