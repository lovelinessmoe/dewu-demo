#!/bin/bash

# Dewu Mock API Startup Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
NODE_ENV=${NODE_ENV:-development}
PORT=${PORT:-3000}
CONFIG_PROFILE=${CONFIG_PROFILE:-development}

echo -e "${BLUE}🚀 Starting Dewu Mock API Server${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "Environment: ${GREEN}$NODE_ENV${NC}"
echo -e "Port: ${GREEN}$PORT${NC}"
echo -e "Profile: ${GREEN}$CONFIG_PROFILE${NC}"
echo ""

# Check if dist directory exists for production
if [ "$NODE_ENV" = "production" ]; then
    if [ ! -d "dist" ]; then
        echo -e "${RED}❌ Production build not found. Please run 'npm run build' first.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Production build found${NC}"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies not found. Installing...${NC}"
    npm install
fi

# Validate environment file
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ Environment file found${NC}"
else
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}⚠️  No .env file found. You may want to copy .env.example to .env${NC}"
    fi
fi

# Start the server
echo -e "${BLUE}🎯 Starting server...${NC}"
echo ""

if [ "$NODE_ENV" = "production" ]; then
    exec npm run start:production
else
    exec npm run start:dev
fi