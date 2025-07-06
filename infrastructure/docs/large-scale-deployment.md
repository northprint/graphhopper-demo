# 大規模地図データ対応ガイド

## 現状の課題

現在の構成では地図データ（約5MB）をDockerイメージに内包していますが、日本全国のデータでは以下の課題があります：

- **データサイズ**: 日本全体で約1.5GB
- **処理時間**: GraphHopperの初回グラフ構築に2-4時間
- **メモリ使用量**: 8-16GB必要
- **Dockerイメージサイズ**: 2GB以上になる

## 解決策

### 方法1: S3 + 起動時ダウンロード（App Runner継続）

```yaml
# 構成
S3バケット
├── osm-data/
│   └── japan-latest.osm.pbf  # 元データ
└── graph-cache/
    └── japan-car-ch/          # 処理済みグラフ
```

**メリット**:
- App Runnerをそのまま使える
- データ更新が容易

**デメリット**:
- 起動時のダウンロードに時間がかかる（5-10分）
- 毎回の起動でS3転送料金が発生

### 方法2: ECS Fargate + EFS（推奨）

```yaml
# 構成
EFS
├── osm-data/
│   └── japan-latest.osm.pbf
└── graph-cache/
    └── japan-car-ch/
```

**メリット**:
- 高速な起動（EFSマウント）
- 複数のコンテナで共有可能
- 一度処理したグラフを永続化

**デメリット**:
- App RunnerからECS Fargateへの移行が必要
- 若干複雑な構成

### 方法3: 事前処理 + CDN配信

```yaml
# 構成
1. GitHub Actions/CodeBuildで定期的に処理
2. 処理済みグラフをS3に保存
3. CloudFront経由で配信
4. App Runnerは起動時にダウンロード（キャッシュ済み）
```

**メリット**:
- CDNによる高速配信
- グローバル対応可能

**デメリット**:
- 初期構築が複雑

## 実装例（方法1: S3 + App Runner）

### 1. S3バケットの作成

```typescript
// infrastructure/lib/stacks/data-storage-stack.ts
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';

export class DataStorageStack extends cdk.Stack {
  public readonly dataBucket: s3.Bucket;
  
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    this.dataBucket = new s3.Bucket(this, 'GraphHopperData', {
      bucketName: 'graphhopper-japan-data',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [{
        id: 'delete-old-graphs',
        prefix: 'graph-cache/',
        expiration: cdk.Duration.days(30),
      }],
    });
  }
}
```

### 2. 起動スクリプトの変更

```javascript
// services/graphhopper/startup.js
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

const s3 = new AWS.S3();
const BUCKET = process.env.DATA_BUCKET;

async function downloadFromS3(key, localPath) {
  console.log(`Downloading ${key} from S3...`);
  const params = {
    Bucket: BUCKET,
    Key: key,
  };
  
  const file = fs.createWriteStream(localPath);
  const stream = s3.getObject(params).createReadStream();
  
  return new Promise((resolve, reject) => {
    stream.pipe(file)
      .on('finish', resolve)
      .on('error', reject);
  });
}

async function initialize() {
  // グラフキャッシュが存在するか確認
  const graphCacheExists = await s3.headObject({
    Bucket: BUCKET,
    Key: 'graph-cache/japan-car-ch/nodes'
  }).promise().catch(() => false);
  
  if (graphCacheExists) {
    // 処理済みグラフをダウンロード
    console.log('Downloading pre-processed graph...');
    await downloadGraphCache();
  } else {
    // OSMデータをダウンロードして処理
    console.log('Downloading OSM data...');
    await downloadFromS3('osm-data/japan-latest.osm.pbf', '/data/japan.osm.pbf');
    
    // GraphHopperで処理
    await processGraph();
    
    // 処理結果をS3にアップロード
    await uploadGraphCache();
  }
}
```

### 3. メモリ最適化設定

```yaml
# services/graphhopper/config-large.yml
graphhopper:
  datareader.file: /data/japan.osm.pbf
  graph.location: /data/graph-cache
  
  # メモリ最適化
  import.osm.max_read_threads: 2
  routing.ch.disabling_allowed: true
  
  # 処理を高速化
  graph.dataaccess: MMAP
  
  profiles:
    - name: car
      weighting: fastest
      turn_costs: false  # メモリ節約
```

## 推定コストとパフォーマンス

### App Runner + S3
- **月額**: 約$50-70
- **起動時間**: 5-10分
- **レスポンス**: 初回遅い、以降高速

### ECS Fargate + EFS
- **月額**: 約$80-120
- **起動時間**: 1-2分
- **レスポンス**: 常に高速

## 段階的移行プラン

1. **Phase 1**: 関東地方のみ（約200MB）でテスト
2. **Phase 2**: 本州全体（約800MB）
3. **Phase 3**: 日本全国（約1.5GB）

各フェーズでパフォーマンスとコストを評価し、最適な構成を選択します。