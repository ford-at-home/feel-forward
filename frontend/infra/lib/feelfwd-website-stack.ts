import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface FeelFwdWebsiteStackProps extends cdk.StackProps {
  stage: string;
  domainName: string;
  certificateArn?: string;
  hostedZoneId?: string;
}

export class FeelFwdWebsiteStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: FeelFwdWebsiteStackProps) {
    super(scope, id, props);

    const { stage, domainName, certificateArn, hostedZoneId } = props;

    // S3 Bucket for hosting the static website
    this.bucket = new s3.Bucket(this, `FeelFwdWebsite-${stage}`, {
      bucketName: `feelfwd-${stage}-website-${this.account}`,
      removalPolicy: stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: stage !== 'prod',
      
      // Block all public access initially - CloudFront will access via OAC
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      
      // Enable versioning for production
      versioned: stage === 'prod',
      
      // CORS configuration for potential API calls from the frontend
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
          allowedOrigins: [`https://${domainName}`],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
    });

    // Origin Access Control for CloudFront
    const oac = new cloudfront.CfnOriginAccessControl(this, `FeelFwdOAC-${stage}`, {
      originAccessControlConfig: {
        name: `feelfwd-${stage}-oac`,
        description: `OAC for FeelFwd ${stage} website`,
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
      },
    });

    // CloudFront Response Headers Policy
    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(this, `FeelFwdHeaders-${stage}`, {
      responseHeadersPolicyName: `feelfwd-${stage}-headers`,
      comment: `Security headers for FeelFwd ${stage}`,
      securityHeadersBehavior: {
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: cloudfront.HeadersFrameOption.DENY, override: true },
        referrerPolicy: { referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN, override: true },
        strictTransportSecurity: { 
          accessControlMaxAge: cdk.Duration.seconds(31536000), 
          includeSubdomains: true, 
          preload: true, 
          override: true 
        },
        contentSecurityPolicy: { 
          contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.felfwd.app;", 
          override: true 
        },
      },
      // Custom headers - security headers are handled above
      customHeadersBehavior: {
        customHeaders: [
          { header: 'X-Powered-By', value: 'Feel Forward Flow', override: true },
        ],
      },
    });

    // Cache Policy for static assets
    const cachePolicy = new cloudfront.CachePolicy(this, `FeelFwdCache-${stage}`, {
      cachePolicyName: `feelfwd-${stage}-cache`,
      comment: `Cache policy for FeelFwd ${stage} static assets`,
      defaultTtl: cdk.Duration.hours(24),
      maxTtl: cdk.Duration.days(365),
      minTtl: cdk.Duration.seconds(0),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      headerBehavior: cloudfront.CacheHeaderBehavior.allowList('CloudFront-Viewer-Country'),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });

    // CloudFront Distribution
    const distributionConfig: cloudfront.DistributionProps = {
      comment: `FeelFwd ${stage} website distribution`,
      defaultRootObject: 'index.html',
      
      defaultBehavior: {
        origin: new cloudfrontOrigins.S3Origin(this.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cachePolicy,
        responseHeadersPolicy: responseHeadersPolicy,
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
      },

      additionalBehaviors: {
        // Cache static assets longer
        '/assets/*': {
          origin: new cloudfrontOrigins.S3Origin(this.bucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: new cloudfront.CachePolicy(this, `FeelFwdStaticCache-${stage}`, {
            cachePolicyName: `feelfwd-${stage}-static-cache`,
            defaultTtl: cdk.Duration.days(30),
            maxTtl: cdk.Duration.days(365),
            minTtl: cdk.Duration.seconds(0),
            cookieBehavior: cloudfront.CacheCookieBehavior.none(),
            headerBehavior: cloudfront.CacheHeaderBehavior.none(),
            queryStringBehavior: cloudfront.CacheQueryStringBehavior.none(),
            enableAcceptEncodingGzip: true,
            enableAcceptEncodingBrotli: true,
          }),
          responseHeadersPolicy: responseHeadersPolicy,
          compress: true,
        },
      },

      errorResponses: [
        // SPA routing - redirect 404s to index.html
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],

      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only North America and Europe edge locations
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    };

    // Add SSL certificate and domain configuration if provided
    if (certificateArn && hostedZoneId) {
      const certificate = certificatemanager.Certificate.fromCertificateArn(
        this,
        `FeelFwdCertificate-${stage}`,
        certificateArn
      );

      // Set certificate and domain names
      Object.assign(distributionConfig, {
        certificate: certificate,
        domainNames: [domainName]
      });
    }

    this.distribution = new cloudfront.Distribution(this, `FeelFwdDistribution-${stage}`, distributionConfig);

    // Grant CloudFront access to S3 bucket
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudFrontServicePrincipal',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        actions: ['s3:GetObject'],
        resources: [this.bucket.arnForObjects('*')],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${this.distribution.distributionId}`,
          },
        },
      })
    );

    // Route53 DNS record if hosted zone is provided
    if (hostedZoneId) {
      const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, `FeelFwdHostedZone-${stage}`, {
        hostedZoneId: hostedZoneId,
        zoneName: domainName.includes('staging') ? 'felfwd.app' : domainName,
      });

      new route53.ARecord(this, `FeelFwdAliasRecord-${stage}`, {
        zone: hostedZone,
        recordName: domainName.includes('staging') ? 'staging' : undefined,
        target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(this.distribution)),
      });

      new route53.AaaaRecord(this, `FeelFwdAAAARecord-${stage}`, {
        zone: hostedZone,
        recordName: domainName.includes('staging') ? 'staging' : undefined,
        target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(this.distribution)),
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 Bucket name for website hosting',
      exportName: `FeelFwd-${stage}-BucketName`,
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront Distribution ID',
      exportName: `FeelFwd-${stage}-DistributionId`,
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
      exportName: `FeelFwd-${stage}-DistributionDomainName`,
    });

    new cdk.CfnOutput(this, 'WebsiteURL', {
      value: certificateArn ? `https://${domainName}` : `https://${this.distribution.distributionDomainName}`,
      description: 'Website URL',
      exportName: `FeelFwd-${stage}-WebsiteURL`,
    });
  }
}