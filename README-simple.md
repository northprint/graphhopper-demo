# GraphHopper Demo - Simple Architecture

シンプルなApp Runner構成でGraphHopperデモを実行します。

## アーキテクチャ

- **GraphHopper API**: App Runner（コンテナ）
- **Frontend (SvelteKit SSR)**: App Runner（コンテナ）
- **OSM Data**: S3バケット
- **Container Registry**: ECR

## 特徴

- VPC、ALB、NAT Gatewayが不要
- 自動スケーリング対応
- HTTPSが標準で有効
- 管理が簡単

## デプロイ方法

### 1. ブランチを切り替え

```bash
git checkout -b simple
```

### 2. GitHub Secretsを設定

以下のSecretsを設定してください：
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ACCOUNT_ID`

### 3. デプロイ

```bash
git push origin simple
```

GitHub Actionsが自動的に以下を実行します：
1. ECRリポジトリの作成
2. Dockerイメージのビルドとプッシュ
3. App Runnerサービスのデプロイ

## ローカル開発

```bash
# 依存関係のインストール
pnpm install

# GraphHopper API起動
cd services/graphhopper
docker compose up

# Frontend開発サーバー起動
cd apps/web
pnpm dev
```

## URL

デプロイ後、GitHub ActionsのログまたはAWSコンソールで以下のURLを確認できます：
- GraphHopper API: `https://[api-service-id].ap-northeast-1.awsapprunner.com`
- Frontend: `https://[frontend-service-id].ap-northeast-1.awsapprunner.com`

## コスト

App Runnerの料金：
- vCPU: $0.064/時間
- メモリ: $0.007/GB/時間
- リクエスト: $0.00002/リクエスト

最小構成（API: 1vCPU/2GB、Frontend: 0.5vCPU/1GB）の場合：
- 月額約$70-100（トラフィックによる）