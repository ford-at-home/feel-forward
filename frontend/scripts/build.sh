#!/bin/bash

# FeelFwd Build Script
# Usage: ./scripts/build.sh [staging|prod]

set -e

STAGE=${1:-staging}
CLEAN=${CLEAN:-false}

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_status "Building FeelFwd application for $STAGE..."

# Clean previous build if requested
if [[ "$CLEAN" == "true" ]]; then
    print_status "Cleaning previous build..."
    rm -rf dist/
fi

# Install dependencies if needed
if [[ ! -d "node_modules" ]]; then
    print_status "Installing dependencies..."
    npm ci
fi

# Set environment variables based on stage
export NODE_ENV=$STAGE
export VITE_STAGE=$STAGE

if [[ "$STAGE" == "prod" ]]; then
    export VITE_API_URL="https://api.feelfwd.app"
else
    export VITE_API_URL="https://api.feelfwd.app" # Same API for both stages
fi

# Run the build
print_status "Running Vite build..."
if [[ "$STAGE" == "prod" ]]; then
    npm run build
else
    npm run build:dev
fi

# Verify build output
if [[ ! -d "dist" ]]; then
    echo "❌ Build failed - dist directory not created"
    exit 1
fi

if [[ ! -f "dist/index.html" ]]; then
    echo "❌ Build failed - index.html not found in dist"
    exit 1
fi

# Display build info
BUILD_SIZE=$(du -sh dist | cut -f1)
FILE_COUNT=$(find dist -type f | wc -l)

print_success "Build completed successfully!"
echo ""
echo "Build Summary:"
echo "=============="
echo "Stage: $STAGE"
echo "Build size: $BUILD_SIZE"
echo "Files: $FILE_COUNT"
echo "Output directory: dist/"
echo ""
print_status "Ready for deployment!"