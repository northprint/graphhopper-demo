import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export class ECRSimpleStack extends cdk.Stack {
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

    // 出力
    new cdk.CfnOutput(this, 'ApiRepositoryUri', {
      value: apiRepository.repositoryUri,
      description: 'API ECR Repository URI',
    });

    new cdk.CfnOutput(this, 'FrontendRepositoryUri', {
      value: frontendRepository.repositoryUri,
      description: 'Frontend ECR Repository URI',
    });
  }
}