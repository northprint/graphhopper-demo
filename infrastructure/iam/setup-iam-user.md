# GitHub Actions用IAMユーザーの作成手順

## 1. AWS Management Consoleでの作成方法

### Step 1: IAMコンソールにアクセス
1. AWSコンソールにログイン
2. サービス検索で「IAM」と入力
3. IAMダッシュボードに移動

### Step 2: ユーザーの作成
1. 左メニューから「ユーザー」をクリック
2. 「ユーザーを作成」ボタンをクリック
3. ユーザー名: `github-actions-graphhopper-demo`
4. 「次へ」をクリック

### Step 3: 権限の設定
1. 「ポリシーを直接アタッチする」を選択
2. 「ポリシーを作成」をクリック（新しいタブが開きます）
3. 「JSON」タブを選択
4. `github-actions-policy.json`の内容をコピー＆ペースト
5. ポリシー名: `GitHubActionsGraphHopperPolicy`
6. 作成したポリシーをユーザーにアタッチ

### Step 4: アクセスキーの作成
1. 作成したユーザーを選択
2. 「セキュリティ認証情報」タブ
3. 「アクセスキーを作成」をクリック
4. 「その他」を選択
5. 説明タグ: `GitHub Actions Deploy`
6. アクセスキーとシークレットキーを安全に保存

## 2. AWS CLIでの作成方法

```bash
# ポリシーの作成
aws iam create-policy \
  --policy-name GitHubActionsGraphHopperPolicy \
  --policy-document file://infrastructure/iam/github-actions-policy.json

# ユーザーの作成
aws iam create-user \
  --user-name github-actions-graphhopper-demo

# ポリシーのアタッチ
aws iam attach-user-policy \
  --user-name github-actions-graphhopper-demo \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/GitHubActionsGraphHopperPolicy

# アクセスキーの作成
aws iam create-access-key \
  --user-name github-actions-graphhopper-demo
```

## 3. CDKでの作成方法

`infrastructure/lib/stacks/iam-stack.ts`を作成：

```typescript
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class IAMStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // GitHub Actions用ユーザー
    const githubActionsUser = new iam.User(this, 'GitHubActionsUser', {
      userName: 'github-actions-graphhopper-demo',
    });

    // ポリシーステートメント
    const policyDocument = JSON.parse(
      fs.readFileSync('./iam/github-actions-policy.json', 'utf8')
    );

    // ポリシーの作成とアタッチ
    const policy = new iam.Policy(this, 'GitHubActionsPolicy', {
      policyName: 'GitHubActionsGraphHopperPolicy',
      document: iam.PolicyDocument.fromJson(policyDocument),
    });

    githubActionsUser.attachInlinePolicy(policy);

    // アクセスキーの作成
    const accessKey = new iam.AccessKey(this, 'GitHubActionsAccessKey', {
      user: githubActionsUser,
    });

    // 出力（セキュアに扱うこと）
    new cdk.CfnOutput(this, 'AccessKeyId', {
      value: accessKey.accessKeyId,
      description: 'GitHub Actions Access Key ID',
    });

    new cdk.CfnOutput(this, 'SecretAccessKey', {
      value: accessKey.secretAccessKey.unsafeUnwrap(),
      description: 'GitHub Actions Secret Access Key (KEEP SECRET!)',
    });
  }
}
```

デプロイ：
```bash
cdk deploy IAMStack
```

## 4. GitHubにシークレットを設定

1. GitHubリポジトリの「Settings」タブ
2. 左メニューの「Secrets and variables」→「Actions」
3. 「New repository secret」をクリック
4. 以下を追加：
   - `AWS_ACCESS_KEY_ID`: 作成したアクセスキーID
   - `AWS_SECRET_ACCESS_KEY`: シークレットアクセスキー
   - `AWS_ACCOUNT_ID`: AWSアカウントID（12桁）

## セキュリティのベストプラクティス

### 1. 最小権限の原則
- 必要最小限の権限のみを付与
- 定期的に権限を見直し

### 2. アクセスキーの管理
- 定期的にローテーション（90日ごと推奨）
- 使用しないキーは削除
- キーは絶対に公開しない

### 3. MFA（多要素認証）
- IAMユーザーにはMFAを設定（コンソールアクセス時）
- プログラムアクセスのみの場合は不要

### 4. CloudTrailでの監査
- API呼び出しをログ記録
- 異常なアクセスパターンを監視

## トラブルシューティング

### 権限不足エラー
```
User: arn:aws:iam::123456789012:user/github-actions-graphhopper-demo is not authorized to perform: ecs:CreateCluster
```

解決方法：
1. 該当するアクションをポリシーに追加
2. ポリシーを更新してユーザーに再アタッチ

### アクセスキーが無効
- キーが正しくコピーされているか確認
- キーがアクティブか確認
- リージョンが正しいか確認