# Frontend Deployment Guide

This guide covers deploying the Feel Forward frontend to AWS S3 and CloudFront.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 20+ and npm
- Python 3.11+ (for CDK)
- Domain verified in Route53

## Environment Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment**:
   Create `.env.production` file:
   ```
   VITE_API_URL=https://api.feelfwd.app
   ```

## Automated Deployment

### Using npm scripts:

```bash
cd frontend

# Deploy to production
npm run deploy:prod

# Deploy to staging
npm run deploy:staging
```

### Using deployment scripts directly:

```bash
cd frontend

# Bootstrap CDK (first time only)
./scripts/bootstrap.sh

# Build for production
./scripts/build.sh prod

# Deploy to production
./scripts/deploy.sh prod
```

## Manual Deployment Steps

### 1. Bootstrap CDK Environment (First Time Only)

```bash
cd frontend/infra
npm install
cdk bootstrap
```

### 2. Build the Application

```bash
cd frontend
npm run build:production
```

This creates optimized production build in `dist/` directory.

### 3. Deploy Infrastructure

```bash
cd frontend/infra
cdk deploy FeelFwdWebsiteStack-prod -c domainName=feelfwd.app
```

This creates:
- S3 bucket for static hosting
- CloudFront distribution
- Route53 DNS records
- SSL certificate (ACM)
- Origin Access Identity

### 4. Upload Files to S3

```bash
# Get the S3 bucket name
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name FeelFwdWebsiteStack-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
  --output text)

# Upload files
aws s3 sync frontend/dist/ s3://$BUCKET_NAME \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html" \
  --exclude "*.json"

# Upload index.html with no cache
aws s3 cp frontend/dist/index.html s3://$BUCKET_NAME/index.html \
  --cache-control "no-cache, no-store, must-revalidate"
```

### 5. Invalidate CloudFront Cache

```bash
# Get distribution ID
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name FeelFwdWebsiteStack-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`DistributionId`].OutputValue' \
  --output text)

# Create invalidation
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

## Infrastructure Details

### S3 Configuration
- **Bucket**: Private with OAI access
- **Static Hosting**: Enabled
- **Versioning**: Enabled
- **Lifecycle**: Old versions deleted after 30 days

### CloudFront Configuration
- **Origins**: S3 bucket via OAI
- **Behaviors**: SPA routing (404 → index.html)
- **Caching**: 1 year for assets, no cache for index.html
- **Compression**: Enabled for all content types
- **HTTP/2**: Enabled
- **Price Class**: US, Canada, Europe

### Security Headers
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; connect-src 'self' https://api.feelfwd.app
```

## Domain Configuration

### Production (feelfwd.app)
1. Route53 hosted zone already configured
2. CloudFront uses ACM certificate
3. A and AAAA records point to CloudFront

### Staging (staging.feelfwd.app)
1. CNAME record in feelfwd.app zone
2. Separate CloudFront distribution
3. Separate S3 bucket

## Verify Deployment

1. **Check CloudFront status**:
   ```bash
   aws cloudfront get-distribution --id $DISTRIBUTION_ID \
     --query 'Distribution.Status'
   ```

2. **Test the site**:
   ```bash
   # Production
   curl -I https://feelfwd.app
   
   # Check API connectivity
   curl https://feelfwd.app/health
   ```

3. **Verify SSL**:
   ```bash
   openssl s_client -connect feelfwd.app:443 -servername feelfwd.app
   ```

## Continuous Deployment

### GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: Build
        run: cd frontend && npm run build:production
      - name: Deploy to S3
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          cd frontend
          ./scripts/deploy.sh prod
```

## Troubleshooting

### CloudFront 403 Errors
**Cause**: OAI not configured properly
**Solution**: Check S3 bucket policy includes CloudFront OAI

### Changes Not Visible
**Cause**: CloudFront cache not invalidated
**Solution**: Create invalidation for affected paths

### CORS Errors
**Cause**: API URL misconfigured
**Solution**: Verify VITE_API_URL in build environment

### SSL Certificate Issues
**Cause**: Certificate not in us-east-1
**Solution**: CloudFront requires certificates in us-east-1

## Performance Optimization

1. **Enable Brotli compression** in CloudFront
2. **Use immutable cache headers** for hashed assets
3. **Implement service worker** for offline support
4. **Optimize images** with WebP format
5. **Code split** routes for faster initial load

## Monitoring

- **CloudFront Metrics**: Request count, cache hit ratio, errors
- **Real User Monitoring**: Consider adding analytics
- **Synthetic Monitoring**: Set up uptime checks
- **Error Tracking**: Integrate error reporting service

## Rollback Procedure

To rollback to previous version:

```bash
# List S3 object versions
aws s3api list-object-versions --bucket $BUCKET_NAME

# Restore previous version
aws s3api copy-object \
  --bucket $BUCKET_NAME \
  --copy-source $BUCKET_NAME/index.html?versionId=PREVIOUS_VERSION_ID \
  --key index.html

# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```