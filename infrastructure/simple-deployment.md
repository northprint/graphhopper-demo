# シンプルなデプロイ構成案

## 現在の構成の問題点
1. 3つの独立したCDKスタック（Network、API、Frontend）
2. 複雑なネットワーク設定（VPC、サブネット、NAT Gateway）
3. 高コスト（NAT Gateway、ALB、ECS Fargate、CloudFront）

## 提案：シンプルな2層構成

### Option 1: EC2単体構成（最もシンプル）
```
[CloudFront] → [EC2 (GraphHopper + Nginx)]
```

**メリット:**
- 単一のEC2インスタンスで全て完結
- 月額コスト: 約$10-20
- 設定がシンプル

**構成:**
```typescript
// 単一スタックで全てを管理
export class SimpleGraphHopperStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. EC2インスタンス（GraphHopper + 静的ファイル配信）
    const instance = new ec2.Instance(this, 'GraphHopper', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      userData: ec2.UserData.custom(`
        #!/bin/bash
        # Install Java, Nginx
        yum install -y java-17-amazon-corretto nginx
        
        # Setup GraphHopper
        wget https://repo1.maven.org/maven2/com/graphhopper/graphhopper-web/9.1/graphhopper-web-9.1.jar
        
        # Setup Nginx for static files + reverse proxy
        # ...
      `),
    });

    // 2. CloudFront（オプション）
    new cloudfront.Distribution(this, 'CDN', {
      defaultBehavior: {
        origin: new origins.HttpOrigin(instance.instancePublicDnsName),
      },
    });
  }
}
```

### Option 2: Lambda + S3構成（サーバーレス）
```
[CloudFront] → [S3 (Frontend)] 
     ↓
[API Gateway] → [Lambda (GraphHopper API)]
```

**メリット:**
- 完全サーバーレス
- 使用分のみ課金
- 自動スケーリング

**課題:**
- GraphHopperをLambdaで動かすのは困難（メモリ/実行時間制限）

### Option 3: App Runner構成（推奨）
```
[CloudFront] → [S3 (Frontend)]
     ↓
[App Runner (GraphHopper)]
```

**メリット:**
- ECSより簡単
- 自動スケーリング
- HTTPSエンドポイント提供

**簡潔な実装:**
```typescript
export class GraphHopperStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. S3 + CloudFront（フロントエンド）
    const bucket = new s3.Bucket(this, 'Frontend', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const distribution = new cloudfront.Distribution(this, 'CDN', {
      defaultBehavior: {
        origin: new origins.S3StaticWebsiteOrigin(bucket),
      },
    });

    // 2. App Runner（GraphHopper API）
    new apprunner.CfnService(this, 'GraphHopperAPI', {
      sourceConfiguration: {
        imageRepository: {
          imageIdentifier: `${repository.repositoryUri}:latest`,
          imageRepositoryType: 'ECR',
        },
      },
    });

    new s3deploy.BucketDeployment(this, 'Deploy', {
      sources: [s3deploy.Source.asset('../apps/web/build')],
      destinationBucket: bucket,
      distribution,
    });
  }
}
```

## GitHub Actionsの簡素化

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1
      
      - name: Build and Deploy
        run: |
          # Docker build & push
          docker build -t graphhopper .
          docker tag graphhopper:latest $ECR_URI:latest
          docker push $ECR_URI:latest
          
          # Frontend build & deploy
          cd apps/web
          npm run build
          aws s3 sync build/ s3://$BUCKET --delete
          
          # Update App Runner
          aws apprunner start-deployment --service-arn $SERVICE_ARN
```

## 推奨事項

1. **開発環境**: Docker Composeでローカル開発
2. **本番環境**: App Runner + S3/CloudFront
3. **コスト**: 月額$30-50程度

この構成なら：
- VPC不要
- ALB不要  
- NAT Gateway不要
- 設定がシンプル
- デプロイが高速