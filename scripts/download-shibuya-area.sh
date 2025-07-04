#!/bin/bash

# 渋谷駅周辺の小さなエリアのOSMデータをダウンロード

echo "渋谷駅周辺のデータをダウンロード中..."
echo "================================"

# データディレクトリの作成
mkdir -p data

# 渋谷駅を中心とした約2km四方のエリア
MIN_LON=139.695
MAX_LON=139.710
MIN_LAT=35.655
MAX_LAT=35.665

echo "範囲: 経度 $MIN_LON-$MAX_LON, 緯度 $MIN_LAT-$MAX_LAT"
echo "Overpass APIからデータを取得中..."

# Overpass QLクエリ（簡略版）
# 道路データのみに限定して軽量化
curl -X POST \
  -H "Content-Type: text/plain" \
  -d "[bbox:$MIN_LAT,$MIN_LON,$MAX_LAT,$MAX_LON][timeout:60][out:xml];(way[highway];node(w););out;" \
  "https://overpass-api.de/api/interpreter" \
  -o data/shibuya.osm

# ファイルサイズを確認
if [ -f "data/shibuya.osm" ]; then
    size=$(ls -lh data/shibuya.osm | awk '{print $5}')
    echo ""
    echo "✅ ダウンロード完了!"
    echo "ファイルサイズ: $size"
    
    # OSMファイルをそのまま使用
    mv data/shibuya.osm data/map.osm.pbf
    
    echo ""
    echo "次のステップ:"
    echo "1. docker-compose restart graphhopper でGraphHopperを再起動"
    echo "2. http://localhost:5173 でアプリケーションにアクセス"
else
    echo "❌ ダウンロードに失敗しました。"
    exit 1
fi