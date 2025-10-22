#!/bin/bash

# Dewu Mock API Build Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BUILD_TYPE=${1:-production}

echo -e "${BLUE}🔨 Building Dewu Mock API${NC}"
echo -e "${BLUE}========================${NC}"
echo -e "Build Type: ${GREEN}$BUILD_TYPE${NC}"
echo ""

# Clean previous build
echo -e "${YELLOW}🧹 Cleaning previous build...${NC}"
npm run clean

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Run linting
echo -e "${YELLOW}🔍 Running linter...${NC}"
npm run lint

# Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
npm run test

# Build server
echo -e "${YELLOW}🏗️  Building server...${NC}"
npm run build:server

# Build client
echo -e "${YELLOW}🎨 Building client...${NC}"
npm run build:client

# Copy assets
echo -e "${YELLOW}📁 Copying assets...${NC}"
npm run copy:assets

# Verify build
echo -e "${YELLOW}✅ Verifying build...${NC}"
if [ ! -f "dist/server/app.js" ]; then
    echo -e "${RED}❌ Server build failed - app.js not found${NC}"
    exit 1
fi

if [ ! -f "dist/client/index.html" ]; then
    echo -e "${RED}❌ Client build failed - index.html not found${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 Build completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Build Summary:${NC}"
echo -e "  Server: ${GREEN}dist/server/${NC}"
echo -e "  Client: ${GREEN}dist/client/${NC}"
echo -e "  Data:   ${GREEN}dist/server/data/${NC}"
echo ""
echo -e "${BLUE}🚀 To start the production server:${NC}"
echo -e "  ${YELLOW}npm run start:production${NC}"
echo -e "  ${YELLOW}or${NC}"
echo -e "  ${YELLOW}./scripts/start.sh${NC}"