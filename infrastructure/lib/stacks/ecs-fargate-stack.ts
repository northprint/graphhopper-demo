import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class EcsFargateStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPCの作成（シンプルな構成）
    const vpc = new ec2.Vpc(this, 'GraphHopperVpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // ECSクラスターの作成
    const cluster = new ecs.Cluster(this, 'GraphHopperCluster', {
      vpc,
      containerInsights: true,
    });

    // GraphHopper API サービス
    const graphhopperService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'GraphHopperApiService', {
      cluster,
      serviceName: 'graphhopper-api',
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry('201486033314.dkr.ecr.ap-northeast-1.amazonaws.com/graphhopper-api:latest'),
        containerPort: 8989,
        environment: {
          JAVA_OPTS: '-Xmx3g -Xms512m',
        },
      },
      cpu: 2048, // 2 vCPU
      memoryLimitMiB: 4096, // 4 GB
      desiredCount: 1,
      publicLoadBalancer: true,
      domainZone: undefined,
      assignPublicIp: false,
    });

    // ヘルスチェックの設定
    graphhopperService.targetGroup.configureHealthCheck({
      path: '/health',
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(10),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    });

    // オートスケーリングの設定
    const scalableTarget = graphhopperService.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 3,
    });

    scalableTarget.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // 実行ロールにECRアクセス権限を追加
    graphhopperService.taskDefinition.executionRole?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly')
    );

    // 出力
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: graphhopperService.loadBalancer.loadBalancerDnsName,
      description: 'Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'ServiceURL', {
      value: `http://${graphhopperService.loadBalancer.loadBalancerDnsName}`,
      description: 'Service URL',
    });
  }
}