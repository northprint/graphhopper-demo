import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly hostedZone?: route53.IHostedZone;
  public readonly certificate?: acm.Certificate;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    this.vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // Application Load Balancer
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: this.vpc,
      internetFacing: true,
      loadBalancerName: 'graphhopper-alb',
    });

    // ALBセキュリティグループ
    this.alb.connections.allowFromAnyIpv4(ec2.Port.tcp(80), 'Allow HTTP from anywhere');
    this.alb.connections.allowFromAnyIpv4(ec2.Port.tcp(443), 'Allow HTTPS from anywhere');

    // カスタムドメインを使用する場合（オプション）
    const domainName = this.node.tryGetContext('domainName');
    if (domainName) {
      // ホストゾーンを取得
      this.hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
        domainName: domainName,
      });

      // SSL証明書
      this.certificate = new acm.Certificate(this, 'Certificate', {
        domainName: `api.${domainName}`,
        validation: acm.CertificateValidation.fromDns(this.hostedZone),
      });
    }

    // 出力
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: this.alb.loadBalancerDnsName,
      description: 'ALB DNS Name',
    });
  }
}