# FeelFwd Deployment Guide

This guide covers the deployment pipeline for felfwd.app using AWS S3, CloudFront, and Route53.

## Architecture Overview

- **Frontend**: React/Vite application served from S3 + CloudFront
- **Backend**: Already deployed at `api.felfwd.app`
- **Domain**: `felfwd.app` (production), `staging.felfwd.app` (staging)
- **Infrastructure**: AWS CDK for infrastructure as code
- **CI/CD**: GitHub Actions for automated deployment

## Prerequisites

### AWS Setup
1. AWS CLI configured with appropriate credentials
2. AWS CDK installed globally: `npm install -g aws-cdk`
3. Route53 hosted zone for your domain
4. SSL certificate in AWS Certificate Manager (us-east-1 region)

### Environment Variables
Create a `.env.deploy` file with your AWS configuration:

```bash
# Run the setup script to generate this automatically
./scripts/setup-domain.sh
```

Or create manually:
```bash
CDK_DEFAULT_REGION=us-east-1
HOSTED_ZONE_ID=Z1234567890ABC
CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012
DOMAIN_NAME=felfwd.app
```

## Deployment Methods

### 1. Manual Deployment

#### Quick Deploy
```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

#### Step-by-Step Deploy
```bash
# 1. Build the application
npm run build:prod

# 2. Deploy infrastructure
cd infra
npm ci
npm run deploy:prod

# 3. Sync files to S3 (done automatically by deploy script)
```

### 2. GitHub Actions (Recommended)

#### Automatic Deployment
- **Staging**: Push to any branch except `main`
- **Production**: Push to `main` branch

#### Manual Deployment
1. Go to GitHub Actions tab
2. Select "Deploy FeelFwd Website" workflow
3. Click "Run workflow"
4. Choose environment (staging/prod)

#### Required GitHub Secrets
Set these in your GitHub repository settings:

```
AWS_ROLE_ARN=arn:aws:iam::123456789012:role/GitHubActionsRole
CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/...
HOSTED_ZONE_ID=Z1234567890ABC
```

## Infrastructure Details

### S3 Configuration
- **Bucket Name**: `feelfwd-{stage}-website-{account-id}` (note: bucket names still use 'feelfwd')
- **Public Access**: Blocked (CloudFront uses OAC)
- **Versioning**: Enabled for production
- **CORS**: Configured for API calls

### CloudFront Configuration
- **Price Class**: PriceClass_100 (North America + Europe)
- **HTTP Version**: HTTP/2 and HTTP/3
- **Compression**: Enabled (Gzip + Brotli)
- **Security Headers**: Comprehensive set applied
- **Cache Policy**: Optimized for static assets
- **Error Pages**: SPA routing support (404 -> index.html)

### Security Features
- **SSL/TLS**: Minimum TLS 1.2
- **Security Headers**: HSTS, CSP, X-Frame-Options, etc.
- **Origin Access Control**: Restricts S3 access to CloudFront only
- **WAF**: Can be added if needed

## Domain Setup

### 1. Route53 Hosted Zone
Create a hosted zone for your domain:
```bash
aws route53 create-hosted-zone --name felfwd.app --caller-reference $(date +%s)
```

Update your domain registrar's nameservers to point to Route53.

### 2. SSL Certificate
Request a certificate in us-east-1 (required for CloudFront):
```bash
aws acm request-certificate \
  --region us-east-1 \
  --domain-name felfwd.app \
  --subject-alternative-names "*.felfwd.app" \
  --validation-method DNS
```

Validate the certificate using DNS records in Route53.

### 3. Automated Setup
Use the provided script to automate domain setup:
```bash
./scripts/setup-domain.sh
```

## Environment Configuration

### Development
```bash
npm run dev
```
Uses local Vite dev server with hot reload.

### Build Modes
- **Development Build**: `npm run build:dev`
  - Source maps enabled
  - Debug mode enabled
  - Staging API URL

- **Production Build**: `npm run build:prod`
  - Optimized and minified
  - Source maps disabled
  - Production API URL

## Monitoring and Maintenance

### CloudFront Cache Invalidation
Cache is automatically invalidated during deployment. Manual invalidation:
```bash
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"
```

### S3 Sync Options
The deployment script uses optimized S3 sync:
- `--delete`: Remove files not in source
- `--exact-timestamps`: Only sync when modified
- Cache headers: Long cache for assets, short for HTML

### Rollback Procedure
1. Identify previous deployment commit
2. Check out that commit
3. Run deployment script
4. Invalidate CloudFront cache

## Cost Optimization

### S3 Costs
- **Storage**: ~$0.023 per GB/month
- **Requests**: ~$0.0004 per 1,000 requests
- **Transfer**: Free to CloudFront

### CloudFront Costs
- **Data Transfer**: $0.085 per GB (first 10TB)
- **Requests**: $0.0075 per 10,000 requests
- **Price Class 100**: Reduced cost for US/Europe only

### Estimated Monthly Cost
For a typical static website:
- **S3**: $1-5/month
- **CloudFront**: $5-20/month
- **Route53**: $0.50/month per hosted zone
- **Total**: ~$7-26/month

## Troubleshooting

### Common Issues

#### 1. Certificate Not Found
- Ensure certificate is in us-east-1 region
- Check certificate status is "Issued"
- Verify domain names match exactly

#### 2. Domain Not Resolving
- Check Route53 nameservers at registrar
- Verify A/AAAA records point to CloudFront
- DNS propagation can take up to 48 hours

#### 3. 403 Forbidden Errors
- Check S3 bucket policy allows CloudFront access
- Verify Origin Access Control is configured correctly
- Ensure index.html exists in S3 bucket

#### 4. Build Failures
- Check Node.js version compatibility
- Verify all dependencies are installed
- Review environment variables

### Debugging Commands

```bash
# Check CloudFormation stack status
aws cloudformation describe-stacks --stack-name FeelFwdProdStack

# List S3 bucket contents
aws s3 ls s3://feelfwd-prod-website-123456789012/

# Check CloudFront distribution
aws cloudfront get-distribution --id E1234567890ABC

# Test API connectivity
curl https://api.felfwd.app/health
```

## Security Considerations

### Access Control
- Use IAM roles with minimal permissions
- Enable MFA for AWS accounts
- Rotate access keys regularly

### Content Security
- Review CSP headers in CloudFront configuration
- Monitor for unauthorized changes
- Use AWS Config for compliance monitoring

### SSL/TLS
- Use strong cipher suites only
- Enable HSTS headers
- Monitor certificate expiration

## Performance Optimization

### Build Optimization
- Code splitting enabled
- Tree shaking for unused code
- Asset optimization (images, fonts)

### CDN Optimization
- Brotli compression enabled
- HTTP/2 and HTTP/3 support
- Optimal cache policies

### Monitoring
- CloudWatch metrics for CloudFront
- Real User Monitoring (RUM) can be added
- Performance budgets in CI/CD

## Support and Maintenance

For deployment issues:
1. Check GitHub Actions logs
2. Review CloudFormation events
3. Monitor CloudWatch logs
4. Contact AWS support if needed

Regular maintenance tasks:
- Update dependencies monthly
- Review security patches
- Monitor costs and usage
- Backup important configurations