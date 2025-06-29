# Feel Forward Backend

The Feel Forward backend is a FastAPI service that orchestrates a five-phase self-awareness workflow using AI agents. It provides RESTful endpoints for each phase and manages the flow of user responses through the decision-making process.

## 🛠 Tech Stack

- **Framework**: FastAPI (Python 3.11+)
- **AI Integration**: Strands SDK for agent orchestration
- **LLM Support**: OpenAI API (optional)
- **Infrastructure**: AWS ECS Fargate, ALB, ECR
- **IaC**: AWS CDK
- **Testing**: pytest
- **Containerization**: Docker

## 🚀 Quick Start

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp ../.env.example ../.env
# Edit .env and add your GITHUB_TOKEN (required)

# Run the API locally
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- OpenAPI Schema: `http://localhost:8000/openapi.json`

## 📁 Project Structure

```
backend/
├── api.py               # FastAPI application and endpoints
├── models.py            # Pydantic models for requests/responses
├── session_manager.py   # Session state management
├── strands/            # AI agent implementations
│   ├── agent.py        # Agent factory and exports
│   ├── phase0.py       # Factor discovery agent
│   ├── phase1.py       # Preference detailing agent
│   ├── phase2.py       # Scenario generation agent
│   ├── phase3.py       # Emotional calibration agent
│   ├── phase4.py       # Insight synthesis agent
│   └── utils.py        # Shared utilities
├── demo_cli.py         # Interactive CLI demo
├── demo_interactive.py # Terminal UI demo
├── demo_quick.py       # Automated demo script
├── tests/              # Unit and integration tests
├── infra/              # AWS CDK infrastructure
├── Dockerfile          # Container configuration
└── requirements.txt    # Python dependencies
```

## 🎯 API Endpoints

### Core Endpoints

| Method | Endpoint | Description | Request Model | Response Model |
|--------|----------|-------------|---------------|----------------|
| GET | `/health` | Health check | - | `HealthResponse` |
| POST | `/phase0/factors` | Discover decision factors | `Phase0Request` | `Phase0Response` |
| POST | `/phase1/preferences` | Detail preferences | `Phase1Request` | `Phase1Response` |
| POST | `/phase2/scenarios` | Generate scenarios | `Phase2Request` | `Phase2Response` |
| POST | `/phase3/reactions` | Log emotional reactions | `Phase3Request` | `Phase3Response` |
| POST | `/phase4/summary` | Synthesize insights | `Phase4Request` | `Phase4Response` |

### Request/Response Examples

#### Phase 0: Factor Discovery
```json
// Request
{
  "decision_context": "Choosing between job offers in different cities"
}

// Response
{
  "factors": [
    {
      "name": "Salary and Benefits",
      "description": "Compensation package including base salary, bonuses, health insurance",
      "importance": "high"
    },
    // ... more factors
  ],
  "follow_up_questions": ["What matters most to you?", "Any other considerations?"]
}
```

See full API documentation at `/docs` when running locally.

## 🧠 AI Agent Architecture

### Strands SDK Integration
Each phase is implemented as an independent Strands agent:

```python
from strands import Agent

phase0_agent = Agent(
    name="phase0_factor_discovery",
    description="Discovers key factors in decision-making",
    # ... configuration
)
```

### Agent Capabilities
- **Context Preservation**: Agents maintain context across phases
- **Dynamic Prompting**: Adapts based on user responses
- **Error Recovery**: Graceful handling of LLM failures
- **Response Validation**: Ensures output quality

### OpenAI Integration (Optional)
When `OPENAI_API_KEY` is provided:
- Enhanced response generation
- More nuanced emotional analysis
- Advanced pattern recognition

## 🎮 Demo System

### Interactive CLI Demo
```bash
make demo  # or python demo_cli.py
```

Features:
- Full workflow walkthrough
- Session persistence
- Export to markdown
- Multiple example scenarios

### Quick Demo
```bash
python demo_quick.py
```

Runs automated demo with preset responses.

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=.

# Run specific test file
pytest tests/test_api.py

# Run integration tests
python test_flow.py
```

### Test Categories
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **Flow Tests**: Complete workflow validation
- **Agent Tests**: Strands agent behavior

## 🚢 Deployment

### Local Docker Build
```bash
docker build -t feel-forward .
docker run -p 8000:8000 --env-file ../.env feel-forward
```

### AWS Deployment
```bash
# Using Makefile (recommended)
make deploy

# Manual deployment
cd infra
cdk deploy -c domain=feelfwd.app -c apiDomain=api.feelfwd.app
```

See [Backend Deployment Guide](../docs/deployment/backend.md) for detailed instructions.

## ⚙️ Configuration

### Environment Variables
- `GITHUB_TOKEN` (required): For Strands SDK authentication
- `OPENAI_API_KEY` (optional): Enables OpenAI LLM features
- `AWS_REGION` (default: us-east-1): AWS deployment region
- `LOG_LEVEL` (default: INFO): Logging verbosity

### API Configuration
- **Rate Limiting**: 60 requests/minute per IP
- **CORS**: Configured for feelfwd.app domains
- **Request Timeout**: 60 seconds
- **Max Request Size**: 1MB

## 🏗 Infrastructure

### AWS Resources
- **ECS Fargate**: Serverless container hosting
- **Application Load Balancer**: HTTPS termination
- **ECR**: Docker image repository
- **Secrets Manager**: API key storage
- **CloudWatch**: Logging and monitoring
- **Route53**: DNS management

### Scaling Configuration
- **Min Tasks**: 0 (cost optimization)
- **Max Tasks**: 5
- **Target CPU**: 70%
- **Scale Up**: 1 minute
- **Scale Down**: 5 minutes

## 🔒 Security

### Implemented Measures
- HTTPS only via ALB
- Secrets in AWS Secrets Manager
- CORS restricted to specific domains
- Rate limiting per IP
- Input validation via Pydantic
- Container runs as non-root user

### Best Practices
- Never commit `.env` files
- Rotate API keys regularly
- Monitor CloudWatch logs
- Use least-privilege IAM roles
- Enable AWS GuardDuty

## 📊 Monitoring

### CloudWatch Metrics
- Request count and latency
- Error rates by endpoint
- CPU and memory utilization
- Active connections

### Logging
- Structured JSON logging
- Request/response logging
- Error stack traces
- Performance metrics

### Alerts
- High error rate (>5%)
- High latency (>5s)
- Low health check success
- High CPU usage (>80%)

## 🐛 Troubleshooting

### Common Issues

1. **Strands SDK Authentication**
   - Verify GITHUB_TOKEN is set
   - Check token has correct permissions
   - Token may need refresh

2. **OpenAI API Errors**
   - Check API key is valid
   - Monitor rate limits
   - Verify account has credits

3. **Container Won't Start**
   - Check CloudWatch logs
   - Verify environment variables
   - Ensure Docker image exists in ECR

4. **High Latency**
   - Check ECS task CPU/memory
   - Review CloudWatch metrics
   - Consider scaling up tasks

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit pull request

### Code Style
- Follow PEP 8
- Type hints required
- Docstrings for public functions
- Black for formatting
- isort for imports

## 📚 Additional Resources

- [API Reference](../docs/api/reference.md)
- [Deployment Guide](../docs/deployment/backend.md)
- [Architecture Overview](../docs/architecture/SPECS.md)
- [Strands Documentation](./strands/README.md)

---

For questions or issues, please check the [troubleshooting guide](../docs/deployment/troubleshooting.md) or open an issue on GitHub.