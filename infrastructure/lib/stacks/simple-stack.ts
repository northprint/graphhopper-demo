import * as cdk from 'aws-cdk-lib';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class SimpleGraphHopperStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // OSMデータ用S3バケット
    const dataBucket = new s3.Bucket(this, 'DataBucket', {
      bucketName: `graphhopper-data-simple-${this.account}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // OSMデータをS3にアップロード
    new s3deploy.BucketDeployment(this, 'DataDeployment', {
      sources: [s3deploy.Source.asset('../data')],
      destinationBucket: dataBucket,
    });

    // APIリポジトリ（新規作成）
    const apiRepository = new ecr.Repository(this, 'ApiRepository', {
      repositoryName: 'graphhopper-api-simple',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteImages: true,
      lifecycleRules: [{
        maxImageCount: 5,
        description: 'Keep only 5 most recent images',
      }],
    });

    // フロントエンドリポジトリ（新規作成）
    const frontendRepository = new ecr.Repository(this, 'FrontendRepository', {
      repositoryName: 'graphhopper-frontend-simple',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteImages: true,
      lifecycleRules: [{
        maxImageCount: 5,
        description: 'Keep only 5 most recent images',
      }],
    });

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
                value: '-Xmx1g -Xms512m',
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
      },
      healthCheckConfiguration: {
        protocol: 'HTTP',
        path: '/health',
        interval: 10,
        timeout: 5,
        healthyThreshold: 1,
        unhealthyThreshold: 3,
      },
    });

    // App RunnerサービスにS3読み取り権限を付与する必要があるが、
    // CfnServiceではサービスロールのARNにアクセスできないため、
    // App RunnerのTaskRoleにポリシーを追加する方法は後で対応

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

    new cdk.CfnOutput(this, 'ApiRepositoryUri', {
      value: apiRepository.repositoryUri,
      description: 'API ECR Repository URI',
    });

    new cdk.CfnOutput(this, 'FrontendRepositoryUri', {
      value: frontendRepository.repositoryUri,
      description: 'Frontend ECR Repository URI',
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