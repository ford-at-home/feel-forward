# Project Structure

This document explains the organization of the Feel Forward repository.

## Directory Layout

```
feel-forward/
├── backend/                 # Backend API service
│   ├── api.py              # FastAPI application
│   ├── models.py           # Pydantic models
│   ├── strands/            # AI agent implementations
│   ├── tests/              # Backend tests
│   ├── infra/              # AWS CDK infrastructure
│   ├── demo_*.py           # Demo scripts
│   ├── Dockerfile          # Container definition
│   ├── Makefile            # Backend-specific commands
│   ├── requirements.txt    # Python dependencies
│   └── README.md           # Backend documentation
│
├── frontend/               # Frontend React application
│   ├── src/                # Source code
│   ├── public/             # Static assets
│   ├── scripts/            # Deployment scripts
│   ├── infra/              # Frontend CDK infrastructure
│   ├── e2e/                # End-to-end tests
│   ├── docs/               # Frontend-specific docs
│   ├── package.json        # Node dependencies
│   └── README.md           # Frontend documentation
│
├── networking/             # Network and deployment configuration
│   ├── docs/               # Deployment documentation
│   ├── scripts/            # Deployment automation
│   └── README.md           # Networking overview
│
├── docs/                   # Project-wide documentation
│   ├── api/                # API reference
│   ├── architecture/       # System design documents
│   ├── deployment/         # Deployment guides
│   └── development/        # Development guides
│
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── .dockerignore           # Docker ignore rules
├── Makefile                # Root-level orchestration
├── README.md               # Project overview
└── PROJECT_STRUCTURE.md    # This file
```

## Key Directories

### `/backend`
Contains the FastAPI backend service, including:
- API endpoints and business logic
- AI agent system (Strands SDK)
- Infrastructure as Code (AWS CDK)
- Tests and demo scripts

### `/frontend`
Contains the React frontend application, including:
- UI components and pages
- State management
- Frontend infrastructure (CDK)
- Build and deployment scripts

### `/networking`
Centralizes all networking and deployment resources:
- SSL certificate management
- DNS configuration documentation
- Deployment automation scripts
- Architecture diagrams

### `/docs`
Project-wide documentation organized by topic:
- API documentation
- Architecture and design documents
- Deployment procedures
- Development guides

## File Organization Rules

1. **No code files in root** - All code belongs in backend/ or frontend/
2. **Documentation hierarchy** - General docs in /docs, specific docs in respective directories
3. **Scripts organization** - Deployment scripts in networking/scripts, build scripts in respective directories
4. **Test proximity** - Tests live close to the code they test
5. **Infrastructure as Code** - CDK code in infra/ subdirectories

## Development Files

- `.env.example` - Template for environment variables (never commit .env)
- `Makefile` - Root orchestration for common tasks across both services
- `.gitignore` - Comprehensive ignore rules for Python, Node.js, and common tools
- `.dockerignore` - Optimized Docker build context

## Temporary Files

The following are automatically ignored and should not be committed:
- Virtual environments (venv/, .venv/)
- Cache directories (__pycache__/, .pytest_cache/)
- Build outputs (dist/, build/)
- Node modules (node_modules/)
- Environment files (.env, .env.*)
- IDE configurations (.idea/, .vscode/)
- OS files (.DS_Store, Thumbs.db)

## Best Practices

1. **Keep the root clean** - Only essential project-wide files
2. **Document in the right place** - API docs near API code, deployment docs in networking
3. **Use makefiles** - For common commands and orchestration
4. **Follow conventions** - Python code in backend/, JavaScript in frontend/
5. **Isolate dependencies** - Each service manages its own dependencies