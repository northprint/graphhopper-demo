# AWS プロファイル設定

このプロジェクトでは `graphhopper-demo` プロファイルを使用します。

## プロファイルの設定

```bash
# graphhopper-demo プロファイルを作成
aws configure --profile graphhopper-demo
```

以下の情報を入力：
- AWS Access Key ID: [IAMユーザーのアクセスキー]
- AWS Secret Access Key: [IAMユーザーのシークレットキー]
- Default region name: ap-northeast-1
- Default output format: json

## プロファイルの使用方法

### 1. 環境変数で設定（推奨）
```bash
export AWS_PROFILE=graphhopper-demo
```

### 2. コマンドごとに指定
```bash
aws ecr describe-repositories --profile graphhopper-demo
```

### 3. CDKでの使用
```bash
cd infrastructure
export AWS_PROFILE=graphhopper-demo
cdk deploy --all
```

## 確認コマンド

```bash
# 現在のプロファイルを確認
aws configure list --profile graphhopper-demo

# ECRリポジトリを確認
aws ecr describe-repositories --repository-names graphhopper-demo --profile graphhopper-demo

# アカウントIDを確認
aws sts get-caller-identity --profile graphhopper-demo
```

## トラブルシューティング

### プロファイルが見つからない場合
```bash
# 利用可能なプロファイルを確認
aws configure list-profiles

# 設定ファイルを直接確認
cat ~/.aws/config
cat ~/.aws/credentials
```

### 権限エラーが発生する場合
IAMユーザーに必要な権限が付与されているか確認してください。
必要な権限は `infrastructure/iam/github-actions-policy.json` を参照してください。