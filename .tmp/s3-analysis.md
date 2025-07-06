# S3を使用した大規模地図データ対応の分析

## 1. 現在の構成の分析

### 現在のシンプルな構成（simple-server.js）
- Node.jsのHTTPサーバーがGraphHopperのJavaプロセスをラップ
- ポート8990でリクエストを受け、内部のポート8991で動作するGraphHopperにプロキシ
- ヘルスチェックエンドポイント（/health）を提供
- CORSヘッダーの処理
- GraphHopperプロセスの起動と管理

### 現在のデータ読み込み方法
- Dockerイメージビルド時にOSMデータ（map.osm.pbf）をコピー
- GraphHopperは`/graphhopper/data/map.osm.pbf`から直接読み込み
- 設定ファイル（config-apprunner.yml）で指定

## 2. 関東地方のデータサイズとメモリ制限

### OSMデータのサイズ
- **関東地方（kanto-latest.osm.pbf）: 415MB**
- 圧縮されたPBF形式でのサイズ
- 処理後のグラフキャッシュはさらに大きくなる（通常2-3倍）

### App Runnerの制限
- **最大メモリ: 4GB**（最大構成）
- **エフェメラルストレージ: 3GB**（固定）
  - このうち一部はDockerイメージ自体に使用される
  - 実際に使用可能なのは約2GB程度

### メモリ要件の分析
- OSMファイル: 415MB
- GraphHopperの処理中: 約1-2GB（データサイズによる）
- グラフキャッシュ: 約1-1.5GB
- **合計: 約2.5-4GB必要**

## 3. GraphHopperのS3サポート

### 直接サポートの有無
- **GraphHopperはS3からの直接読み込みをサポートしていない**
- `setOSMFile()`メソッドはローカルファイルパスを期待
- 分散システム（Spark等）での使用にも制限がある

### 必要な対応
1. S3からローカルファイルシステムへのダウンロード
2. ダウンロード後にGraphHopperで処理
3. 処理済みのグラフキャッシュも保存が必要

## 4. 実装方法の検討

### 方法1: 起動時にS3からダウンロード（シンプル）
```javascript
// simple-server.jsに追加
const AWS = require('aws-sdk');
const fs = require('fs');
const s3 = new AWS.S3();

async function downloadFromS3() {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: process.env.S3_KEY || 'kanto-latest.osm.pbf'
  };
  
  const file = fs.createWriteStream('/graphhopper/data/map.osm.pbf');
  const stream = s3.getObject(params).createReadStream();
  
  return new Promise((resolve, reject) => {
    stream.pipe(file)
      .on('finish', resolve)
      .on('error', reject);
  });
}
```

### 方法2: グラフキャッシュをS3に保存（効率的）
- 初回起動時: OSMファイルをダウンロードして処理
- 処理済みのグラフキャッシュをS3にアップロード
- 次回以降: グラフキャッシュをダウンロード（高速）

### 方法3: EFSマウント（複雑だが理想的）
- App RunnerはEFSをサポートしていない
- この方法は使用不可

## 5. App Runnerのインスタンスロールに必要な権限

```typescript
// S3読み取り権限を追加
instanceRole.addToPolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: [
    's3:GetObject',
    's3:ListBucket'
  ],
  resources: [
    'arn:aws:s3:::your-bucket-name/*',
    'arn:aws:s3:::your-bucket-name'
  ]
}));

// グラフキャッシュを保存する場合は書き込み権限も必要
instanceRole.addToPolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: [
    's3:PutObject'
  ],
  resources: [
    'arn:aws:s3:::your-bucket-name/graph-cache/*'
  ]
}));
```

## 6. 実装の複雑さと推奨解決策

### 複雑さの評価

1. **シンプルなダウンロード方式**
   - 実装難易度: 低
   - 起動時間: 遅い（415MBのダウンロード + 処理）
   - メモリ使用: 高い

2. **グラフキャッシュ方式**
   - 実装難易度: 中
   - 起動時間: 初回は遅い、2回目以降は速い
   - メモリ使用: 中程度

3. **ストリーミング処理**
   - GraphHopperが対応していないため不可

### 推奨される解決策

**段階的アプローチ:**

1. **Phase 1: シンプルな実装**
   - 起動時にS3からOSMファイルをダウンロード
   - メモリを4GBに増強
   - ダウンロード中のヘルスチェック対応

2. **Phase 2: 最適化**
   - グラフキャッシュのS3保存/復元
   - キャッシュの有効性チェック
   - 複数リージョンのサポート

### 課題と制限事項

1. **ストレージ制限**
   - 3GBのエフェメラルストレージでは関東地方データ（415MB）+ グラフキャッシュ（約1GB）がギリギリ
   - より大きなリージョンには対応困難

2. **起動時間**
   - S3からのダウンロード: 約1-2分
   - GraphHopper処理: 約3-5分
   - 合計: 約5-7分の起動時間

3. **コスト**
   - S3データ転送料金
   - App Runnerの長い起動時間

## 7. 結論

### 現実的な実装方針

1. **小規模データ（< 200MB）の場合**
   - 現在の方式（Dockerイメージに含める）を継続

2. **中規模データ（200MB - 1GB）の場合**
   - S3からの起動時ダウンロード
   - グラフキャッシュの保存/復元で高速化

3. **大規模データ（> 1GB）の場合**
   - App Runnerの制限により対応困難
   - ECS/EC2での実装を検討

### 関東地方データ（415MB）の場合
- S3からのダウンロード方式が現実的
- メモリは4GBに設定
- 起動時間の長さを許容する必要あり
- グラフキャッシュの最適化で改善可能