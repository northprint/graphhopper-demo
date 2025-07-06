#!/bin/bash

# S3バケット名
BUCKET_NAME="graphhopper-data-201486033314-ap-northeast-1"
AWS_PROFILE="graphhopper-demo"

echo "📤 Uploading demo data to S3..."

# 現在の渋谷データをアップロード（テスト用）
if [ -f "data/map.osm.pbf" ]; then
    echo "Uploading current Shibuya data as test..."
    aws s3 cp data/map.osm.pbf s3://$BUCKET_NAME/osm-data/shibuya-demo.osm.pbf --profile $AWS_PROFILE
fi

# 関東データがあればアップロード
if [ -f "data/kanto-latest.osm.pbf" ]; then
    echo "Uploading Kanto data..."
    aws s3 cp data/kanto-latest.osm.pbf s3://$BUCKET_NAME/osm-data/kanto-latest.osm.pbf --profile $AWS_PROFILE
    
    echo "✅ Upload complete!"
    echo ""
    echo "S3 contents:"
    aws s3 ls s3://$BUCKET_NAME/osm-data/ --profile $AWS_PROFILE
else
    echo "⚠️  Kanto data not found. Run ./scripts/download-kanto-data.sh first"
fi