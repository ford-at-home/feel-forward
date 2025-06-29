# Complete Deployment Flow

This document provides a step-by-step guide for deploying the entire Feel Forward application from scratch.

> **📍 Current Status**: Backend deployed ✅, Frontend pending certificate validation ⏳  
> See [../SUMMARY.md](../SUMMARY.md) for real-time status.

## Prerequisites Checklist

- [ ] AWS account with administrative access
- [ ] AWS CLI installed and configured
- [ ] Docker Desktop installed and running
- [ ] Node.js 20+ and npm installed
- [ ] Python 3.11+ and pip installed
- [ ] GitHub account with personal access token
- [ ] Domain name registered (feelfwd.app)
- [ ] Git repository cloned locally

## Environment Setup

### 1. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and add:
# - GITHUB_TOKEN (required for Strands SDK)
# - OPENAI_API_KEY (optional for AI features)
# - AWS_PROFILE (if not using default)
```

### 2. Install Dependencies

```bash
# Backend dependencies
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend dependencies
cd ../frontend
npm install

# CDK CLI (if not installed)
npm install -g aws-cdk
```

## Phase 1: Domain and SSL Setup

### 1.1 Create Route53 Hosted Zone

```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name feelfwd.app \
  --caller-reference $(date +%s) \
  --profile ${AWS_PROFILE:-default}

# Note the nameservers returned
# Update your domain registrar with these nameservers
```

### 1.2 Generate SSL Certificates

```bash
cd networking/scripts
./ssl-certificate.sh

# This script will:
# 1. Request certificate for feelfwd.app and *.feelfwd.app
# 2. Create DNS validation records
# 3. Wait for validation
# 4. Save certificate ARN
```

### 1.3 Verify Domain Setup

```bash
# Check nameservers (may take up to 48 hours)
dig NS feelfwd.app

# Verify Route53 is authoritative
nslookup feelfwd.app
```

## Phase 2: Backend Deployment

### 2.1 Bootstrap CDK

```bash
cd backend/infra

# First time only
cdk bootstrap aws://ACCOUNT_ID/us-east-1
```

### 2.2 Deploy Infrastructure

```bash
# Deploy backend stack
cdk deploy BackendStack \
  -c domain=feelfwd.app \
  -c apiDomain=api.feelfwd.app \
  --require-approval never

# Note the outputs:
# - ECR repository URI
# - Load balancer DNS
# - ECS cluster name
```

### 2.3 Build and Push Docker Image

```bash
cd ../..  # Back to project root

# Build Docker image
docker build -t feel-forward backend/

# Get ECR login
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  418272766513.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag feel-forward:latest \
  418272766513.dkr.ecr.us-east-1.amazonaws.com/feel-forward:latest

docker push \
  418272766513.dkr.ecr.us-east-1.amazonaws.com/feel-forward:latest
```

### 2.4 Scale Up ECS Service

```bash
# Get service name
SERVICE_NAME=$(aws ecs list-services \
  --cluster feel-forward \
  --query 'serviceArns[0]' \
  --output text | cut -d'/' -f3)

# Scale to 1 task
aws ecs update-service \
  --cluster feel-forward \
  --service $SERVICE_NAME \
  --desired-count 1
```

### 2.5 Verify Backend Deployment

```bash
# Check service status
aws ecs describe-services \
  --cluster feel-forward \
  --services $SERVICE_NAME \
  --query 'services[0].deployments'

# Test health endpoint (after DNS propagates)
curl https://api.feelfwd.app/health

# View API documentation
open https://api.feelfwd.app/docs
```

## Phase 3: Frontend Deployment

### 3.1 Build Frontend

```bash
cd frontend

# Build for production
npm run build:production

# Verify build output
ls -la dist/
```

### 3.2 Deploy Frontend Infrastructure

```bash
cd infra

# Bootstrap CDK (if not done)
cdk bootstrap

# Deploy frontend stack
cdk deploy FeelFwdWebsiteStack-prod \
  -c domainName=feelfwd.app
```

### 3.3 Upload Frontend Assets

```bash
# Get S3 bucket name
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name FeelFwdWebsiteStack-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' \
  --output text)

# Sync files to S3
aws s3 sync ../dist/ s3://$BUCKET_NAME \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

# Upload index.html with no-cache
aws s3 cp ../dist/index.html s3://$BUCKET_NAME/index.html \
  --cache-control "no-cache, no-store, must-revalidate"
```

### 3.4 Invalidate CloudFront Cache

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

### 3.5 Verify Frontend Deployment

```bash
# Check CloudFront status
aws cloudfront get-distribution \
  --id $DISTRIBUTION_ID \
  --query 'Distribution.Status'

# Test the site
curl -I https://feelfwd.app
open https://feelfwd.app
```

## Phase 4: Post-Deployment Verification

### 4.1 Complete System Test

```bash
# Run automated health checks
cd networking/scripts
./health-check.sh

# Manual workflow test
cd ../../backend
python demo_quick.py
```

### 4.2 Monitor Initial Performance

```bash
# View ECS logs
aws logs tail /ecs/feel-forward --follow

# Check ALB target health
aws elbv2 describe-target-health \
  --target-group-arn $(aws elbv2 describe-target-groups \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)
```

### 4.3 Set Up Monitoring

```bash
# Create CloudWatch dashboard
aws cloudwatch put-dashboard \
  --dashboard-name FeelForward \
  --dashboard-body file://monitoring/dashboard.json
```

## Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Docker running
- [ ] AWS credentials valid

### Domain Setup
- [ ] Route53 hosted zone created
- [ ] Nameservers updated at registrar
- [ ] SSL certificates issued
- [ ] DNS propagation verified

### Backend Deployment
- [ ] CDK bootstrapped
- [ ] Infrastructure deployed
- [ ] Docker image built and pushed
- [ ] ECS service scaled up
- [ ] API health check passing

### Frontend Deployment
- [ ] Frontend built successfully
- [ ] Infrastructure deployed
- [ ] Assets uploaded to S3
- [ ] CloudFront cache invalidated
- [ ] Site accessible via HTTPS

### Post-Deployment
- [ ] Full workflow tested
- [ ] Monitoring configured
- [ ] Logs accessible
- [ ] Performance baseline established

## Rollback Procedures

### Frontend Rollback

```bash
# List S3 versions
aws s3api list-object-versions --bucket $BUCKET_NAME

# Restore previous version
aws s3api copy-object \
  --bucket $BUCKET_NAME \
  --copy-source $BUCKET_NAME/index.html?versionId=PREVIOUS_VERSION \
  --key index.html

# Invalidate cache
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

### Backend Rollback

```bash
# Update task definition to previous version
aws ecs update-service \
  --cluster feel-forward \
  --service $SERVICE_NAME \
  --task-definition feel-forward:PREVIOUS_VERSION \
  --force-new-deployment
```

## Troubleshooting Deployment

See [Troubleshooting Guide](troubleshooting.md) for common issues:
- DNS not resolving
- SSL certificate errors
- ECS tasks not starting
- CloudFront 403 errors
- CORS issues

## Automation Scripts

For automated deployment, use:

```bash
# Complete deployment
networking/scripts/deploy-all.sh

# Or use Makefiles
make -C backend deploy
make -C frontend deploy:prod
```

## Next Steps

After successful deployment:
1. Configure monitoring alerts
2. Set up backup procedures
3. Document any customizations
4. Plan for scaling strategy
5. Schedule security review