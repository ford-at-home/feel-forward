# FeelFwd Quick Start Guide

## 🚀 One-Command Setup
```bash
npm run bootstrap
```

This will:
- Check prerequisites (Node.js, AWS CLI)
- Install all dependencies
- Set up CDK bootstrap
- Configure domain settings
- Create environment files

## 📋 Prerequisites
- Node.js 18+
- AWS CLI configured
- Domain registered (felfwd.app)

## 🏗️ Deployment Commands

### Quick Deploy
```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production  
npm run deploy:prod
```

### Step-by-Step
```bash
# 1. Set up environment
npm run setup-domain

# 2. Build application
npm run build:prod

# 3. Deploy infrastructure
cd infra && npm run deploy:prod
```

## 🔧 Manual Configuration

### AWS Settings (.env.deploy)
```bash
CDK_DEFAULT_REGION=us-east-1
HOSTED_ZONE_ID=Z1234567890ABC
CERTIFICATE_ARN=arn:aws:acm:us-east-1:123456789012:certificate/...
DOMAIN_NAME=felfwd.app
```

### GitHub Secrets
- `AWS_ROLE_ARN`
- `CERTIFICATE_ARN`  
- `HOSTED_ZONE_ID`

## 📁 Key Files

### Infrastructure
- `/infra/lib/feelfwd-website-stack.ts` - CDK stack definition
- `/infra/bin/app.ts` - CDK app entry point

### Scripts
- `/scripts/deploy.sh` - Main deployment script
- `/scripts/build.sh` - Build script
- `/scripts/setup-domain.sh` - Domain configuration
- `/scripts/bootstrap.sh` - Initial setup

### CI/CD
- `/.github/workflows/deploy.yml` - GitHub Actions workflow

### Configuration
- `.env.production` - Production environment
- `.env.staging` - Staging environment
- `.env.example` - Template

## 🌐 URLs
- **Production**: https://felfwd.app
- **Staging**: https://staging.felfwd.app  
- **API**: https://api.felfwd.app

## 📖 Documentation
- `DEPLOYMENT.md` - Complete deployment guide
- `README.md` - Project overview
- `FRONTEND.md` - Frontend documentation

## ❓ Need Help?
1. Check `DEPLOYMENT.md` for detailed instructions
2. Review GitHub Actions logs for CI/CD issues
3. Run `./scripts/setup-domain.sh` to verify AWS configuration