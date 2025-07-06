#!/bin/bash

# 関東地方のOSMデータをダウンロード
# Geofabrikから関東地方のデータを取得

REGION="kanto"
DOWNLOAD_URL="https://download.geofabrik.de/asia/japan/kanto-latest.osm.pbf"
OUTPUT_DIR="data"
OUTPUT_FILE="$OUTPUT_DIR/kanto-latest.osm.pbf"

echo "📥 Downloading Kanto region OSM data..."
echo "URL: $DOWNLOAD_URL"

# ディレクトリ作成
mkdir -p "$OUTPUT_DIR"

# ダウンロード
if command -v wget &> /dev/null; then
    wget -O "$OUTPUT_FILE" "$DOWNLOAD_URL"
elif command -v curl &> /dev/null; then
    curl -L -o "$OUTPUT_FILE" "$DOWNLOAD_URL"
else
    echo "❌ Error: wget or curl is required"
    exit 1
fi

# ファイルサイズ確認
if [ -f "$OUTPUT_FILE" ]; then
    SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
    echo "✅ Download complete: $OUTPUT_FILE ($SIZE)"
    echo ""
    echo "📊 File info:"
    ls -la "$OUTPUT_FILE"
else
    echo "❌ Error: Download failed"
    exit 1
fi

echo ""
echo "🎯 Uploading to S3..."

# S3バケット名（環境変数から取得、またはデフォルト値）
BUCKET_NAME="${S3_BUCKET:-graphhopper-map-data-201486033314}"

# S3にアップロード
echo "📤 Uploading to s3://$BUCKET_NAME/kanto-latest.osm.pbf"
aws s3 cp "$OUTPUT_FILE" "s3://$BUCKET_NAME/kanto-latest.osm.pbf"

# 既存のデモデータもアップロード
if [ -f "data/map.osm.pbf" ]; then
    echo "📤 Uploading demo data to s3://$BUCKET_NAME/shibuya-demo.osm.pbf"
    aws s3 cp "data/map.osm.pbf" "s3://$BUCKET_NAME/shibuya-demo.osm.pbf"
fi

echo ""
echo "✅ Upload complete! Files in S3:"
aws s3 ls "s3://$BUCKET_NAME/" --human-readable

echo ""
echo "🎯 Next steps:"
echo "1. Update App Runner environment variables:"
echo "   - S3_BUCKET: $BUCKET_NAME"
echo "   - S3_KEY: kanto-latest.osm.pbf (or shibuya-demo.osm.pbf for testing)"
echo "2. Deploy S3-enabled version"