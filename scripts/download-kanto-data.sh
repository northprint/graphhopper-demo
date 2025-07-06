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
echo "🎯 Next steps:"
echo "1. Upload to S3: aws s3 cp $OUTPUT_FILE s3://your-bucket/osm-data/"
echo "2. Deploy with S3 support: cdk deploy DataStorageStack"