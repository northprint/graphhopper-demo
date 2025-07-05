import * as cdk from 'aws-cdk-lib';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface AppRunnerStackProps extends cdk.StackProps {
  apiRepositoryName: string;
  frontendRepositoryName: string;
  dataBucketName: string;
}

/**
 * App Runnerサービスを作成するスタック
 */
export class AppRunnerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AppRunnerStackProps) {
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

    const dataBucket = s3.Bucket.fromBucketName(
      this,
      'DataBucket',
      props.dataBucketName
    );

    // App RunnerタスクロールにS3アクセス権限を付与
    const apiTaskRole = new iam.Role(this, 'ApiTaskRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
    });

    dataBucket.grantRead(apiTaskRole);

    // GraphHopper API (App Runner)
    const apiService = new apprunner.CfnService(this, 'GraphHopperAPI', {
      serviceName: 'graphhopper-api-simple',
      sourceConfiguration: {
        authenticationConfiguration: {
          accessRoleArn: this.createAppRunnerRole('ApiRole', apiRepository).roleArn,
        },
        imageRepository: {
          imageIdentifier: `${apiRepository.repositoryUri}:latest`,
          imageRepositoryType: 'ECR',
          imageConfiguration: {
            port: '8989',
            runtimeEnvironmentVariables: [
              {
                name: 'JAVA_OPTS',
                value: '-Xmx1500m -Xms512m',
              },
              {
                name: 'S3_DATA_BUCKET',
                value: dataBucket.bucketName,
              },
            ],
          },
        },
      },
      instanceConfiguration: {
        cpu: '1 vCPU',
        memory: '2 GB',
        instanceRoleArn: apiTaskRole.roleArn,
      },
      healthCheckConfiguration: {
        protocol: 'HTTP',
        path: '/',
        interval: 20,
        timeout: 10,
        healthyThreshold: 1,
        unhealthyThreshold: 5,
      },
    });

    // SvelteKit SSR (App Runner)
    const frontendService = new apprunner.CfnService(this, 'FrontendSSR', {
      serviceName: 'graphhopper-frontend-simple',
      sourceConfiguration: {
        authenticationConfiguration: {
          accessRoleArn: this.createAppRunnerRole('FrontendRole', frontendRepository).roleArn,
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
      instanceConfiguration: {
        cpu: '0.5 vCPU',
        memory: '1 GB',
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

  private createAppRunnerRole(id: string, repository: ecr.IRepository): iam.Role {
    const role = new iam.Role(this, id, {
      assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
    });

    role.addToPolicy(
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

    repository.grantPull(role);

    return role;
  }
}