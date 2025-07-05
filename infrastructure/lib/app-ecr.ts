#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ECRStack } from './stacks/ecr-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
};

new ECRStack(app, 'ECRStack', {
  env,
  description: 'GraphHopper Demo - ECR Repositories and S3 Bucket',
});

cdk.Tags.of(app).add('Project', 'GraphHopper-Demo-Simple');
cdk.Tags.of(app).add('Environment', 'Production');
cdk.Tags.of(app).add('ManagedBy', 'CDK');