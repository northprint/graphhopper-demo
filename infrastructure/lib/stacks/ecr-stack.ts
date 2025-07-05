import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

/**
 * ECRリポジトリとS3バケットのみを作成するスタック
 */
export class ECRStack extends cdk.Stack {
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
      emptyOnDelete: true,
      lifecycleRules: [{
        maxImageCount: 5,
        description: 'Keep only 5 most recent images',
      }],
    });

    // フロントエンドリポジトリ（新規作成）
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

    new cdk.CfnOutput(this, 'DataBucketName', {
      value: dataBucket.bucketName,
      description: 'S3 Data Bucket Name',
    });
  }
}