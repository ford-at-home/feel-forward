# Troubleshooting Guide

This guide covers common issues encountered during deployment and operation of Feel Forward.

## Table of Contents

- [DNS Issues](#dns-issues)
- [SSL/Certificate Issues](#ssl-issues)
- [Backend/API Issues](#backend-api-issues)
- [Frontend Issues](#frontend-issues)
- [CORS Issues](#cors-issues)
- [Load Balancer Issues](#load-balancer-issues)
- [ECS/Container Issues](#ecs-container-issues)
- [CloudFront Issues](#cloudfront-issues)
- [Build and Deployment Issues](#build-and-deployment-issues)
- [Performance Issues](#performance-issues)

## DNS Issues

### Problem: Domain not resolving

**Symptoms:**
```bash
$ curl https://feelfwd.app
curl: (6) Could not resolve host: feelfwd.app
```

**Diagnosis:**
```bash
# Check nameservers
dig NS feelfwd.app

# Check specific record
dig A feelfwd.app
dig A api.feelfwd.app

# Check Route53 configuration
aws route53 list-resource-record-sets \
  --hosted-zone-id Z08949911XTSGIT26ZA8W
```

**Solutions:**
1. Verify nameservers at domain registrar match Route53
2. Wait for DNS propagation (up to 48 hours)
3. Clear local DNS cache:
   ```bash
   # macOS
   sudo dscacheutil -flushcache
   
   # Linux
   sudo systemctl restart systemd-resolved
   
   # Windows
   ipconfig /flushdns
   ```

### Problem: API subdomain not working

**Symptoms:**
- Frontend loads but API calls fail
- `api.feelfwd.app` doesn't resolve

**Solutions:**
1. Check A record exists for api subdomain:
   ```bash
   aws route53 list-resource-record-sets \
     --hosted-zone-id Z08949911XTSGIT26ZA8W \
     --query "ResourceRecordSets[?Name=='api.feelfwd.app.']"
   ```

2. Verify ALB is running:
   ```bash
   aws elbv2 describe-load-balancers \
     --query "LoadBalancers[?contains(LoadBalancerName, 'FeelF')]"
   ```

## SSL Issues

### Problem: Certificate not valid

**Symptoms:**
- Browser shows security warning
- "NET::ERR_CERT_AUTHORITY_INVALID"

**Diagnosis:**
```bash
# Check certificate status
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:XXX:certificate/YYY \
  --query 'Certificate.Status'

# Verify certificate details
openssl s_client -connect feelfwd.app:443 -servername feelfwd.app
```

**Solutions:**
1. Ensure certificate is in "ISSUED" status
2. Verify certificate includes both root and wildcard domains
3. For CloudFront, certificate must be in us-east-1
4. Re-run certificate validation if pending

### Problem: Mixed content warnings

**Symptoms:**
- Console errors about mixed content
- Some resources blocked

**Solutions:**
1. Ensure all API calls use HTTPS:
   ```javascript
   // Check frontend config
   VITE_API_URL=https://api.feelfwd.app  // Not http://
   ```

2. Update Content Security Policy if needed

## Backend API Issues

### Problem: API returns 502/503 errors

**Symptoms:**
- Intermittent 502 Bad Gateway
- 503 Service Unavailable

**Diagnosis:**
```bash
# Check ECS service status
aws ecs describe-services \
  --cluster feel-forward \
  --services feel-forward-service

# Check target health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:XXX
```

**Solutions:**
1. Ensure ECS tasks are running:
   ```bash
   aws ecs update-service \
     --cluster feel-forward \
     --service feel-forward-service \
     --desired-count 1
   ```

2. Check CloudWatch logs:
   ```bash
   aws logs tail /ecs/feel-forward --follow
   ```

3. Verify Docker image exists in ECR

### Problem: API timeouts

**Symptoms:**
- Requests take >30 seconds
- 504 Gateway Timeout errors

**Solutions:**
1. Check ECS task CPU/memory:
   ```bash
   # Update task definition with more resources
   # CPU: 512, Memory: 1024
   ```

2. Review application logs for slow operations

3. Check if OpenAI API is responding slowly

## Frontend Issues

### Problem: Blank page or loading errors

**Symptoms:**
- White screen
- Console errors about missing files

**Diagnosis:**
```bash
# Check S3 bucket contents
aws s3 ls s3://feelfwd-website-bucket/

# Verify index.html exists
aws s3 head-object --bucket feelfwd-website-bucket --key index.html
```

**Solutions:**
1. Re-upload frontend files:
   ```bash
   cd frontend
   npm run build
   aws s3 sync dist/ s3://bucket-name --delete
   ```

2. Clear CloudFront cache:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id ABCDEF \
     --paths "/*"
   ```

### Problem: Old version still showing

**Symptoms:**
- Changes not visible after deployment
- Browser shows cached version

**Solutions:**
1. Force CloudFront invalidation
2. Clear browser cache
3. Check cache headers on index.html

## CORS Issues

### Problem: CORS policy blocking API calls

**Symptoms:**
```
Access to XMLHttpRequest at 'https://api.feelfwd.app' from origin 'https://feelfwd.app' has been blocked by CORS policy
```

**Diagnosis:**
```bash
# Test CORS headers
curl -H "Origin: https://feelfwd.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://api.feelfwd.app/phase0/factors -v
```

**Solutions:**
1. Update backend CORS configuration:
   ```python
   # In api.py
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://feelfwd.app", "https://www.feelfwd.app"],
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. Rebuild and redeploy backend

## Load Balancer Issues

### Problem: Health checks failing

**Symptoms:**
- ECS tasks marked unhealthy
- Constant task recycling

**Diagnosis:**
```bash
# Check health check configuration
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:XXX

# Test health endpoint directly
curl http://load-balancer-dns:8000/health
```

**Solutions:**
1. Verify health check settings:
   - Path: /health
   - Port: 8000
   - Timeout: 30 seconds
   - Interval: 60 seconds

2. Ensure security groups allow health checks

## ECS Container Issues

### Problem: Container won't start

**Symptoms:**
- Task stops immediately after starting
- "Essential container exited" errors

**Diagnosis:**
```bash
# Check task stopped reason
aws ecs describe-tasks \
  --cluster feel-forward \
  --tasks arn:aws:ecs:XXX

# View container logs
aws logs get-log-events \
  --log-group-name /ecs/feel-forward \
  --log-stream-name ecs/feel-forward/TASK_ID
```

**Solutions:**
1. Check environment variables are set
2. Verify Secrets Manager permissions
3. Ensure Docker image is built correctly:
   ```bash
   docker run -p 8000:8000 --env-file .env feel-forward
   ```

### Problem: Out of memory errors

**Symptoms:**
- Container killed with code 137
- "Container killed due to memory limit"

**Solutions:**
1. Increase task memory in CDK:
   ```typescript
   memoryLimitMiB: 1024,  // Increase from 512
   ```

2. Optimize application memory usage

## CloudFront Issues

### Problem: 403 Access Denied

**Symptoms:**
- CloudFront returns 403 errors
- S3 bucket policy issues

**Solutions:**
1. Verify OAI configuration:
   ```bash
   aws s3api get-bucket-policy --bucket bucket-name
   ```

2. Check S3 bucket permissions allow CloudFront OAI

### Problem: Slow page loads

**Symptoms:**
- High latency
- Poor cache hit ratio

**Solutions:**
1. Check CloudFront metrics:
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/CloudFront \
     --metric-name CacheHitRate
   ```

2. Optimize cache behaviors
3. Enable compression

## Build and Deployment Issues

### Problem: CDK deployment fails

**Symptoms:**
- "Stack is in UPDATE_ROLLBACK_FAILED state"
- Bootstrap errors

**Solutions:**
1. Delete and recreate stack:
   ```bash
   cdk destroy StackName
   cdk deploy StackName
   ```

2. Check IAM permissions

3. Ensure CDK is bootstrapped:
   ```bash
   cdk bootstrap aws://ACCOUNT/REGION
   ```

### Problem: Docker build fails

**Symptoms:**
- "Cannot connect to Docker daemon"
- Build errors

**Solutions:**
1. Ensure Docker is running
2. Check Dockerfile syntax
3. Clear Docker cache:
   ```bash
   docker system prune -a
   ```

## Performance Issues

### Problem: High latency

**Diagnosis:**
```bash
# Check ECS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=feel-forward-service

# Check ALB latency
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime
```

**Solutions:**
1. Scale ECS service:
   ```bash
   aws ecs update-service \
     --cluster feel-forward \
     --service feel-forward-service \
     --desired-count 2
   ```

2. Enable auto-scaling
3. Optimize API response times
4. Review CloudWatch logs for bottlenecks

## Getting Help

If issues persist:

1. Check AWS Service Health Dashboard
2. Review CloudWatch logs thoroughly
3. Enable debug logging:
   ```python
   LOG_LEVEL=DEBUG
   ```
4. Contact AWS Support if infrastructure-related
5. Open GitHub issue with:
   - Error messages
   - Steps to reproduce
   - Environment details
   - Relevant logs