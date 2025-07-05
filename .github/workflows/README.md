# GitHub Actions ワークフロー

## deploy.yml - AWS自動デプロイ

このワークフローは、mainブランチへのプッシュ時にAWS環境に自動デプロイします。

### 必要なGitHub Secrets

以下のシークレットをGitHubリポジトリに設定してください：

```
AWS_ACCESS_KEY_ID       # AWSアクセスキー
AWS_SECRET_ACCESS_KEY   # AWSシークレットキー
AWS_ACCOUNT_ID          # AWSアカウントID（12桁）
```

### ワークフローの流れ

1. **ECRへのDockerイメージプッシュ**
   - GraphHopper APIのDockerイメージをビルド
   - Amazon ECRにプッシュ

2. **CDKによるインフラデプロイ**
   - VPC、ALB、ECS Fargate、S3、CloudFrontをデプロイ
   - 既存のスタックがある場合は更新

3. **ECSサービスの更新**
   - 新しいDockerイメージでサービスを更新
   - ローリングアップデート

4. **フロントエンドのビルドとデプロイ**
   - SvelteKitアプリをビルド
   - S3にアップロード
   - CloudFrontのキャッシュを無効化

### 手動実行

Actions タブから "Deploy to AWS" ワークフローを選択し、"Run workflow" で手動実行も可能です。

### トラブルシューティング

#### ECRプッシュが失敗する場合
- AWS認証情報が正しいか確認
- ECRリポジトリが存在するか確認

#### CDKデプロイが失敗する場合
- AWS_ACCOUNT_IDが正しく設定されているか確認
- IAMロールに必要な権限があるか確認

#### フロントエンドデプロイが失敗する場合
- S3バケットへの書き込み権限があるか確認
- CloudFront DistributionのIDが正しいか確認