# Feel Forward - Root Makefile
# Orchestrates both frontend and backend operations

.PHONY: help install test deploy clean

help:
	@echo "Feel Forward - Full Stack Commands"
	@echo "================================="
	@echo "  make install      - Install all dependencies"
	@echo "  make test         - Run all tests"
	@echo "  make deploy       - Deploy full stack"
	@echo "  make clean        - Clean all build artifacts"
	@echo ""
	@echo "Backend Commands:"
	@echo "  make backend-dev  - Start backend development server"
	@echo "  make backend-test - Run backend tests"
	@echo "  make backend-deploy - Deploy backend only"
	@echo ""
	@echo "Frontend Commands:"
	@echo "  make frontend-dev - Start frontend development server"
	@echo "  make frontend-test - Run frontend tests"
	@echo "  make frontend-deploy - Deploy frontend only"

# Full stack commands
install:
	@echo "Installing backend dependencies..."
	@$(MAKE) -C backend install-deps
	@echo "Installing frontend dependencies..."
	@cd frontend && npm install

test:
	@echo "Running backend tests..."
	@$(MAKE) -C backend test
	@echo "Running frontend tests..."
	@cd frontend && npm run test

deploy:
	@echo "Deploying full stack..."
	@./networking/scripts/deploy-all.sh

clean:
	@echo "Cleaning backend..."
	@$(MAKE) -C backend clean
	@echo "Cleaning frontend..."
	@cd frontend && rm -rf dist node_modules
	@echo "Cleaning root..."
	@rm -rf venv __pycache__ .pytest_cache

# Backend shortcuts
backend-dev:
	@$(MAKE) -C backend run

backend-test:
	@$(MAKE) -C backend test

backend-deploy:
	@$(MAKE) -C backend deploy

# Frontend shortcuts
frontend-dev:
	@cd frontend && npm run dev

frontend-test:
	@cd frontend && npm run test

frontend-deploy:
	@cd frontend && npm run deploy:prod