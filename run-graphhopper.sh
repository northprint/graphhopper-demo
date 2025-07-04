#!/bin/bash

# GraphHopperの簡易起動スクリプト

# GraphHopper JARファイルのダウンロード
if [ ! -f "graphhopper.jar" ]; then
    echo "GraphHopper JARファイルをダウンロード中..."
    wget -O graphhopper.jar https://repo1.maven.org/maven2/com/graphhopper/graphhopper-web/9.1/graphhopper-web-9.1.jar
fi

# OSMファイルの確認
if [ ! -f "data/map.osm.pbf" ]; then
    echo "OSMファイルが見つかりません。scripts/download-demo-data.sh を実行してください。"
    exit 1
fi

# GraphHopperの起動
echo "GraphHopperを起動中..."
java -Xmx2g -Xms1g -Dgraphhopper.datareader.file=data/map.osm.pbf -Dgraphhopper.graph.location=data/graph-cache -jar graphhopper.jar server