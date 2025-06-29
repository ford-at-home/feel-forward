# Feel Forward Networking & Deployment

This directory contains all networking configuration, deployment scripts, and infrastructure documentation for the Feel Forward application.

## Overview

Feel Forward consists of two main components that need to be deployed and networked together:
- **Frontend**: React app served via CloudFront/S3
- **Backend**: FastAPI service running on ECS Fargate

## Directory Structure

```
networking/
├── SUMMARY.md              # 🔥 START HERE - Current deployment status
├── README.md               # This file - documentation hub
├── docs/                   # Detailed documentation
│   ├── architecture.md     # System architecture overview
│   ├── dns-setup.md        # Complete DNS configuration guide
│   ├── deployment-flow.md  # Step-by-step deployment process
│   └── troubleshooting.md  # Common issues and solutions
├── scripts/                # Automation scripts
│   ├── deploy-with-dns.sh  # Full DNS-aware deployment
│   ├── quick-deploy.sh     # Quick frontend deployment
│   ├── ssl-certificate.sh  # SSL certificate setup
│   ├── deploy-all.sh       # Full stack deployment
│   └── health-check.sh     # Service health verification
├── logs/                   # Deployment history
│   ├── deployment-status.md     # Latest deployment status
│   └── deployment-log-manual.md # Manual steps documentation
└── config/                 # Configuration files
    └── certificate-validation.json # ACM validation record
```

## 🔥 Quick Start - CURRENT STATUS

**📍 Where We Are**: SSL Certificate is PENDING_VALIDATION. Once validated, frontend can be deployed.

### Check Current Status
```bash
# 1. Check certificate validation status (wait for "ISSUED")
AWS_PROFILE=personal aws acm describe-certificate --region us-east-1 \
  --certificate-arn "arn:aws:acm:us-east-1:418272766513:certificate/f769ac60-45eb-497b-9244-1a0bf579cf88" \
  --query "Certificate.Status" --output text

# 2. Once ISSUED, deploy frontend
cd networking
./quick-deploy.sh
```

**📋 See [SUMMARY.md](./SUMMARY.md) for complete current status and next steps.**

### Prerequisites ✅ (All Completed)
- AWS account with appropriate permissions ✅
- Domain registered (feelfwd.app) ✅
- AWS CLI configured (profile: personal) ✅
- Docker installed ✅
- Node.js 20+ and Python 3.11+ ✅

### Deployment Steps
```bash
# Option 1: Automated deployment (recommended)
./scripts/deploy-with-dns.sh

# Option 2: Quick deployment (when certificate is ready)
./quick-deploy.sh

# Option 3: Manual deployment
cd ../frontend/infra
CERTIFICATE_ARN="arn:aws:acm:us-east-1:418272766513:certificate/f769ac60-45eb-497b-9244-1a0bf579cf88" \
HOSTED_ZONE_ID="Z08949911XTSGIT26ZA8W" \
npx cdk deploy FeelFwdProdStack
```

## Network Architecture

```
Internet
    │
    ├─── CloudFront ──→ S3 (Frontend)
    │         ↓
    │    feelfwd.app
    │    www.feelfwd.app
    │
    └─── ALB ──→ ECS Fargate (Backend)
              ↓
         api.feelfwd.app
```

## Domain Configuration

| Domain | Type | Target | Purpose |
|--------|------|---------|---------|
| feelfwd.app | A/AAAA | CloudFront | Main frontend |
| www.feelfwd.app | CNAME | feelfwd.app | WWW redirect |
| api.feelfwd.app | A | ALB DNS | Backend API |

## SSL/TLS Configuration

- **Frontend**: ACM certificate in us-east-1 (CloudFront requirement)
- **Backend**: ACM certificate for ALB
- **Domains covered**: feelfwd.app, *.feelfwd.app

## Key Infrastructure Components

### Frontend
- **S3 Bucket**: Static file hosting
- **CloudFront**: Global CDN
- **Route53**: DNS management
- **ACM**: SSL certificates

### Backend
- **ECS Fargate**: Container hosting
- **ALB**: Load balancing
- **ECR**: Docker registry
- **Secrets Manager**: API keys

## Deployment Process

### Automated Deployment
```bash
# Full stack deployment
./scripts/deploy-all.sh

# This script:
# 1. Validates prerequisites
# 2. Deploys backend infrastructure
# 3. Builds and pushes Docker image
# 4. Deploys frontend infrastructure
# 5. Uploads frontend assets
# 6. Invalidates CloudFront cache
# 7. Runs health checks
```

### Manual Deployment
See detailed guides:
- [Backend Deployment](../docs/deployment/backend.md)
- [Frontend Deployment](../docs/deployment/frontend.md)
- [Domain Setup](../docs/deployment/domain-setup.md)

## Monitoring & Health Checks

### Automated Health Checks
```bash
./scripts/health-check.sh
```

This verifies:
- Frontend accessibility
- API health endpoint
- SSL certificate validity
- DNS resolution

### Manual Verification
```bash
# Check frontend
curl -I https://feelfwd.app

# Check API
curl https://api.feelfwd.app/health

# Check DNS
dig feelfwd.app
dig api.feelfwd.app
```

## Security Considerations

1. **HTTPS Only**: All traffic encrypted
2. **CORS**: Restricted to feelfwd.app domains
3. **Rate Limiting**: 60 req/min per IP
4. **Secrets Management**: AWS Secrets Manager
5. **Network Isolation**: Private subnets where applicable

## Cost Optimization

### Estimated Monthly Costs
- Route53: ~$0.50 (hosted zone)
- CloudFront: ~$5-10 (depends on traffic)
- S3: ~$1 (storage + requests)
- ECS Fargate: ~$10-20 (1 task)
- ALB: ~$20
- **Total**: ~$40-60/month

### Cost Saving Tips
1. Use CloudFront caching aggressively
2. Scale ECS to 0 when not in use
3. Enable S3 lifecycle policies
4. Use Fargate Spot for dev/staging

## Troubleshooting

Common issues and solutions:
- [DNS not resolving](docs/troubleshooting.md#dns-issues)
- [SSL certificate errors](docs/troubleshooting.md#ssl-issues)
- [CORS errors](docs/troubleshooting.md#cors-issues)
- [502/503 errors](docs/troubleshooting.md#load-balancer-issues)

## Maintenance

### Regular Tasks
1. **Monthly**: Review CloudWatch costs
2. **Quarterly**: Update SSL certificates (auto-renewed)
3. **Yearly**: Review and optimize infrastructure

### Backup Strategy
- Frontend: S3 versioning enabled
- Backend: ECS task definitions versioned
- Database: N/A (stateless API)

## Emergency Procedures

### Rollback Process
```bash
# Frontend rollback
./scripts/rollback-frontend.sh <version>

# Backend rollback
./scripts/rollback-backend.sh <version>
```

### Incident Response
1. Check CloudWatch alarms
2. Review ECS/CloudFront logs
3. Verify health endpoints
4. Check AWS Service Health

## Future Improvements

### Planned Enhancements
- [ ] Multi-region deployment
- [ ] Auto-scaling policies
- [ ] CDN optimization
- [ ] Infrastructure monitoring dashboard
- [ ] Automated backups
- [ ] CI/CD pipeline

### Long-term Goals
- Kubernetes migration option
- GraphQL API gateway
- WebSocket support
- Edge computing capabilities

---

For detailed information on specific topics, see the documentation in the `docs/` directory.