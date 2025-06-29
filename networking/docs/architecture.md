# System Architecture

## Overview

Feel Forward is a cloud-native application deployed on AWS, utilizing modern serverless and container technologies for scalability and reliability.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet Users                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Route 53                                │
│                    (DNS Management)                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  feelfwd.app    │  │ www.feelfwd.app │  │ api.feelfwd.app │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────────┐              ┌─────────────────────────────┐
│     CloudFront      │              │   Application Load Balancer  │
│   (CDN + HTTPS)     │              │        (HTTPS/HTTP)          │
└─────────────────────┘              └─────────────────────────────┘
           │                                        │
           ▼                                        ▼
┌─────────────────────┐              ┌─────────────────────────────┐
│      S3 Bucket      │              │      ECS Fargate Cluster     │
│  (Static Website)   │              │   ┌───────────────────────┐  │
│  - index.html       │              │   │   Feel Forward API    │  │
│  - JS/CSS assets    │              │   │   - FastAPI app       │  │
│  - Images           │              │   │   - Strands agents    │  │
└─────────────────────┘              │   │   - Port 8000         │  │
                                     │   └───────────────────────┘  │
                                     └─────────────────────────────┘
                                                    │
                                     ┌──────────────┴──────────────┐
                                     │                             │
                                     ▼                             ▼
                          ┌─────────────────────┐      ┌─────────────────────┐
                          │   ECR Repository    │      │   Secrets Manager   │
                          │  (Docker Images)    │      │  - OPENAI_API_KEY   │
                          └─────────────────────┘      │  - GITHUB_TOKEN     │
                                                       └─────────────────────┘
```

## Component Details

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript
- Vite build tool
- Tailwind CSS + shadcn/ui
- AWS S3 + CloudFront

**Key Features:**
- Single Page Application (SPA)
- Client-side routing
- Progressive enhancement
- Responsive design

**Deployment Flow:**
1. Build static assets with Vite
2. Upload to S3 bucket
3. CloudFront serves globally
4. Route53 manages DNS

### Backend Architecture

**Technology Stack:**
- FastAPI (Python 3.11+)
- Strands SDK for AI agents
- Docker containerization
- AWS ECS Fargate

**Key Features:**
- RESTful API design
- Async request handling
- Auto-scaling capability
- Health monitoring

**Service Architecture:**
```
ECS Service
├── Task Definition
│   ├── Container: feel-forward
│   ├── Image: ECR repository
│   ├── CPU: 256 units
│   └── Memory: 512 MB
├── Auto-scaling
│   ├── Min: 0 tasks
│   ├── Max: 5 tasks
│   └── Target: 70% CPU
└── Load Balancer
    ├── Target Group
    ├── Health Checks
    └── SSL Termination
```

## Network Architecture

### VPC Configuration
- **Region**: us-east-1
- **Availability Zones**: Multiple for HA
- **Subnets**: Public subnets for ALB and Fargate

### Security Groups

**ALB Security Group:**
- Inbound: 443 (HTTPS), 80 (HTTP) from 0.0.0.0/0
- Outbound: All traffic

**ECS Security Group:**
- Inbound: 8000 from ALB security group
- Outbound: All traffic (for external APIs)

### DNS Architecture

```
Route53 Hosted Zone (feelfwd.app)
├── A Record: feelfwd.app → CloudFront
├── AAAA Record: feelfwd.app → CloudFront (IPv6)
├── CNAME: www.feelfwd.app → feelfwd.app
├── A Record: api.feelfwd.app → ALB
└── CAA Record: Certificate authority restrictions
```

## Data Flow

### User Request Flow (Frontend)
1. User visits feelfwd.app
2. Route53 resolves to CloudFront
3. CloudFront checks cache
4. If miss, fetches from S3
5. Returns cached content

### API Request Flow
1. Frontend calls api.feelfwd.app
2. Route53 resolves to ALB
3. ALB routes to healthy ECS task
4. FastAPI processes request
5. Strands agents generate response
6. Response returned to frontend

### Session Flow
```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4
   ↓         ↓         ↓         ↓         ↓
Factors  Preferences Scenarios Reactions Insights
```

## Security Architecture

### Defense in Depth
1. **Edge Security**: CloudFront with AWS Shield
2. **Network Security**: Security groups and NACLs
3. **Application Security**: CORS, rate limiting
4. **Data Security**: HTTPS everywhere
5. **Secret Management**: AWS Secrets Manager

### Compliance Considerations
- HTTPS enforced
- No PII stored
- Stateless API design
- Audit logging enabled

## Scaling Architecture

### Frontend Scaling
- CloudFront: Automatic global scaling
- S3: Virtually unlimited storage
- No scaling configuration needed

### Backend Scaling
- **Horizontal**: ECS auto-scaling (1-5 tasks)
- **Vertical**: Fargate task size adjustment
- **Geographic**: Multi-region capability

### Load Patterns
```
Normal Load: 1 ECS task
Peak Load: 3-5 ECS tasks
Maintenance: 0 ECS tasks (cost savings)
```

## Monitoring Architecture

### CloudWatch Integration
```
Metrics
├── ECS
│   ├── CPU Utilization
│   ├── Memory Utilization
│   └── Task Count
├── ALB
│   ├── Request Count
│   ├── Target Response Time
│   └── HTTP Error Codes
└── CloudFront
    ├── Requests
    ├── Bytes Downloaded
    └── Error Rate
```

### Logging Strategy
- **Application Logs**: CloudWatch Logs
- **Access Logs**: S3 bucket
- **Error Tracking**: CloudWatch Insights

## Disaster Recovery

### Backup Strategy
- **Code**: Git repository
- **Infrastructure**: CDK templates
- **Secrets**: Secrets Manager versioning

### Recovery Time Objectives
- **RTO**: 30 minutes
- **RPO**: 0 (stateless design)

### Failure Scenarios
1. **ECS Task Failure**: Auto-restart
2. **AZ Failure**: Multi-AZ deployment
3. **Region Failure**: Manual failover

## Future Architecture Considerations

### Short-term Improvements
- API Gateway for advanced features
- Lambda for lightweight operations
- DynamoDB for session persistence

### Long-term Evolution
- Microservices architecture
- Event-driven processing
- Real-time capabilities (WebSocket)
- Multi-region active-active