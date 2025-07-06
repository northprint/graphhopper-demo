import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class DataStorageStack extends cdk.Stack {
  public readonly dataBucket: s3.Bucket;
  
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    // GraphHopperデータ用のS3バケット
    this.dataBucket = new s3.Bucket(this, 'GraphHopperDataBucket', {
      bucketName: `graphhopper-data-${this.account}-${this.region}`,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'delete-old-graph-cache',
          prefix: 'graph-cache/',
          noncurrentVersionExpiration: cdk.Duration.days(7),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // App Runnerサービス用のアクセスポリシー
    const appRunnerAccessPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('tasks.apprunner.amazonaws.com')],
      actions: [
        's3:GetObject',
        's3:ListBucket',
        's3:PutObject',
      ],
      resources: [
        this.dataBucket.bucketArn,
        `${this.dataBucket.bucketArn}/*`,
      ],
    });

    // バケットポリシーを追加
    this.dataBucket.addToResourcePolicy(appRunnerAccessPolicy);

    // 出力
    new cdk.CfnOutput(this, 'DataBucketName', {
      value: this.dataBucket.bucketName,
      description: 'S3 bucket for GraphHopper data',
    });

    new cdk.CfnOutput(this, 'DataBucketArn', {
      value: this.dataBucket.bucketArn,
      description: 'S3 bucket ARN',
    });
  }
}