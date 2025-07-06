import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class S3Stack extends cdk.Stack {
  public readonly mapDataBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // OSMデータ用のS3バケット
    this.mapDataBucket = new s3.Bucket(this, 'MapDataBucket', {
      bucketName: `graphhopper-map-data-${this.account}`,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // バケット名を出力
    new cdk.CfnOutput(this, 'MapDataBucketName', {
      value: this.mapDataBucket.bucketName,
      description: 'S3 bucket for map data',
    });
  }
}