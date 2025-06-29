# DNS Setup Guide

## Overview

This guide covers the complete DNS configuration for Feel Forward, including Route53 setup, SSL certificates, and domain registrar configuration.

## Current Configuration

| Component | Value |
|-----------|-------|
| Domain | feelfwd.app |
| Hosted Zone ID | Z08949911XTSGIT26ZA8W |
| Certificate ARN | arn:aws:acm:us-east-1:418272766513:certificate/f769ac60-45eb-497b-9244-1a0bf579cf88 |
| Region | us-east-1 |

## DNS Records Structure

```
feelfwd.app (A/AAAA) → CloudFront Distribution (Frontend)
www.feelfwd.app (CNAME) → feelfwd.app
api.feelfwd.app (A) → Application Load Balancer (Backend API)
```

## Automated Setup Process

### Quick Start

```bash
# Run the complete DNS and deployment setup
./scripts/deploy-with-dns.sh
```

This script will:
1. Verify AWS credentials and configuration
2. Check for existing Route53 hosted zone
3. Verify SSL certificate status
4. Save configuration to `.env.deploy`
5. Deploy frontend with CDK
6. Create all necessary DNS records
7. Provide manual steps for domain registrar

### Manual Deployment Option

If you prefer to run steps manually:

```bash
# Set environment variables
export CERTIFICATE_ARN="arn:aws:acm:us-east-1:418272766513:certificate/f769ac60-45eb-497b-9244-1a0bf579cf88"
export HOSTED_ZONE_ID="Z08949911XTSGIT26ZA8W"

# Deploy frontend
cd frontend/infra
npx cdk deploy FeelFwdProdStack
```

## Domain Registrar Configuration

### Required Nameservers

Update your domain registrar to use these AWS Route53 nameservers:

```
ns-388.awsdns-48.com
ns-1814.awsdns-34.co.uk
ns-708.awsdns-24.net
ns-1271.awsdns-30.org
```

### Registrar-Specific Instructions

#### GoDaddy
1. Log into GoDaddy account
2. Navigate to "My Products" → "Domains"
3. Click "DNS" next to feelfwd.app
4. Click "Change" next to "Nameservers"
5. Select "Custom" and enter the AWS nameservers

#### Namecheap
1. Sign into Namecheap
2. Go to "Domain List"
3. Click "Manage" next to feelfwd.app
4. Select "Custom DNS" from dropdown
5. Enter the AWS nameservers

#### Google Domains
1. Sign into Google Domains
2. Click on feelfwd.app
3. Navigate to "DNS" tab
4. Select "Use custom name servers"
5. Enter the AWS nameservers

## SSL Certificate Details

### Certificate Coverage
- Primary Domain: feelfwd.app
- Subject Alternative Names: *.feelfwd.app

### Certificate Validation
- Method: DNS validation
- Status: ISSUED
- Region: us-east-1 (required for CloudFront)

### Creating New Certificate (if needed)

```bash
aws acm request-certificate --region us-east-1 \
  --domain-name feelfwd.app \
  --subject-alternative-names "*.feelfwd.app" \
  --validation-method DNS
```

## Route53 Configuration

### Hosted Zone Details
- Name: feelfwd.app
- ID: Z08949911XTSGIT26ZA8W
- Type: Public Hosted Zone

### DNS Records Created

1. **NS Records** (Nameservers)
   - Automatically created with hosted zone
   - Points to AWS nameservers

2. **SOA Record** (Start of Authority)
   - Automatically created with hosted zone
   - Contains zone authority information

3. **A/AAAA Records** (feelfwd.app)
   - Type: A (IPv4) and AAAA (IPv6)
   - Target: CloudFront Distribution
   - Created by CDK deployment

4. **CNAME Record** (www.feelfwd.app)
   - Type: CNAME
   - Target: feelfwd.app
   - Created by CDK deployment

5. **A Record** (api.feelfwd.app)
   - Type: A
   - Target: Application Load Balancer
   - Created by backend deployment

## Verification Steps

### 1. Check DNS Propagation

```bash
# Check nameservers
dig NS feelfwd.app

# Check A records
dig A feelfwd.app
dig A www.feelfwd.app
dig A api.feelfwd.app

# Check from specific DNS server
dig @8.8.8.8 feelfwd.app
```

### 2. Verify SSL Certificate

```bash
# Check certificate status
aws acm describe-certificate --region us-east-1 \
  --certificate-arn "arn:aws:acm:us-east-1:418272766513:certificate/f769ac60-45eb-497b-9244-1a0bf579cf88"

# Test HTTPS connection
curl -I https://feelfwd.app
curl -I https://www.feelfwd.app
curl -I https://api.feelfwd.app
```

### 3. Check Route53 Records

```bash
# List all records in hosted zone
aws route53 list-resource-record-sets \
  --hosted-zone-id Z08949911XTSGIT26ZA8W
```

## Troubleshooting

### DNS Not Resolving
1. Verify nameservers are updated at registrar (can take 24-48 hours)
2. Check Route53 records exist
3. Clear local DNS cache:
   ```bash
   # macOS
   sudo dscacheutil -flushcache
   
   # Linux
   sudo systemctl restart systemd-resolved
   ```

### Certificate Issues
1. Ensure certificate is in us-east-1 region
2. Verify certificate status is "ISSUED"
3. Check certificate includes required domains

### CloudFront Not Updating
1. Create invalidation:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id YOUR_DIST_ID \
     --paths "/*"
   ```

## What Can/Cannot Be Automated

### ✅ Automated
- Route53 hosted zone verification
- SSL certificate creation/verification
- CDK deployment with DNS configuration
- CloudFront distribution setup
- Route53 record creation
- Configuration file generation

### ❌ Manual Steps Required
- Updating nameservers at domain registrar
- DNS propagation time (2-48 hours)
- Domain ownership verification at registrar
- Payment for domain registration/renewal

## Environment Configuration

Create `.env.deploy` file:

```bash
export CERTIFICATE_ARN="arn:aws:acm:us-east-1:418272766513:certificate/f769ac60-45eb-497b-9244-1a0bf579cf88"
export HOSTED_ZONE_ID="Z08949911XTSGIT26ZA8W"
export DOMAIN="feelfwd.app"
```

Source before deployment:
```bash
source .env.deploy
```