#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FrontendTestStack } from './stacks/frontend-test-stack';

const app = new cdk.App();
new FrontendTestStack(app, 'FrontendTestStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: 'ap-northeast-1' 
  },
});