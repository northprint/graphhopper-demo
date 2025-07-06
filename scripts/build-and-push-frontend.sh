#!/bin/bash
set -e

# 現在のアカウントIDを取得
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="ap-northeast-1"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_REPOSITORY="graphhopper-frontend"

echo "Building frontend image..."

# ECRにログイン
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

# Dockerイメージをビルド
docker build -f apps/web/Dockerfile.apprunner -t ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest .

# ECRにプッシュ
docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest

echo "Frontend image pushed to ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest"