#!/bin/bash

# デモ用の軽量OSMデータをダウンロードするスクリプト

echo "GraphHopper Demo - 軽量データダウンロード"
echo "========================================="
echo ""

# データディレクトリの作成
mkdir -p data

# 選択肢を表示
echo "デモ用の軽量データを選択してください:"
echo "1) リヒテンシュタイン (1.7MB) - ヨーロッパの小国"
echo "2) モナコ (458KB) - 超小型の都市国家"
echo "3) アンドラ (3.6MB) - ピレネー山脈の小国"
echo "4) モルディブ (3.1MB) - 島国"
echo "5) 東京の一部 (Kanto地方の抽出版、約50MB)"
echo "6) カスタム (URLを直接入力)"

read -p "選択してください (1-6): " choice

case $choice in
    1)
        echo "リヒテンシュタインのデータをダウンロード中..."
        wget -O data/map.osm.pbf https://download.geofabrik.de/europe/liechtenstein-latest.osm.pbf
        ;;
    2)
        echo "モナコのデータをダウンロード中..."
        wget -O data/map.osm.pbf https://download.geofabrik.de/europe/monaco-latest.osm.pbf
        ;;
    3)
        echo "アンドラのデータをダウンロード中..."
        wget -O data/map.osm.pbf https://download.geofabrik.de/europe/andorra-latest.osm.pbf
        ;;
    4)
        echo "モルディブのデータをダウンロード中..."
        wget -O data/map.osm.pbf https://download.geofabrik.de/asia/maldives-latest.osm.pbf
        ;;
    5)
        echo "東京地域のデータをダウンロード中..."
        # BBBikeの東京抽出版（軽量）
        wget -O data/map.osm.pbf "https://download.bbbike.org/osm/bbbike/Tokyo/Tokyo.osm.pbf"
        ;;
    6)
        read -p "OSM PBFファイルのURLを入力してください: " custom_url
        echo "カスタムデータをダウンロード中..."
        wget -O data/map.osm.pbf "$custom_url"
        ;;
    *)
        echo "無効な選択です。終了します。"
        exit 1
        ;;
esac

# ダウンロード結果を確認
if [ -f "data/map.osm.pbf" ]; then
    size=$(ls -lh data/map.osm.pbf | awk '{print $5}')
    echo ""
    echo "✅ ダウンロード完了!"
    echo "ファイルサイズ: $size"
    echo ""
    echo "次のステップ:"
    echo "1. docker-compose up -d でサービスを起動"
    echo "2. http://localhost:5173 でアプリケーションにアクセス"
else
    echo ""
    echo "❌ ダウンロードに失敗しました。"
    exit 1
fi