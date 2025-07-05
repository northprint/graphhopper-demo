#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { GraphHopperStack } from './stacks/graphhopper-stack';
import { FrontendStack } from './stacks/frontend-stack';
import { NetworkStack } from './stacks/network-stack';

const app = new cdk.App();

// 環境設定
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
};

// ネットワークスタック（VPC、ALBなど）
const networkStack = new NetworkStack(app, 'GraphHopperNetworkStack', {
  env,
  description: 'GraphHopper Demo - Network Infrastructure',
});

// GraphHopper APIスタック（ECS Fargate）
const graphhopperStack = new GraphHopperStack(app, 'GraphHopperApiStack', {
  env,
  vpc: networkStack.vpc,
  alb: networkStack.alb,
  description: 'GraphHopper Demo - API Service (ECS Fargate)',
});

// フロントエンドスタック（S3 + CloudFront）
const frontendStack = new FrontendStack(app, 'GraphHopperFrontendStack', {
  env,
  apiUrl: graphhopperStack.apiUrl,
  description: 'GraphHopper Demo - Frontend (S3 + CloudFront)',
});

// タグ付け
cdk.Tags.of(app).add('Project', 'GraphHopper-Demo');
cdk.Tags.of(app).add('Environment', 'Production');
cdk.Tags.of(app).add('ManagedBy', 'CDK');