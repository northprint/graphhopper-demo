# Production Dockerfile for GraphHopper

このDockerfileは本番環境用のGraphHopperイメージをビルドするために設計されています。

## ビルド方法

プロジェクトのルートディレクトリから以下のコマンドを実行してください：

```bash
# ローカルビルド
docker build -f services/graphhopper/Dockerfile.production -t graphhopper-demo .

# GitHub Actions（CI/CD）での使用
# .github/workflows/deploy.yml で自動実行されます
```

## 重要な注意事項

1. **ビルドコンテキスト**: このDockerfileはプロジェクトのルートディレクトリからビルドする必要があります。これは以下の理由によります：
   - OSMデータファイル（`data/map.osm.pbf`）へのアクセス
   - 設定ファイル（`services/graphhopper/config-demo.yml`）へのアクセス

2. **データファイル**: 
   - 軽量版のOSMデータ（渋谷エリア）を使用
   - 必要に応じて`data/map.osm.pbf`を別のデータに置き換え可能

3. **メモリ設定**:
   - デフォルト: `-Xmx512m -Xms256m`
   - 環境変数`JAVA_OPTS`で調整可能

## 本番環境での実行

```bash
# 基本的な実行
docker run -p 8989:8989 graphhopper-demo

# メモリ設定をカスタマイズ
docker run -p 8989:8989 -e JAVA_OPTS="-Xmx1g -Xms512m" graphhopper-demo
```

## ヘルスチェック

コンテナには自動ヘルスチェックが設定されています：
- エンドポイント: `http://localhost:8989/health`
- 間隔: 30秒
- タイムアウト: 10秒
- 開始期間: 60秒（GraphHopperの初期化時間を考慮）