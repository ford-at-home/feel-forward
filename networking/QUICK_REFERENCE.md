# Feel Forward Quick Reference Card

## 🚀 Deploy Frontend (When Certificate is Ready)

```bash
cd networking
./quick-deploy.sh
```

## 📊 Check Status Commands

### Certificate Status
```bash
AWS_PROFILE=personal aws acm describe-certificate --region us-east-1 \
  --certificate-arn "arn:aws:acm:us-east-1:418272766513:certificate/f769ac60-45eb-497b-9244-1a0bf579cf88" \
  --query "Certificate.Status" --output text
```

### CloudFormation Stack Status
```bash
AWS_PROFILE=personal aws cloudformation describe-stacks \
  --stack-name FeelFwdProdStack \
  --query "Stacks[0].StackStatus" --output text
```

### DNS Records
```bash
AWS_PROFILE=personal aws route53 list-resource-record-sets \
  --hosted-zone-id Z08949911XTSGIT26ZA8W \
  --query "ResourceRecordSets[?Name=='feelfwd.app.' || Name=='www.feelfwd.app.' || Name=='api.feelfwd.app.']"
```

## 🔧 Key Resources

| Resource | Value |
|----------|-------|
| **Domain** | feelfwd.app |
| **Hosted Zone ID** | Z08949911XTSGIT26ZA8W |
| **Certificate ARN** | arn:aws:acm:us-east-1:418272766513:certificate/f769ac60-45eb-497b-9244-1a0bf579cf88 |
| **AWS Profile** | personal |
| **AWS Account** | 418272766513 |

## 📝 Nameservers (Update at Registrar)

```
ns-388.awsdns-48.com
ns-1814.awsdns-34.co.uk
ns-708.awsdns-24.net
ns-1271.awsdns-30.org
```

## 🧪 Test Endpoints (After Deployment)

```bash
# Frontend
curl -I https://feelfwd.app
curl -I https://www.feelfwd.app

# Backend API
curl https://api.feelfwd.app/health

# DNS Resolution
dig feelfwd.app
dig api.feelfwd.app
```

## 🚨 Troubleshooting

### Certificate Not Validating
1. Check validation record exists: `dig _b2d3feb5933c2447d23377dad4f1937e.feelfwd.app CNAME`
2. Wait 5-30 minutes for AWS to validate
3. If still pending after 30 min, check Route53 for conflicts

### Deployment Failed
1. Check AWS credentials: `aws sts get-caller-identity`
2. Review CloudFormation events
3. Check logs in `networking/logs/`

### DNS Not Resolving
1. Verify nameservers updated at registrar
2. Wait 2-48 hours for propagation
3. Clear local DNS cache

## 📁 Important Files

- **Current Status**: `networking/SUMMARY.md`
- **Full Documentation**: `networking/README.md`
- **DNS Setup Guide**: `networking/docs/dns-setup.md`
- **Deployment Script**: `networking/scripts/deploy-with-dns.sh`
- **Quick Deploy**: `networking/quick-deploy.sh`