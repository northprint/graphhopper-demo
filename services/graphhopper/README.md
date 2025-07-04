# GraphHopper 設定ガイド

## 概要

このドキュメントでは、GraphHopper 9.1の設定方法とローカルでの動作確認手順を説明します。

## 設定ファイル

### config-demo.yml（推奨設定）

GraphHopper 9.1で動作確認済みの設定ファイルです。

```yaml
graphhopper:
  datareader.file: /graphhopper/data/map.osm.pbf
  graph.location: /graphhopper/graph-cache
  import.osm.ignored_highways: ""
  graph.elevation.provider: ""
  graph.encoded_values: road_class, road_environment, max_speed, surface
  
  profiles:
    - name: car
      weighting: custom
      custom_model:
        speed:
          - if: "true"
            limit_to: 130

  routing:
    max_visited_nodes: 1000000

server:
  application_connectors:
    - type: http
      port: 8989
      bind_host: 0.0.0.0
```

## 重要な変更点（GraphHopper 8.0 → 9.1）

1. **プロファイル設定**
   - `vehicle`プロパティは削除されました
   - カスタムモデルには最低1つの`speed`ステートメントが必要です

2. **エンコード値**
   - `graph.flag_encoders`は使用されません
   - `graph.encoded_values`で必要な値を指定します

3. **カスタムモデル**
   - 空のカスタムモデル`{}`は許可されません
   - 最低限の速度制限を設定する必要があります

## 動作確認

### ヘルスチェック
```bash
curl http://localhost:8989/health
```

### ルート検索（モナコの例）
```bash
curl "http://localhost:8989/route?point=43.7347,7.4203&point=43.7384,7.4276&profile=car"
```

### GraphHopper情報の取得
```bash
curl http://localhost:8989/info
```

## トラブルシューティング

### エラー: "At least one initial statement under 'speed' is required"
カスタムモデルに最低1つの速度設定を追加してください：
```yaml
custom_model:
  speed:
    - if: "true"
      limit_to: 130
```

### エラー: "vehicle no longer accepted in profile"
GraphHopper 9.1では`vehicle`プロパティは使用できません。削除してください。

### エラー: "Missing 'import.osm.ignored_highways'"
このパラメータは必須です。空文字列でも設定が必要です：
```yaml
import.osm.ignored_highways: ""
```