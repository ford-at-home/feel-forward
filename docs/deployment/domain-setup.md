# Domain Setup Guide

This guide covers setting up the feelfwd.app domain and its subdomains for the Feel Forward application.

## Prerequisites

- Domain registered (feelfwd.app)
- AWS account with Route53 access
- Access to domain registrar's DNS settings

## Domain Architecture

```
feelfwd.app           → Frontend (CloudFront)
www.feelfwd.app       → Frontend (redirect to root)
api.feelfwd.app       → Backend API (ALB)
staging.feelfwd.app   → Staging frontend (optional)
```

## Initial Domain Setup

### 1. Create Route53 Hosted Zone

```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name feelfwd.app \
  --caller-reference $(date +%s) \
  --hosted-zone-config Comment="Feel Forward production domain"

# Get the hosted zone ID
ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --query "HostedZones[?Name=='feelfwd.app.'].Id" \
  --output text | cut -d'/' -f3)

echo "Hosted Zone ID: $ZONE_ID"
```

### 2. Update Domain Registrar

1. Log into your domain registrar
2. Find DNS/Nameserver settings
3. Replace with Route53 nameservers:
   ```bash
   # Get Route53 nameservers
   aws route53 get-hosted-zone --id $ZONE_ID \
     --query 'DelegationSet.NameServers' \
     --output json
   ```
4. Update all 4 nameservers at registrar
5. Wait for propagation (up to 48 hours)

### 3. Verify Domain Setup

```bash
# Check nameservers
dig NS feelfwd.app

# Verify Route53 is authoritative
nslookup feelfwd.app
```

## SSL Certificate Setup

### Automated Setup

```bash
cd networking/scripts
./ssl-certificate.sh
```

### Manual Setup

1. **Request certificate**:
   ```bash
   CERT_ARN=$(aws acm request-certificate \
     --domain-name feelfwd.app \
     --subject-alternative-names "*.feelfwd.app" \
     --validation-method DNS \
     --region us-east-1 \
     --query 'CertificateArn' \
     --output text)
   ```

2. **Add validation records**:
   ```bash
   # Get validation records
   aws acm describe-certificate \
     --certificate-arn $CERT_ARN \
     --region us-east-1 \
     --query 'Certificate.DomainValidationOptions[0].ResourceRecord'
   ```

3. **Create Route53 validation record**:
   ```bash
   # Use the values from previous command
   aws route53 change-resource-record-sets \
     --hosted-zone-id $ZONE_ID \
     --change-batch file://validation-record.json
   ```

4. **Wait for validation** (5-10 minutes)

## Frontend Domain Setup

### Production (feelfwd.app)

The CDK stack automatically creates:
- A record → CloudFront distribution
- AAAA record → CloudFront distribution (IPv6)

### WWW Redirect

Create CNAME record:
```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "www.feelfwd.app",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "feelfwd.app"}]
      }
    }]
  }'
```

## Backend API Domain Setup

### api.feelfwd.app

The backend CDK stack automatically creates:
- A record → Application Load Balancer
- Health checks via ALB

Manual verification:
```bash
# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --query "LoadBalancers[?contains(LoadBalancerName, 'FeelF')].DNSName" \
  --output text)

# Verify A record exists
aws route53 list-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --query "ResourceRecordSets[?Name=='api.feelfwd.app.']"
```

## DNS Troubleshooting

### Check DNS Propagation

```bash
# Check from multiple locations
dig @8.8.8.8 feelfwd.app
dig @1.1.1.1 api.feelfwd.app

# Check specific record types
dig A feelfwd.app
dig AAAA feelfwd.app
dig CNAME www.feelfwd.app
```

### Common Issues

1. **DNS not resolving**
   - Verify nameservers at registrar
   - Check Route53 hosted zone has records
   - Wait for TTL to expire (up to 48 hours)

2. **SSL certificate not working**
   - Ensure certificate is in us-east-1 for CloudFront
   - Verify certificate includes both root and wildcard
   - Check certificate status is "ISSUED"

3. **API subdomain not working**
   - Verify ALB is running and healthy
   - Check security groups allow traffic
   - Ensure Route53 A record points to ALB

## Monitoring DNS

### Set up Route53 Health Checks

```bash
# Create health check for API
aws route53 create-health-check \
  --caller-reference $(date +%s) \
  --health-check-config '{
    "Type": "HTTPS",
    "ResourcePath": "/health",
    "FullyQualifiedDomainName": "api.feelfwd.app",
    "Port": 443,
    "RequestInterval": 30,
    "FailureThreshold": 3
  }'
```

### CloudWatch Alarms

Create alarms for:
- Route53 health check failures
- DNS query anomalies
- Certificate expiration (90 days)

## Security Best Practices

1. **Enable DNSSEC** for additional security
2. **Use CAA records** to restrict certificate authorities:
   ```bash
   aws route53 change-resource-record-sets \
     --hosted-zone-id $ZONE_ID \
     --change-batch '{
       "Changes": [{
         "Action": "CREATE",
         "ResourceRecordSet": {
           "Name": "feelfwd.app",
           "Type": "CAA",
           "TTL": 300,
           "ResourceRecords": [
             {"Value": "0 issue \"amazon.com\""},
             {"Value": "0 issuewild \"amazon.com\""}
           ]
         }
       }]
     }'
   ```

3. **Monitor for subdomain takeover** vulnerabilities
4. **Set up domain lock** at registrar level

## Cost Optimization

- Route53 Hosted Zone: ~$0.50/month
- DNS Queries: $0.40 per million queries
- Health Checks: $0.50/month per health check
- Consider using Route53 Resolver for internal DNS

## Next Steps

After domain setup:
1. Deploy backend infrastructure
2. Deploy frontend infrastructure
3. Verify all endpoints are accessible
4. Set up monitoring and alerts
5. Configure email (SES) if needed