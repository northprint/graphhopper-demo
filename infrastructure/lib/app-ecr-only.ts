#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ECROnlyStack } from './stacks/ecr-only-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
};

new ECROnlyStack(app, 'ECROnlyStack', {
  env,
  description: 'GraphHopper Demo - ECR Repositories Only',
});