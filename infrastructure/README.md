# GraphHopper Demo - AWS Infrastructure (CDK)

## アーキテクチャ

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   CloudFront    │────▶│   S3 Bucket  │     │  ALB (Public)   │
│  (Distribution) │     │  (Frontend)  │     │                 │
└─────────────────┘     └──────────────┘     └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │  ECS Fargate    │
                                              │  (GraphHopper)  │
                                              │  ・2 Tasks      │
                                              │  ・Auto Scaling │
                                              └─────────────────┘
```

## セットアップ

### 前提条件
- AWS CLI設定済み
- Node.js 18以上
- Docker（ECRへのプッシュ用）

### 1. CDKのインストール
```bash
cd infrastructure
pnpm install
pnpm cdk bootstrap
```

### 2. GraphHopperイメージのビルドとプッシュ
```bash
# ECRにログイン
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin [ACCOUNT_ID].dkr.ecr.ap-northeast-1.amazonaws.com

# イメージをビルド
cd ../services/graphhopper
docker build -f Dockerfile.production -t graphhopper-demo .

# タグ付けとプッシュ
docker tag graphhopper-demo:latest [ACCOUNT_ID].dkr.ecr.ap-northeast-1.amazonaws.com/graphhopper-demo:latest
docker push [ACCOUNT_ID].dkr.ecr.ap-northeast-1.amazonaws.com/graphhopper-demo:latest
```

### 3. フロントエンドのビルド
```bash
cd ../../apps/web
# 環境変数を設定（CDKデプロイ後に取得したURLを使用）
echo "PUBLIC_GRAPHHOPPER_URL=https://[CLOUDFRONT_DOMAIN]/api" > .env.production
pnpm build
```

### 4. CDKデプロイ
```bash
cd ../../infrastructure

# すべてのスタックをデプロイ
pnpm cdk deploy --all

# または個別にデプロイ
pnpm cdk deploy GraphHopperNetworkStack
pnpm cdk deploy GraphHopperApiStack
pnpm cdk deploy GraphHopperFrontendStack
```

## 環境変数とコンテキスト

### カスタムドメインを使用する場合
```bash
cdk deploy --all --context domainName=example.com
```

### デプロイ時の出力例
```
Outputs:
GraphHopperNetworkStack.AlbDnsName = graphhopper-alb-123456.ap-northeast-1.elb.amazonaws.com
GraphHopperApiStack.ApiUrl = http://graphhopper-alb-123456.ap-northeast-1.elb.amazonaws.com
GraphHopperApiStack.EcrRepositoryUri = 123456789012.dkr.ecr.ap-northeast-1.amazonaws.com/graphhopper-demo
GraphHopperFrontendStack.DistributionUrl = https://d1234567890.cloudfront.net
```

## 運用

### ログの確認
```bash
# ECSタスクのログ
aws logs tail /ecs/graphhopper --follow

# 最新のログを取得
aws logs filter-log-events --log-group-name /ecs/graphhopper --start-time $(date -u -d '5 minutes ago' +%s)000
```

### スケーリング設定
- 最小タスク数: 1
- 最大タスク数: 4
- CPU使用率: 70%でスケールアウト
- メモリ使用率: 80%でスケールアウト

### コスト最適化
- Fargate Spotを優先的に使用（weight: 2）
- 通常のFargateをフォールバック（weight: 1）
- CloudFrontでキャッシュを活用

## トラブルシューティング

### ECSタスクが起動しない
```bash
# タスクの状態を確認
aws ecs describe-services --cluster graphhopper-cluster --services graphhopper-api

# タスクの停止理由を確認
aws ecs describe-tasks --cluster graphhopper-cluster --tasks [TASK_ARN]
```

### GraphHopperがOOMで停止する
- タスク定義のメモリを増やす（2048MB → 4096MB）
- JAVA_OPTSを調整（-Xmx1g → -Xmx3g）

### デプロイの更新
```bash
# 新しいイメージをプッシュ後
aws ecs update-service --cluster graphhopper-cluster --service graphhopper-api --force-new-deployment
```

## クリーンアップ
```bash
# すべてのリソースを削除
pnpm cdk destroy --all

# 個別に削除
pnpm cdk destroy GraphHopperFrontendStack
pnpm cdk destroy GraphHopperApiStack
pnpm cdk destroy GraphHopperNetworkStack
```