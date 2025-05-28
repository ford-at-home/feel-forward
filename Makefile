# Load environment variables from .env file if it exists
ifneq (,$(wildcard .env))
    include .env
    export
endif

.PHONY: init setup venv install-deps verify run clean help check-prerequisites copy-agent

# Default target
.DEFAULT_GOAL := help

# Variables
STRANDS_DIR := strands
VENV_DIR := $(STRANDS_DIR)/venv
PYTHON := python3
PIP := pip3
AWS_REGION ?= us-west-2
CURRENT_DIR := $(shell pwd)

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
	@echo ""
	@echo "Usage:"
	@echo "  make init        # Create directory and initialize"
	@echo "  make setup       # Complete setup (venv, install dependencies)"
	@echo "  make run         # Run the agent (requires setup first)"
	@echo "  make clean       # Remove everything"

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