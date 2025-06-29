# Feel Forward

Feel Forward is a multi-phase self-awareness app that helps users gain emotional clarity about their preferences through a structured LLM-powered workflow. It guides users through five phases of decision-making, from exploring factors to synthesizing insights, using AI agents to facilitate emotional calibration and pattern recognition.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/feel-forward.git
cd feel-forward

# Set up environment variables
cp .env.example .env
# Edit .env and add your GITHUB_TOKEN (required) and OPENAI_API_KEY (optional)

# Backend development
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn api:app --reload  # Runs at http://localhost:8000

# Frontend development
cd frontend
npm install
npm run dev  # Runs at http://localhost:5173
```

## 📁 Repository Structure

```
feel-forward/
├── backend/               # FastAPI backend service
│   ├── api.py            # Main API application
│   ├── models.py         # Pydantic data models
│   ├── strands/          # Phase agent implementations
│   ├── infra/            # AWS CDK infrastructure
│   └── tests/            # Backend unit tests
├── frontend/             # React TypeScript frontend
│   ├── src/              # Frontend source code
│   ├── scripts/          # Deployment scripts
│   └── infra/            # Frontend CDK infrastructure
├── networking/           # Network configuration and SSL
│   ├── docs/             # Networking documentation
│   └── scripts/          # SSL and domain setup scripts
└── docs/                 # Project documentation
    ├── api/              # API documentation
    ├── architecture/     # System design docs
    ├── deployment/       # Deployment guides
    └── development/      # Development guides
```

## 🛠 Key Technologies

### Backend
- **Framework**: FastAPI with Pydantic models
- **AI Integration**: Strands SDK for agent orchestration, OpenAI API (optional)
- **Infrastructure**: AWS ECS Fargate, ALB, Route53, ECR
- **IaC**: AWS CDK for infrastructure management
- **Python**: 3.11+

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui with Tailwind CSS
- **State Management**: React hooks and context
- **Infrastructure**: AWS S3, CloudFront, Route53

## 🎯 Five-Phase Workflow

1. **Phase 0: Factor Discovery** - Identify decision variables and considerations
2. **Phase 1: Preference Detailing** - Define preferences, priorities, and trade-offs
3. **Phase 2: Scenario Generation** - Create realistic decision scenarios
4. **Phase 3: Emotional Calibration** - Capture emotional responses to scenarios
5. **Phase 4: Insight Synthesis** - Extract patterns, contradictions, and insights

## 🚢 Deployment

### Prerequisites
- AWS CLI configured with appropriate credentials
- Docker installed and running
- Node.js 20+ and Python 3.11+
- GitHub Token for Strands SDK

### Automated Deployment (Recommended)

```bash
# Complete deployment for both frontend and backend
make deploy

# Or deploy individually:
make deploy-backend    # Deploy backend infrastructure and service
make deploy-frontend   # Deploy frontend to S3/CloudFront
```

### Manual Deployment

See detailed deployment guides:
- [Backend Deployment Guide](docs/deployment/backend.md)
- [Frontend Deployment Guide](docs/deployment/frontend.md)
- [Domain Setup Guide](docs/deployment/domain-setup.md)

## 🌐 Production URLs

- **Frontend**: https://feelfwd.app
- **API**: https://api.feelfwd.app
- **API Documentation**: https://api.feelfwd.app/docs

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
```

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/docs` | Interactive API documentation |
| POST | `/phase0/factors` | Discover decision factors |
| POST | `/phase1/preferences` | Detail preferences |
| POST | `/phase2/scenarios` | Generate scenarios |
| POST | `/phase3/reactions` | Log emotional reactions |
| POST | `/phase4/summary` | Synthesize insights |

All POST endpoints accept and return JSON. Rate limited to 60 requests/minute per IP.

## 🎮 Demo System

Try the interactive CLI demo:

```bash
cd backend
make demo  # Launches interactive demo with session management
```

Features:
- Full workflow walkthrough
- Session save/resume
- Export results to markdown
- Multiple example scenarios

## 🔒 Security

- Environment variables stored in `.env` (never commit!)
- Secrets managed via AWS Secrets Manager
- CORS restricted to feelfwd.app domains
- SSL/TLS via AWS Certificate Manager
- Rate limiting on all endpoints

## 📚 Documentation

- [Architecture Overview](docs/architecture/overview.md)
- [API Reference](docs/api/reference.md)
- [Development Guide](docs/development/setup.md)
- [Deployment Guide](docs/deployment/overview.md)
- [Manual Prompts](docs/PROMPTS.md) - Fallback workflow prompts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 🆘 Troubleshooting

See [Common Issues](docs/deployment/troubleshooting.md) for solutions to:
- Docker build failures
- ECS deployment hangs
- DNS propagation delays
- CORS errors
- Rate limiting issues

## 🏗 Infrastructure Design Decisions

1. **ECS Service starts with 0 tasks** - Prevents deployment hangs
2. **Separate frontend/backend repos** - Independent deployment cycles
3. **CDK for IaC** - Type-safe infrastructure
4. **Fargate over EC2** - Serverless container management
5. **CloudFront for frontend** - Global CDN distribution

---

**Note**: This project requires environment variables. Copy `.env.example` to `.env` and configure your tokens before running.