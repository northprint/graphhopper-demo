import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

interface GraphHopperStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  alb: elbv2.ApplicationLoadBalancer;
  certificate?: acm.Certificate;
}

export class GraphHopperStack extends cdk.Stack {
  public readonly apiUrl: string;
  public readonly service: ecs.FargateService;

  constructor(scope: Construct, id: string, props: GraphHopperStackProps) {
    super(scope, id, props);

    // ECRリポジトリ（既存のものを使用）
    const repository = ecr.Repository.fromRepositoryName(
      this,
      'Repository',
      'graphhopper-demo'
    );

    // OSMデータ用S3バケット（大きなデータの場合）
    const dataBucket = new s3.Bucket(this, 'DataBucket', {
      bucketName: `graphhopper-data-${cdk.Stack.of(this).account}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // 渋谷データをS3にアップロード
    new s3deploy.BucketDeployment(this, 'DataDeployment', {
      sources: [s3deploy.Source.asset('../data')],
      destinationBucket: dataBucket,
      destinationKeyPrefix: 'osm/',
    });

    // ECSクラスター
    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: props.vpc,
      clusterName: 'graphhopper-cluster',
      containerInsights: true,
    });

    // タスク定義
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB: 2048,
      cpu: 1024,
      taskRole: new iam.Role(this, 'TaskRole', {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        inlinePolicies: {
          S3Access: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                actions: ['s3:GetObject', 's3:ListBucket'],
                resources: [
                  dataBucket.bucketArn,
                  `${dataBucket.bucketArn}/*`,
                ],
              }),
            ],
          }),
        },
      }),
    });

    // ログ設定
    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: '/ecs/graphhopper',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // コンテナ定義
    const container = taskDefinition.addContainer('graphhopper', {
      image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
      memoryLimitMiB: 1536,
      cpu: 768,
      environment: {
        JAVA_OPTS: '-Xmx1g -Xms512m',
        GRAPH_LOCATION: '/graphhopper/graph-cache',
        OSM_FILE: '/graphhopper/data/map.osm.pbf',
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'graphhopper',
        logGroup,
      }),
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:8989/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    // ポートマッピング
    container.addPortMappings({
      containerPort: 8989,
      protocol: ecs.Protocol.TCP,
    });

    // ECSサービス
    this.service = new ecs.FargateService(this, 'Service', {
      cluster,
      taskDefinition,
      serviceName: 'graphhopper-api',
      desiredCount: 2,
      assignPublicIp: false,
      healthCheckGracePeriod: cdk.Duration.seconds(120),
      deploymentController: {
        type: ecs.DeploymentControllerType.ECS,
      },
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 2,
        },
        {
          capacityProvider: 'FARGATE',
          weight: 1,
        },
      ],
    });

    // Auto Scaling
    const scaling = this.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 4,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // サービスセキュリティグループの設定
    this.service.connections.allowFrom(props.alb, ec2.Port.tcp(8989), 'Allow ALB to access service');

    // ALBリスナー設定
    // HTTPリスナー
    const httpListener = props.alb.addListener('GraphHopperHttpListener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Not Found',
      }),
    });

    // HTTPリスナーにルールを追加
    httpListener.addTargets('GraphHopperHttpTargets', {
      port: 8989,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.service],
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // HTTPSリスナー（証明書がある場合）
    if (props.certificate) {
      const httpsListener = props.alb.addListener('GraphHopperHttpsListener', {
        port: 443,
        certificates: [props.certificate],
        defaultAction: elbv2.ListenerAction.fixedResponse(404, {
          contentType: 'text/plain',
          messageBody: 'Not Found',
        }),
      });

      // HTTPSリスナーにルールを追加
      httpsListener.addTargets('GraphHopperHttpsTargets', {
        port: 8989,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [this.service],
        healthCheck: {
          path: '/health',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(10),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
        deregistrationDelay: cdk.Duration.seconds(30),
      });

      // HTTPからHTTPSへのリダイレクトを設定
      httpListener.addAction('RedirectToHttps', {
        action: elbv2.ListenerAction.redirect({
          protocol: 'HTTPS',
          port: '443',
          permanent: true,
        }),
        priority: 1,
        conditions: [elbv2.ListenerCondition.pathPatterns(['*'])],
      });
    }

    // API URL
    this.apiUrl = `http://${props.alb.loadBalancerDnsName}`;

    // 出力
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.apiUrl,
      description: 'GraphHopper API URL',
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: repository.repositoryUri,
      description: 'ECR Repository URI',
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: this.service.serviceName,
      description: 'ECS Service Name',
    });
  }
}