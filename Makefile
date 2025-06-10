# Load environment variables from .env file if it exists
ifneq (,$(wildcard .env))
    include .env
    export
endif

.PHONY: init setup venv install-deps verify run clean help check-prerequisites copy-agent infra build push deploy check-aws-prerequisites

# Default target
.DEFAULT_GOAL := help

# Variables
STRANDS_DIR := strands
VENV_DIR := $(STRANDS_DIR)/venv
PYTHON := python3
PIP := pip3
AWS_REGION ?= us-west-2
CURRENT_DIR := $(shell pwd)
INFRA_DIR := infra
DOCKER_IMAGE := feel-forward

# Help target
help:
	@echo "Available targets:"
	@echo "  init        - Create strands directory and initialize setup"
	@echo "  setup       - Complete setup (venv, install dependencies)"
	@echo "  venv        - Create virtual environment"
	@echo "  install-deps - Install all required packages"
	@echo "  verify      - Verify the installation"
	@echo "  run         - Run the agent"
	@echo "  clean       - Remove strands directory and all contents"
	@echo "  check-prerequisites - Check AWS models and GitHub token"
	@echo "  copy-agent  - Copy agent.py to strands directory"
	@echo "  infra       - Deploy backend infrastructure to AWS"
	@echo "  build       - Build Docker image"
	@echo "  push        - Push Docker image to ECR"
	@echo "  deploy      - Deploy infrastructure and push image"
	@echo ""
	@echo "Usage:"
	@echo "  make init        # Create directory and initialize"
	@echo "  make setup       # Complete setup (venv, install dependencies)"
	@echo "  make run         # Run the agent (requires setup first)"
	@echo "  make clean       # Remove everything"
	@echo "  make infra       # Deploy backend infrastructure"
	@echo "  make deploy      # Full deployment (infra + image)"

# Check AWS prerequisites
check-aws-prerequisites:
	@echo "Checking AWS prerequisites..."
	@if ! command -v aws >/dev/null 2>&1; then \
		echo "Error: AWS CLI is not installed. Please install it first."; \
		exit 1; \
	fi
	@if ! command -v docker >/dev/null 2>&1; then \
		echo "Error: Docker is not installed. Please install it first."; \
		exit 1; \
	fi
	@if ! aws sts get-caller-identity >/dev/null 2>&1; then \
		echo "Error: AWS credentials not configured. Please run 'aws configure'."; \
		exit 1; \
	fi
	@echo "AWS prerequisites verified successfully"

# Deploy infrastructure
infra: check-aws-prerequisites
	@echo "Deploying backend infrastructure..."
	cd $(INFRA_DIR) && \
	python -m venv .venv && \
	source .venv/bin/activate && \
	pip install -r requirements.txt && \
	cdk deploy \
		-c domain=feelfwd.app \
		-c apiDomain=api.feelfwd.app \
		--require-approval never
	@echo "Infrastructure deployed successfully!"

# Build Docker image
build:
	@echo "Building Docker image..."
	docker build -t $(DOCKER_IMAGE) .
	@echo "Docker image built successfully!"

# Push Docker image to ECR
push: build
	@echo "Pushing Docker image to ECR..."
	@REPO_URI=$$(aws cloudformation describe-stacks --stack-name BackendStack --query 'Stacks[0].Outputs[?OutputKey==`repositoryUri`].OutputValue' --output text 2>/dev/null || echo "") && \
	if [ -z "$$REPO_URI" ]; then \
		echo "Error: ECR repository not found. Run 'make infra' first."; \
		exit 1; \
	fi && \
	docker tag $(DOCKER_IMAGE):latest $$REPO_URI:latest && \
	aws ecr get-login-password --region $(AWS_REGION) | docker login --username AWS --password-stdin $$REPO_URI && \
	docker push $$REPO_URI:latest
	@echo "Docker image pushed successfully!"

# Full deployment (infrastructure + image)
deploy: infra push
	@echo "Deployment complete! API available at https://api.feelfwd.app"

# Initialize strands directory
init:
	@echo "Creating strands directory..."
	mkdir -p $(STRANDS_DIR)
	@echo "Directory created. Proceed with 'make setup'"

# Check prerequisites (AWS models and GitHub token)
check-prerequisites:
	@echo "Checking prerequisites..."
	@if [ -z "$${GITHUB_TOKEN+x}" ]; then \
		echo "Error: GITHUB_TOKEN environment variable is not set"; \
		echo "Please ensure GITHUB_TOKEN is exported in your shell or in .env file"; \
		echo "Example: export GITHUB_TOKEN=<your-token>"; \
		echo "Or add GITHUB_TOKEN=<your-token> to .env file"; \
		exit 1; \
	fi
	@echo "Checking AWS Bedrock models..."
	@if ! command -v aws >/dev/null 2>&1; then \
		echo "Error: AWS CLI is not installed. Please install it first."; \
		exit 1; \
	fi
	@echo "All prerequisites verified successfully"

# Complete setup target
setup: check-prerequisites init venv install-deps verify copy-agent

# Create virtual environment
venv:
	@echo "Creating virtual environment..."
	@if [ -d "$(VENV_DIR)" ]; then \
		echo "Virtual environment already exists. Skipping creation."; \
	else \
		cd $(STRANDS_DIR) && \
		$(PYTHON) -m venv venv && \
		echo "Virtual environment created in $(VENV_DIR)"; \
	fi

# Install all required packages
install-deps:
	@echo "Installing required packages..."
	@if [ ! -d "$(VENV_DIR)" ]; then \
		echo "Error: Virtual environment not found. Run 'make venv' first."; \
		exit 1; \
	fi
	cd $(STRANDS_DIR) && \
	. venv/bin/activate && \
	$(PIP) install --upgrade pip && \
	$(PIP) install strands-agents strands-agents-tools requests

# Verify installation
verify:
	@echo "Verifying installation..."
	@if [ ! -d "$(VENV_DIR)" ]; then \
		echo "Error: Virtual environment not found. Run 'make venv' first."; \
		exit 1; \
	fi
	cd $(STRANDS_DIR) && \
	. venv/bin/activate && \
	$(PYTHON) -c "from strands import Agent; print('Strands SDK ready')" && \
	$(PYTHON) -c "import requests; print('Requests package ready')"

# Run the agent
run:
	@echo "Running agent..."
	@if [ ! -d "$(VENV_DIR)" ]; then \
		echo "Error: Virtual environment not found. Run 'make venv' first."; \
		exit 1; \
	fi
	cd $(STRANDS_DIR) && \
	. venv/bin/activate && \
	export AWS_REGION=$(AWS_REGION) && \
	$(PYTHON) -u agent.py

# Clean everything
clean:
	@echo "Cleaning up..."
	rm -rf $(STRANDS_DIR)
	@echo "Cleanup complete"

# Copy agent.py from root to strands directory
copy-agent:
	@echo "Copying agent.py to strands directory..."
	@if [ ! -f "agent.py" ]; then \
		echo "Error: agent.py not found in project root."; \
		exit 1; \
	fi
	cp agent.py $(STRANDS_DIR)/agent.py
	@echo "Copied agent.py to $(STRANDS_DIR)/agent.py" 