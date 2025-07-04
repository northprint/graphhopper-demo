#!/bin/bash

# 日本の特定エリアのOSMデータをダウンロードするスクリプト

echo "GraphHopper Demo - 日本エリアデータダウンロード"
echo "============================================="
echo ""

# データディレクトリの作成
mkdir -p data

# 選択肢を表示
echo "日本のエリアを選択してください:"
echo "1) 東京都心部 (渋谷・新宿・港区周辺) - 約20-30MB"
echo "2) 大阪市中心部 (梅田・難波周辺) - 約15-20MB"
echo "3) 京都市内 (市内中心部) - 約10-15MB"
echo "4) 横浜市中心部 - 約15-20MB"
echo "5) 名古屋市中心部 - 約10-15MB"
echo "6) カスタム範囲 (緯度経度を指定)"

read -p "選択してください (1-6): " choice

case $choice in
    1)
        echo "東京都心部のデータをダウンロード中..."
        # 渋谷・新宿・港区周辺 (約10km四方)
        MIN_LON=139.65
        MAX_LON=139.78
        MIN_LAT=35.64
        MAX_LAT=35.70
        CITY="tokyo-center"
        ;;
    2)
        echo "大阪市中心部のデータをダウンロード中..."
        # 梅田・難波周辺
        MIN_LON=135.46
        MAX_LON=135.53
        MIN_LAT=34.66
        MAX_LAT=34.71
        CITY="osaka-center"
        ;;
    3)
        echo "京都市内のデータをダウンロード中..."
        # 京都市中心部
        MIN_LON=135.73
        MAX_LON=135.79
        MIN_LAT=34.98
        MAX_LAT=35.03
        CITY="kyoto-center"
        ;;
    4)
        echo "横浜市中心部のデータをダウンロード中..."
        # 横浜駅・みなとみらい周辺
        MIN_LON=139.60
        MAX_LON=139.66
        MIN_LAT=35.44
        MAX_LAT=35.48
        CITY="yokohama-center"
        ;;
    5)
        echo "名古屋市中心部のデータをダウンロード中..."
        # 名古屋駅・栄周辺
        MIN_LON=136.87
        MAX_LON=136.93
        MIN_LAT=35.15
        MAX_LAT=35.19
        CITY="nagoya-center"
        ;;
    6)
        echo "カスタム範囲を指定してください:"
        read -p "最小経度 (例: 139.65): " MIN_LON
        read -p "最大経度 (例: 139.78): " MAX_LON
        read -p "最小緯度 (例: 35.64): " MIN_LAT
        read -p "最大緯度 (例: 35.70): " MAX_LAT
        CITY="custom-area"
        ;;
    *)
        echo "無効な選択です。終了します。"
        exit 1
        ;;
esac

# Overpass APIを使用してデータをダウンロード
echo ""
echo "範囲: 経度 $MIN_LON-$MAX_LON, 緯度 $MIN_LAT-$MAX_LAT"
echo "Overpass APIからデータを取得中..."

# Overpass QLクエリ
QUERY="[bbox:$MIN_LAT,$MIN_LON,$MAX_LAT,$MAX_LON][timeout:300];(node;way;relation;);out;"

# データをダウンロード (XML形式)
curl -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "data=$QUERY" \
  "https://overpass-api.de/api/interpreter" \
  -o data/map.osm

# osmiumがインストールされているか確認
if command -v osmium &> /dev/null; then
    echo "OSMファイルをPBF形式に変換中..."
    osmium cat data/map.osm -o data/map.osm.pbf
    rm data/map.osm
else
    echo ""
    echo "⚠️  osmiumツールがインストールされていません。"
    echo "PBF形式への変換をスキップします。"
    echo ""
    echo "osmiumをインストールするには:"
    echo "  macOS: brew install osmium-tool"
    echo "  Ubuntu: sudo apt-get install osmium-tool"
    echo ""
    echo "XMLファイルのままGraphHopperを使用する場合、処理が遅くなる可能性があります。"
    mv data/map.osm data/map.osm.pbf
fi

# ダウンロード結果を確認
if [ -f "data/map.osm.pbf" ]; then
    size=$(ls -lh data/map.osm.pbf | awk '{print $5}')
    echo ""
    echo "✅ ダウンロード完了!"
    echo "ファイルサイズ: $size"
    echo "エリア: $CITY"
    echo ""
    echo "次のステップ:"
    echo "1. docker-compose up -d でサービスを起動"
    echo "2. http://localhost:5173 でアプリケーションにアクセス"
else
    echo ""
    echo "❌ ダウンロードに失敗しました。"
    exit 1
fi