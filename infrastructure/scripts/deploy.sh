#!/bin/bash

# デプロイスクリプト
set -e

echo "🚀 GraphHopper Demo - AWS CDKデプロイ"
echo "===================================="

# 環境変数チェック
if [ -z "$AWS_ACCOUNT_ID" ]; then
    export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
fi

if [ -z "$AWS_REGION" ]; then
    export AWS_REGION="ap-northeast-1"
fi

echo "AWS Account: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"
echo ""

# 1. CDK Bootstrap（初回のみ）
echo "📦 CDK Bootstrap..."
npx cdk bootstrap aws://$AWS_ACCOUNT_ID/$AWS_REGION

# 2. ECRリポジトリを先に作成
echo "🏗️ ECRリポジトリを作成..."
aws ecr create-repository --repository-name graphhopper-demo --region $AWS_REGION 2>/dev/null || true

# 3. Dockerイメージのビルドとプッシュ
echo "🐳 Dockerイメージをビルド..."
cd ../services/graphhopper
docker build -f Dockerfile.production -t graphhopper-demo .

# ECRにログイン
echo "🔐 ECRにログイン..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# タグ付けとプッシュ
echo "📤 イメージをプッシュ..."
docker tag graphhopper-demo:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/graphhopper-demo:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/graphhopper-demo:latest

# 4. フロントエンドのビルド
echo "🎨 フロントエンドをビルド..."
cd ../../apps/web
pnpm build

# 5. CDKデプロイ
echo "☁️ CDKスタックをデプロイ..."
cd ../../infrastructure
npx cdk deploy --all --require-approval never

echo ""
echo "✅ デプロイ完了！"
echo ""
echo "📊 リソースを確認："
echo "aws cloudformation list-stacks --region $AWS_REGION"
echo ""
echo "🌐 アプリケーションURL："
aws cloudformation describe-stacks --stack-name GraphHopperFrontendStack --query "Stacks[0].Outputs[?OutputKey=='DistributionUrl'].OutputValue" --output text --region $AWS_REGION