#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { FeelFwdWebsiteStack } from '../lib/feelfwd-website-stack';

const app = new cdk.App();

// Production stack
new FeelFwdWebsiteStack(app, 'FeelFwdProdStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1', // CloudFront requires certificates in us-east-1
  },
  stage: 'prod',
  domainName: 'feelfwd.app',
  certificateArn: process.env.CERTIFICATE_ARN, // Will need to be provided
  hostedZoneId: process.env.HOSTED_ZONE_ID,   // Will need to be provided
});

// Staging stack (optional)
new FeelFwdWebsiteStack(app, 'FeelFwdStagingStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  stage: 'staging',
  domainName: 'staging.feelfwd.app',
  certificateArn: process.env.CERTIFICATE_ARN,
  hostedZoneId: process.env.HOSTED_ZONE_ID,
});