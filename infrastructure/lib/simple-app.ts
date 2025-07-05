#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SimpleAppRunnerStack } from './stacks/simple-app-runner-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || '201486033314',
  region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
};

new SimpleAppRunnerStack(app, 'SimpleAppRunnerStack', {
  env,
  description: 'GraphHopper Demo - Simple App Runner Stack',
});