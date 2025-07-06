#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DataStorageStack } from './stacks/data-storage-stack';

const app = new cdk.App();

new DataStorageStack(app, 'DataStorageStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-northeast-1',
  },
});