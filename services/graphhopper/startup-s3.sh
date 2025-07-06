#!/bin/bash
set -e

echo "Starting GraphHopper with S3 support..."
echo "S3 Bucket: $DATA_BUCKET"
echo "OSM File: $OSM_FILE"

# S3からOSMデータをダウンロード
if [ ! -f "/graphhopper/data/map.osm.pbf" ]; then
    echo "Downloading OSM data from S3..."
    mkdir -p /graphhopper/data
    aws s3 cp "s3://$DATA_BUCKET/$OSM_FILE" /graphhopper/data/map.osm.pbf || {
        echo "ERROR: Failed to download OSM data from S3"
        exit 1
    }
    echo "Download complete!"
else
    echo "OSM data already exists"
fi

# GraphHopperを起動
echo "Starting GraphHopper server..."
exec java $JAVA_OPTS -jar graphhopper.jar server config.yml