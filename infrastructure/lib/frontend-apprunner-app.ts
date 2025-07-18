#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FrontendAppRunnerStack } from './stacks/frontend-apprunner-stack';

const app = new cdk.App();

new FrontendAppRunnerStack(app, 'FrontendAppRunnerStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-northeast-1',
  },
});