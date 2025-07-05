#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppRunnerStack } from './stacks/apprunner-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
};

new AppRunnerStack(app, 'AppRunnerStack', {
  env,
  apiRepositoryName: 'graphhopper-api-simple',
  frontendRepositoryName: 'graphhopper-frontend-simple',
  dataBucketName: `graphhopper-data-simple-${env.account}`,
  description: 'GraphHopper Demo - App Runner Services',
});

cdk.Tags.of(app).add('Project', 'GraphHopper-Demo-Simple');
cdk.Tags.of(app).add('Environment', 'Production');
cdk.Tags.of(app).add('ManagedBy', 'CDK');