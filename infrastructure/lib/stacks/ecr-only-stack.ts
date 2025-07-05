import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

/**
 * ECRリポジトリのみを作成するスタック（S3なし）
 */
export class ECROnlyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // APIリポジトリ
    const apiRepository = new ecr.Repository(this, 'ApiRepository', {
      repositoryName: 'graphhopper-api-simple',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      lifecycleRules: [{
        maxImageCount: 5,
        description: 'Keep only 5 most recent images',
      }],
    });

    // フロントエンドリポジトリ
    const frontendRepository = new ecr.Repository(this, 'FrontendRepository', {
      repositoryName: 'graphhopper-frontend-simple',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      lifecycleRules: [{
        maxImageCount: 5,
        description: 'Keep only 5 most recent images',
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