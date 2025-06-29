# Development Setup Guide

This guide walks through setting up a local development environment for Feel Forward.

## Prerequisites

### Required Software
- **Git**: Version control
- **Python**: 3.11 or higher
- **Node.js**: 20.x or higher
- **Docker**: For containerization
- **AWS CLI**: For deployment

### Recommended Tools
- **VS Code**: With Python and TypeScript extensions
- **Postman**: For API testing
- **Docker Desktop**: GUI for Docker management

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/feel-forward.git
cd feel-forward
```

### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your values
# Required:
# - GITHUB_TOKEN: Personal access token for Strands SDK
# Optional:
# - OPENAI_API_KEY: For enhanced AI features
# - AWS_PROFILE: If not using default
```

### 3. Install Development Tools

```bash
# Install pre-commit hooks
pip install pre-commit
pre-commit install

# Install AWS CDK globally
npm install -g aws-cdk

# Install Python tools
pip install black isort pylint
```

## Backend Development

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
pip install -r requirements-dev.txt  # Development dependencies
```

### 3. Run the Backend

```bash
# Start the API server
uvicorn api:app --reload --host 0.0.0.0 --port 8000

# API will be available at:
# - http://localhost:8000
# - Docs: http://localhost:8000/docs
# - OpenAPI: http://localhost:8000/openapi.json
```

### 4. Run Backend Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_api.py

# Run with verbose output
pytest -v
```

### 5. Backend Code Quality

```bash
# Format code
black .
isort .

# Lint code
pylint api.py models.py strands/

# Type check
mypy api.py models.py
```

## Frontend Development

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
# Create local environment file
echo "VITE_API_URL=http://localhost:8000" > .env.local
```

### 3. Run the Frontend

```bash
# Start development server
npm run dev

# Frontend will be available at:
# http://localhost:5173
```

### 4. Run Frontend Tests

```bash
# Unit tests
npm run test

# Test with UI
npm run test:ui

# Test coverage
npm run test:coverage

# E2E tests (requires backend running)
npm run test:e2e
```

### 5. Frontend Code Quality

```bash
# Lint code
npm run lint

# Type check
npm run typecheck

# Format code
npm run format
```

## Full Stack Development

### 1. Start Both Services

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
uvicorn api:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 2. Use Docker Compose (Alternative)

```bash
# Create docker-compose.yml (if not exists)
docker-compose up

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Test Full Workflow

```bash
# Run demo script
cd backend
python demo_quick.py

# Or interactive demo
python demo_interactive.py
```

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes
# Run tests
# Commit changes
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/your-feature
```

### 2. Code Style Guidelines

**Python (Backend):**
- Follow PEP 8
- Use type hints
- Write docstrings
- Keep functions small
- Use async/await for I/O

**TypeScript (Frontend):**
- Use functional components
- Implement proper error boundaries
- Use TypeScript strict mode
- Follow React hooks rules
- Keep components focused

### 3. Testing Guidelines

**Write tests for:**
- New features
- Bug fixes
- Edge cases
- Error scenarios

**Test structure:**
```
tests/
├── unit/        # Isolated component tests
├── integration/ # Component interaction tests
└── e2e/         # Full workflow tests
```

## Debugging

### Backend Debugging

```python
# Add breakpoints in code
import pdb; pdb.set_trace()

# Or use VS Code debugger with launch.json:
{
  "name": "FastAPI",
  "type": "python",
  "request": "launch",
  "module": "uvicorn",
  "args": ["api:app", "--reload"]
}
```

### Frontend Debugging

```javascript
// Use browser DevTools
console.log('Debug info:', data);
debugger; // Breakpoint

// Or React DevTools for component inspection
```

### API Debugging

```bash
# Use curl for quick tests
curl -X POST http://localhost:8000/phase0/factors \
  -H "Content-Type: application/json" \
  -d '{"decision_context": "test"}'

# Or use Postman/Insomnia for complex requests
```

## Common Issues

### Port Already in Use

```bash
# Find process using port
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill process
kill -9 <PID>
```

### Module Import Errors

```bash
# Ensure virtual environment is activated
which python  # Should show venv path

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### CORS Errors in Development

```python
# Ensure backend allows localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Development Tools

### Recommended VS Code Extensions
- Python
- Pylance
- ESLint
- Prettier
- TypeScript Vue Plugin
- Thunder Client (API testing)
- Docker
- AWS Toolkit

### Useful Commands

```bash
# Watch for file changes
npm run dev -- --host  # Expose to network

# Clean installations
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Python cleanup
find . -type d -name __pycache__ -exec rm -rf {} +
find . -type f -name "*.pyc" -delete
```

## Performance Profiling

### Backend Profiling

```python
# Use cProfile
python -m cProfile -s cumulative api.py

# Or add profiling middleware
from pyinstrument import Profiler
```

### Frontend Profiling

```javascript
// Use React DevTools Profiler
// Or Chrome DevTools Performance tab
```

## Security in Development

### Never Commit:
- `.env` files
- API keys
- Passwords
- Private keys

### Use Secrets:
```bash
# Store in environment
export OPENAI_API_KEY="sk-..."

# Or use AWS Secrets Manager locally
aws secretsmanager get-secret-value --secret-id dev/feel-forward
```

## Next Steps

After setting up your development environment:

1. Read the [Architecture Overview](../architecture/overview.md)
2. Review the [API Reference](../api/reference.md)
3. Check the [Contributing Guidelines](../../CONTRIBUTING.md)
4. Join the development Discord/Slack
5. Pick an issue to work on

Happy coding! 🚀