# Deployment Log - Manual Steps Required

**Date**: $(date)
**Status**: AWS CLI not configured in this environment

## Current Setup Status

### ✅ Verified Configuration
- **Domain**: feelfwd.app
- **Hosted Zone ID**: Z08949911XTSGIT26ZA8W
- **Certificate ARN**: arn:aws:acm:us-east-1:418272766513:certificate/f769ac60-45eb-497b-9244-1a0bf579cf88
- **Backend API**: Already deployed at https://api.feelfwd.app

### 🔧 Required Manual Steps

1. **Configure AWS CLI** (on your local machine):
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Enter default region: us-east-1
   # Enter default output format: json
   ```

2. **Run the deployment script**:
   ```bash
   cd networking
   ./scripts/deploy-with-dns.sh
   ```

   Or run directly with environment variables:
   ```bash
   cd frontend
   CERTIFICATE_ARN="arn:aws:acm:us-east-1:418272766513:certificate/f769ac60-45eb-497b-9244-1a0bf579cf88" \
   HOSTED_ZONE_ID="Z08949911XTSGIT26ZA8W" \
   ./scripts/deploy.sh prod
   ```

3. **Update Domain Registrar Nameservers** to:
   - ns-388.awsdns-48.com
   - ns-1814.awsdns-34.co.uk
   - ns-708.awsdns-24.net
   - ns-1271.awsdns-30.org

## Expected Script Output

When you run the script with proper AWS credentials, it will:

1. ✅ Verify AWS CLI configuration
2. ✅ Check Route53 hosted zone (Z08949911XTSGIT26ZA8W)
3. ✅ Verify SSL certificate (already exists and is valid)
4. ✅ Create .env.deploy file with configuration
5. ✅ Deploy frontend CDK stack with:
   - S3 bucket for static files
   - CloudFront distribution
   - Route53 A/AAAA records for feelfwd.app
   - Route53 CNAME record for www.feelfwd.app
6. ✅ Invalidate CloudFront cache

## Quick Deployment Commands

```bash
# Option 1: Use the automated script
cd /Users/williamprior/Development/GitHub/feel-forward/networking
./scripts/deploy-with-dns.sh

# Option 2: Direct CDK deployment
cd /Users/williamprior/Development/GitHub/feel-forward/frontend/infra
export CERTIFICATE_ARN="arn:aws:acm:us-east-1:418272766513:certificate/f769ac60-45eb-497b-9244-1a0bf579cf88"
export HOSTED_ZONE_ID="Z08949911XTSGIT26ZA8W"
npx cdk deploy FeelFwdProdStack

# Option 3: Use existing frontend deploy script
cd /Users/williamprior/Development/GitHub/feel-forward/frontend
CERTIFICATE_ARN="arn:aws:acm:us-east-1:418272766513:certificate/f769ac60-45eb-497b-9244-1a0bf579cf88" \
HOSTED_ZONE_ID="Z08949911XTSGIT26ZA8W" \
./scripts/deploy.sh prod
```

## Post-Deployment Verification

After deployment completes:

```bash
# Check DNS resolution
dig feelfwd.app
dig www.feelfwd.app
dig api.feelfwd.app

# Test HTTPS endpoints
curl -I https://feelfwd.app
curl -I https://www.feelfwd.app  
curl -I https://api.feelfwd.app

# Get CloudFront distribution ID
aws cloudformation describe-stacks \
  --stack-name FeelFwdProdStack \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" \
  --output text
```

## Notes

- The deployment script requires AWS CLI to be configured with credentials that have permissions to:
  - Create/update CloudFormation stacks
  - Manage S3 buckets
  - Create CloudFront distributions
  - Manage Route53 records
  - Access ACM certificates

- DNS propagation can take 2-48 hours after updating nameservers at your domain registrar

- The frontend will be accessible at https://feelfwd.app once:
  1. CDK deployment completes
  2. Nameservers are updated at registrar
  3. DNS propagation is complete