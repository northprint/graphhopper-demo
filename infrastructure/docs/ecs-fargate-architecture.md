# ECS Fargate アーキテクチャ

## 構成概要

```
Internet
    ↓
Application Load Balancer (ALB)
    ↓
ECS Fargate Service
├── GraphHopper API (ポート8989)
└── Frontend (ポート3000)
```

## 主要コンポーネント

### 1. ネットワーク層
- **VPC**: 専用VPC（10.0.0.0/16）
- **パブリックサブネット**: ALB用（2AZ）
- **プライベートサブネット**: ECS Task用（2AZ）
- **NAT Gateway**: プライベートサブネットからの外部通信用

### 2. ロードバランサー
- **Application Load Balancer (ALB)**
  - GraphHopper API: `/api/*` → ポート8989
  - Frontend: `/*` → ポート3000
  - ヘルスチェック設定可能
  - SSL/TLS終端

### 3. ECS クラスター
- **Fargate起動タイプ**
  - サーバー管理不要
  - オートスケーリング対応
  - 料金は使用したリソース分のみ

### 4. ECS サービス
#### GraphHopper API Service
- CPU: 2 vCPU
- メモリ: 4 GB
- タスク数: 1-3（オートスケーリング）
- ヘルスチェック: `/health`

#### Frontend Service
- CPU: 0.5 vCPU
- メモリ: 1 GB
- タスク数: 1-3（オートスケーリング）

### 5. その他のリソース
- **CloudWatch Logs**: ログ収集
- **ECR**: Dockerイメージ保存
- **Secrets Manager**: 環境変数の管理（オプション）

## メリット

1. **安定性**: App Runnerより詳細な設定が可能
2. **ログ**: CloudWatch Logsで詳細なログ確認
3. **スケーラビリティ**: CPU/メモリベースの自動スケーリング
4. **柔軟性**: タスク定義で細かい設定可能
5. **監視**: CloudWatchメトリクスで詳細な監視

## コスト比較

### App Runner
- 0.064 USD/vCPU時間
- 0.007 USD/GB時間
- リクエスト単位の課金

### ECS Fargate
- 0.04048 USD/vCPU時間
- 0.004445 USD/GB時間
- 最小1分単位の課金

※東京リージョンの料金

## 実装の流れ

1. VPCとネットワークの構築
2. ALBの設定
3. ECSクラスターの作成
4. タスク定義の作成
5. ECSサービスの起動
6. オートスケーリングの設定