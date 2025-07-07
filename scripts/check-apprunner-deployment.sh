#!/bin/bash
set -e

# App Runnerのデプロイメント状況を確認するスクリプト

AWS_PROFILE=${AWS_PROFILE:-graphhopper-demo}
SERVICE_NAME="graphhopper-frontend"

echo "=== App Runner Service Status ==="
aws apprunner describe-service \
  --service-arn $(aws apprunner list-services --profile ${AWS_PROFILE} --query "ServiceSummaryList[?ServiceName=='${SERVICE_NAME}'].ServiceArn" --output text) \
  --profile ${AWS_PROFILE} \
  --query "Service.{Status:Status,ServiceUrl:ServiceUrl,ImageIdentifier:SourceConfiguration.ImageRepository.ImageIdentifier}" \
  --output table

echo -e "\n=== Latest Operations ==="
aws apprunner list-operations \
  --service-arn $(aws apprunner list-services --profile ${AWS_PROFILE} --query "ServiceSummaryList[?ServiceName=='${SERVICE_NAME}'].ServiceArn" --output text) \
  --profile ${AWS_PROFILE} \
  --query "OperationSummaryList[0:5].{Type:Type,Status:Status,StartedAt:StartedAt,EndedAt:EndedAt}" \
  --output table

echo -e "\n=== ECR Image Details ==="
# ECRイメージの詳細を確認
REPOSITORY_NAME="graphhopper-frontend"
LATEST_IMAGE=$(aws ecr describe-images \
  --repository-name ${REPOSITORY_NAME} \
  --profile ${AWS_PROFILE} \
  --query "sort_by(imageDetails,&imagePushedAt)[-1].{Digest:imageDigest,PushedAt:imagePushedAt,Tags:imageTags[0]}" \
  --output json)

echo "Latest ECR Image:"
echo "$LATEST_IMAGE" | jq .

echo -e "\n=== CloudWatch Logs ==="
echo "To view application logs:"
echo "aws logs tail /aws/apprunner/${SERVICE_NAME}/application --profile ${AWS_PROFILE} --follow"
echo ""
echo "To view system logs:"
echo "aws logs tail /aws/apprunner/${SERVICE_NAME}/service --profile ${AWS_PROFILE} --follow"