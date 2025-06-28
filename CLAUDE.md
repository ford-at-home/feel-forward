# Claude Code Configuration - Feel Forward

## Project Summary
Feel Forward is a multi-phase self-awareness app that helps users gain emotional clarity about their preferences through a structured LLM-powered workflow. It guides users through five phases of decision-making, from exploring factors to synthesizing insights, using AI agents to facilitate emotional calibration and pattern recognition.

## Key Technologies
- **API Framework**: FastAPI with Pydantic models
- **AI Integration**: OpenAI API (optional), Strands SDK for agent orchestration
- **Infrastructure**: AWS (ECS Fargate, ECR, ALB, Route53, Secrets Manager)
- **IaC**: AWS CDK for infrastructure management
- **Containerization**: Docker
- **Python**: 3.11+
- **Testing**: pytest

## Main Files and Directories
- `api.py` - FastAPI application with phase endpoints
- `models.py` - Pydantic request/response models
- `strands/` - Phase agent implementations
  - `agent.py` - Agent exports
  - `phase0.py` through `phase4.py` - Individual phase logic
  - `utils.py` - Helper utilities
- `infra/` - AWS CDK infrastructure code
  - `backend_stack.py` - Main CDK stack definition
  - `app.py` - CDK app entry point
- `Dockerfile` - Container configuration
- `Makefile` - Automated deployment commands
- `PROMPTS.md` - Manual workflow prompts
- `SPECS.md` - Technical architecture
- `AI_GUIDE.md` - Guide for AI assistants

## Key Commands
```bash
# Local Development
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn api:app --reload          # Run API locally at http://localhost:8000

# Demo & Testing
make demo                         # Launch interactive CLI demo (auto-detects terminal)
python demo_interactive.py       # Force interactive demo
python demo_quick.py             # Non-interactive demo with preset inputs
pytest                            # Run unit tests

# Session Management
make sessions                     # Show session management options
make sessions-list                # List all saved demo sessions
make sessions-clean               # Clean old session files (keep latest 5)
make sessions-export              # Export session summary to markdown
make sessions-stats               # Show session statistics

# Deployment (Automated)
make deploy                        # Complete deployment (infra + image)
make bootstrap                     # Bootstrap CDK (first time only)
make infra                         # Deploy AWS infrastructure
make build-push                    # Build and push Docker image

# Manual Deployment
cd infra
cdk bootstrap                      # First time only
cdk deploy -c domain=feelfwd.app -c apiDomain=api.feelfwd.app
docker build -t feel-forward .
# ... (see README for full Docker push commands)

# Debugging
make describe-stack                # Check CloudFormation stack status
make describe-services             # Check ECS service status
make logs                         # View CloudWatch logs
```

## Important Architectural Decisions
1. **Five-Phase Workflow**:
   - Phase 0: Factor Discovery - Identify decision variables
   - Phase 1: Preference Detailing - Define preferences and trade-offs
   - Phase 2: Scenario Generation - Create realistic situations
   - Phase 3: Emotional Calibration - Capture emotional responses
   - Phase 4: Insight Synthesis - Extract patterns and contradictions
2. **Modular Agent Structure**: Each phase is a standalone agent using Strands SDK
3. **ECS Service Design**: Starts with 0 tasks to prevent deployment hangs
4. **Rate Limiting**: 60 requests per minute per IP
5. **CORS Configuration**: Restricted to feelfwd.app domains
6. **Health Checks**: `/health` endpoint for load balancer
7. **Secrets Management**: OpenAI API key in AWS Secrets Manager

## API Endpoints
- `POST /phase0/factors` - Discover decision factors
- `POST /phase1/preferences` - Detail preferences
- `POST /phase2/scenarios` - Generate scenarios
- `POST /phase3/reactions` - Log emotional reactions
- `POST /phase4/summary` - Synthesize insights

## Enhanced Demo System
- **Interactive CLI**: Full workflow experience with session save/resume
- **Session Management**: Automatic save, export to markdown reports, cleanup utilities
- **Error Recovery**: Graceful handling of interruptions and invalid inputs
- **Export Features**: JSON session files and formatted markdown reports
- **Progress Tracking**: Visual indicators and phase completion status
- **Multiple Modes**: Interactive terminal mode and automated demo mode

## Development Context
- **Current State**: Backend API deployed with AWS infrastructure
- **Domain**: api.feelfwd.app
- **Frontend**: Separate codebase at feelfwd.app
- **Environment Variables**:
  - `GITHUB_TOKEN` - Required for Strands SDK
  - `OPENAI_API_KEY` - Optional for LLM features
  - `AWS_REGION` - Defaults to us-east-1
- **Auto-scaling**: Based on CPU utilization (70% threshold)
- **Logging**: CloudWatch logs at `/ecs/feel-forward`

## Special Considerations
- Docker must be running for local development and deployment
- ECS service requires Docker image in ECR before scaling up
- DNS propagation can take up to 48 hours
- Rate limiting prevents abuse (429 responses)
- Health checks ensure service availability
- Manual fallback prompts available in PROMPTS.md
- Designed for reusability across domains (jobs, relationships, housing)