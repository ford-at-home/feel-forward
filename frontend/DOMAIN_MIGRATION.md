# Domain Migration Guide: feelfwd.app → felfwd.app

## Overview
This guide documents the process of migrating from `feelfwd.app` to `felfwd.app` for the Feel Forward application.

## Changes Made

### 1. Code Updates Completed ✅
- **CDK Configuration** (`frontend/infra/bin/app.ts`):
  - Updated production domain from `feelfwd.app` to `felfwd.app`
  - Updated staging domain from `staging.feelfwd.app` to `staging.felfwd.app`

- **Frontend Configuration** (`frontend/src/lib/config.ts`):
  - Updated API URL from `https://api.feelfwd.app` to `https://api.felfwd.app`
  - Updated domain from `feelfwd.app` to `felfwd.app`
  - Updated base URL from `https://feelfwd.app` to `https://felfwd.app`

- **Infrastructure Stack** (`frontend/infra/lib/feelfwd-website-stack.ts`):
  - Updated CSP header to allow connections to `https://api.felfwd.app`
  - Updated Route53 zone name reference for staging domains

- **Setup Script** (`frontend/scripts/setup-domain.sh`):
  - Updated domain name to `felfwd.app`
  - Updated API URL to `https://api.felfwd.app`

## Next Steps Required

### 2. SSL Certificate Setup 🔐
You need to request a new SSL certificate for the new domain:

```bash
# Request certificate for the new domain
aws acm request-certificate \
  --region us-east-1 \
  --domain-name felfwd.app \
  --subject-alternative-names "*.felfwd.app" \
  --validation-method DNS

# Note the Certificate ARN that's returned
```

After requesting:
1. Go to AWS Certificate Manager in the console
2. Find the new certificate for `felfwd.app`
3. Click on the certificate and add the CNAME validation records to your IONOS DNS
4. Wait for the certificate to be validated (status: ISSUED)

### 3. Update Environment Variables 🔧
Set the environment variables for deployment:

```bash
# Export the new certificate ARN (replace with your actual ARN)
export CERTIFICATE_ARN="arn:aws:acm:us-east-1:YOUR_ACCOUNT:certificate/YOUR_CERT_ID"

# Your existing hosted zone ID at IONOS
export HOSTED_ZONE_ID="Z08949911XTSGIT26ZA8W"
```

### 4. Deploy CloudFront Updates 🚀
Deploy the infrastructure changes:

```bash
cd frontend
npm run deploy:prod
```

This will update your CloudFront distribution to use the new domain name.

### 5. Update DNS at IONOS 🌐
After the deployment completes:

1. Log into your IONOS control panel
2. Go to your `felfwd.app` domain DNS settings
3. Add/Update these records:

For the root domain:
- **Type**: A
- **Name**: @ (or leave empty for root)
- **Value**: Use Route53 alias to CloudFront distribution

Or if IONOS doesn't support aliases:
- **Type**: CNAME
- **Name**: www
- **Value**: `d1rr9ueubvw4ur.cloudfront.net` (your CloudFront distribution domain)

For the API subdomain (if using):
- **Type**: CNAME
- **Name**: api
- **Value**: Your API endpoint (if different from CloudFront)

### 6. Verify Deployment ✅
After DNS propagation (can take up to 48 hours, usually much faster):

```bash
# Test the new domain
curl -I https://felfwd.app
curl -I https://www.felfwd.app

# Check CloudFront distribution
aws cloudfront get-distribution --id E4CBWK1QWSOTY --query "Distribution.DistributionConfig.Aliases"
```

## Important Notes

1. **Keep Old Domain Active**: Don't delete the old `feelfwd.app` configuration immediately. You may want to set up redirects.

2. **SSL Certificate**: The current certificate ARN `arn:aws:acm:us-east-1:418272766513:certificate/f769ac60-45eb-497b-9244-1a0bf579cf88` is for the old domain. You MUST create a new certificate for `felfwd.app`.

3. **API Endpoints**: If you have a separate backend API, ensure it's also updated to use the new domain.

4. **Cache Invalidation**: After deployment, invalidate the CloudFront cache:
   ```bash
   aws cloudfront create-invalidation --distribution-id E4CBWK1QWSOTY --paths "/*"
   ```

## Rollback Plan
If you need to rollback:
1. Revert the code changes in this commit
2. Redeploy with `npm run deploy:prod`
3. Update DNS records back to the old domain

## Current Status
- ✅ Code updates completed
- ⏳ SSL certificate needs to be created for `felfwd.app`
- ⏳ CloudFront deployment pending
- ⏳ DNS configuration at IONOS pending