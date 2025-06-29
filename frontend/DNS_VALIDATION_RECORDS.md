# DNS Validation Records for SSL Certificate

## Certificate Status: PENDING_VALIDATION
Certificate ARN: `arn:aws:acm:us-east-1:418272766513:certificate/f99bffe5-6671-47be-82be-60f8b4c9db31`

## Required DNS Records for IONOS

You need to add the following CNAME record to validate your SSL certificate:

### Validation Record
- **Type**: CNAME
- **Name**: `_01dc4c20c3067cbdd82590ee091d3a37`
- **Value**: `_78faabc731bad5a38bdfb74229b753c3.xlfgrmvvlj.acm-validations.aws.`
- **TTL**: 300 (or default)

**Important**: In IONOS, you typically only need to enter the subdomain part. So for the name field, enter:
`_01dc4c20c3067cbdd82590ee091d3a37`

(IONOS will automatically append `.felfwd.app` to it)

## Steps to Add in IONOS:
1. Log into IONOS control panel
2. Navigate to your domain `felfwd.app`
3. Go to DNS settings
4. Add new CNAME record with the values above
5. Save changes

## Verification
After adding the record, it can take 5-30 minutes for AWS to detect and validate the certificate. You can check the status with:

```bash
aws acm describe-certificate \
  --certificate-arn "arn:aws:acm:us-east-1:418272766513:certificate/f99bffe5-6671-47be-82be-60f8b4c9db31" \
  --region us-east-1 \
  --profile personal \
  --query "Certificate.Status"
```

Once it shows "ISSUED", you can proceed with the deployment.

## After Certificate Validation

Once the certificate is validated (status: ISSUED), you can deploy again:

```bash
cd frontend
export CERTIFICATE_ARN="arn:aws:acm:us-east-1:418272766513:certificate/f99bffe5-6671-47be-82be-60f8b4c9db31"
export HOSTED_ZONE_ID="Z08949911XTSGIT26ZA8W"
export AWS_PROFILE=personal
npm run deploy:prod
```

## CloudFront Distribution Records

After successful deployment, add these DNS records to IONOS to point your domain to CloudFront:

### Root Domain (felfwd.app)
- **Type**: A
- **Name**: @ (or leave empty)
- **Value**: Will be provided after deployment (CloudFront distribution domain)

### WWW Subdomain (optional)
- **Type**: CNAME
- **Name**: www
- **Value**: `felfwd.app` (or CloudFront distribution domain)

**Note**: Your CloudFront distribution domain is: `d1rr9ueubvw4ur.cloudfront.net`