#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MinimalAppRunnerStack } from './stacks/minimal-apprunner-stack';

const app = new cdk.App();

new MinimalAppRunnerStack(app, 'MinimalAppRunnerStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-northeast-1',
  },
});