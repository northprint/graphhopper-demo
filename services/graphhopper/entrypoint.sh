#!/bin/sh

echo "Starting GraphHopper..."
echo "Java Options: $JAVA_OPTS"
echo "Working Directory: $(pwd)"
echo "Files in data directory:"
ls -la /graphhopper/data/

# ヘルスチェックサーバーをバックグラウンドで起動
node /graphhopper/health-server.js &

echo "Starting GraphHopper server..."
# GraphHopperを起動（エラーが発生してもコンテナを終了しない）
java $JAVA_OPTS -jar graphhopper.jar server config.yml || {
    echo "GraphHopper failed to start, keeping health check server running..."
    # ヘルスチェックサーバーは動作し続ける
    wait
}