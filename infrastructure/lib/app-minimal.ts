#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MinimalAppRunnerStack } from './stacks/minimal-apprunner-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
};

new MinimalAppRunnerStack(app, 'MinimalAppRunnerStack', {
  env,
  apiRepositoryName: 'graphhopper-api-simple',
  frontendRepositoryName: 'graphhopper-frontend-simple',
  description: 'GraphHopper Demo - Minimal App Runner Services',
});

cdk.Tags.of(app).add('Project', 'GraphHopper-Demo-Minimal');
cdk.Tags.of(app).add('Environment', 'Production');
cdk.Tags.of(app).add('ManagedBy', 'CDK');