# GraphHopper Demo - クラウドデプロイメントガイド

## 推奨構成

### 1. **Vercel + Railway/Render（推奨）**
最も簡単で、個人プロジェクトに最適です。

#### 構成
- **フロントエンド**: Vercel（SvelteKit）
- **GraphHopper API**: Railway または Render（Dockerコンテナ）
- **データ**: コンテナに含める

#### メリット
- ✅ セットアップが簡単
- ✅ 無料枠あり
- ✅ 自動デプロイ
- ✅ SSL証明書自動設定

#### デプロイ手順

##### 1. GraphHopper API (Railway)
```bash
# railway.toml を作成
cat > railway.toml << EOF
[build]
builder = "DOCKERFILE"
dockerfilePath = "services/graphhopper/Dockerfile"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
EOF

# Railwayにデプロイ
railway login
railway init
railway up
```

##### 2. フロントエンド (Vercel)
```bash
# vercel.json を作成
cat > apps/web/vercel.json << EOF
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".svelte-kit/output",
  "framework": "sveltekit"
}
EOF

# 環境変数を設定
echo "PUBLIC_GRAPHHOPPER_URL=https://your-api.railway.app" > apps/web/.env.production

# Vercelにデプロイ
cd apps/web
vercel
```

### 2. **AWS ECS + CloudFront**
本番環境向けのスケーラブルな構成です。

#### 構成
```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│   CloudFront    │────▶│   S3 Bucket  │     │  ECS Fargate│
│      (CDN)      │     │  (SvelteKit) │     │(GraphHopper)│
└─────────────────┘     └──────────────┘     └─────────────┘
                                                     │
                                              ┌──────────────┐
                                              │   EFS/S3     │
                                              │ (OSM Data)   │
                                              └──────────────┘
```

#### Terraform構成例
```hcl
# terraform/main.tf
module "graphhopper" {
  source = "./modules/ecs"
  
  service_name = "graphhopper-api"
  container_image = "${aws_ecr_repository.graphhopper.repository_url}:latest"
  cpu = 512
  memory = 1024
  
  environment_variables = {
    JAVA_OPTS = "-Xmx768m -Xms512m"
  }
}

module "frontend" {
  source = "./modules/s3-cloudfront"
  
  bucket_name = "graphhopper-demo-frontend"
  domain_name = "demo.example.com"
}
```

### 3. **Google Cloud Run + Firebase Hosting**
サーバーレスで自動スケーリングが可能です。

#### デプロイ設定
```yaml
# cloudbuild.yaml
steps:
  # GraphHopper APIをビルド
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/graphhopper', './services/graphhopper']
  
  # Cloud Runにデプロイ
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'graphhopper-api'
      - '--image=gcr.io/$PROJECT_ID/graphhopper'
      - '--region=asia-northeast1'
      - '--memory=1Gi'
      - '--cpu=1'
```

### 4. **Kubernetes (GKE/EKS)**
大規模運用向けです。

```yaml
# k8s/graphhopper-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: graphhopper
spec:
  replicas: 2
  selector:
    matchLabels:
      app: graphhopper
  template:
    metadata:
      labels:
        app: graphhopper
    spec:
      containers:
      - name: graphhopper
        image: your-registry/graphhopper:latest
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        ports:
        - containerPort: 8989
        volumeMounts:
        - name: osm-data
          mountPath: /data
      volumes:
      - name: osm-data
        persistentVolumeClaim:
          claimName: osm-data-pvc
```

## 本番環境の考慮事項

### 1. データの管理
```yaml
# docker-compose.prod.yml
services:
  graphhopper:
    build:
      context: ./services/graphhopper
      args:
        - OSM_DATA_URL=https://your-cdn.com/japan-kanto.osm.pbf
    environment:
      - GRAPH_CACHE_LOCATION=/data/graph-cache
    volumes:
      - graph-data:/data
```

### 2. セキュリティ
- CORS設定
- レート制限
- API認証（必要に応じて）

### 3. パフォーマンス最適化
- GraphHopperのメモリ設定調整
- CDNによる静的アセット配信
- 適切なインスタンスサイズの選択

### 4. 監視とログ
- Datadogやnew Relicなどの監視ツール
- ログの集約と分析

## コスト見積もり

### 小規模（個人・デモ）
- **Vercel + Railway**: 月額$0-20
- **データ転送量**: 〜100GB/月

### 中規模（商用）
- **AWS ECS**: 月額$50-200
- **データ転送量**: 〜1TB/月
- **ストレージ**: 〜100GB

### 大規模（エンタープライズ）
- **Kubernetes**: 月額$500+
- **複数リージョン対応**
- **自動スケーリング**

## 推奨事項

1. **まずは Vercel + Railway で始める**
   - 設定が簡単
   - 無料枠で試せる
   - 必要に応じてスケールアップ

2. **データは事前処理**
   - ビルド時にOSMデータを含める
   - 大きなデータはCDNから配信

3. **環境変数の管理**
   - 各環境で適切に設定
   - シークレット管理サービスを使用

4. **CI/CDパイプライン**
   - GitHub Actionsでの自動デプロイ
   - ステージング環境の用意