#!/bin/bash

# Dewu Mock API Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DEPLOYMENT_TYPE=${1:-docker}
VERSION=${2:-latest}

echo -e "${BLUE}🚀 Deploying Dewu Mock API${NC}"
echo -e "${BLUE}===========================${NC}"
echo -e "Deployment Type: ${GREEN}$DEPLOYMENT_TYPE${NC}"
echo -e "Version: ${GREEN}$VERSION${NC}"
echo ""

case $DEPLOYMENT_TYPE in
    "docker")
        echo -e "${YELLOW}🐳 Building Docker image...${NC}"
        docker build -t dewu-mock-api:$VERSION .
        
        echo -e "${YELLOW}🏃 Running Docker container...${NC}"
        docker run -d \
            --name dewu-mock-api-$VERSION \
            -p 3000:3000 \
            -e NODE_ENV=production \
            -e CONFIG_PROFILE=production \
            --restart unless-stopped \
            dewu-mock-api:$VERSION
        
        echo -e "${GREEN}✅ Docker deployment completed!${NC}"
        echo -e "Container: ${YELLOW}dewu-mock-api-$VERSION${NC}"
        echo -e "URL: ${YELLOW}http://localhost:3000${NC}"
        ;;
        
    "compose")
        echo -e "${YELLOW}🐳 Starting with Docker Compose...${NC}"
        docker-compose up -d dewu-mock-api
        
        echo -e "${GREEN}✅ Docker Compose deployment completed!${NC}"
        echo -e "Service: ${YELLOW}dewu-mock-api${NC}"
        echo -e "URL: ${YELLOW}http://localhost:3000${NC}"
        ;;
        
    "local")
        echo -e "${YELLOW}🏗️  Building application...${NC}"
        ./scripts/build.sh
        
        echo -e "${YELLOW}🚀 Starting local deployment...${NC}"
        NODE_ENV=production CONFIG_PROFILE=production ./scripts/start.sh &
        
        echo -e "${GREEN}✅ Local deployment started!${NC}"
        echo -e "PID: ${YELLOW}$!${NC}"
        echo -e "URL: ${YELLOW}http://localhost:3000${NC}"
        ;;
        
    "pm2")
        if ! command -v pm2 &> /dev/null; then
            echo -e "${RED}❌ PM2 not found. Please install PM2 first:${NC}"
            echo -e "  ${YELLOW}npm install -g pm2${NC}"
            exit 1
        fi
        
        echo -e "${YELLOW}🏗️  Building application...${NC}"
        ./scripts/build.sh
        
        echo -e "${YELLOW}🚀 Starting with PM2...${NC}"
        pm2 start dist/server/app.js \
            --name "dewu-mock-api" \
            --env production \
            --instances 1 \
            --max-memory-restart 500M
        
        echo -e "${GREEN}✅ PM2 deployment completed!${NC}"
        echo -e "Process: ${YELLOW}dewu-mock-api${NC}"
        echo -e "URL: ${YELLOW}http://localhost:3000${NC}"
        echo -e "Monitor: ${YELLOW}pm2 monit${NC}"
        ;;
        
    *)
        echo -e "${RED}❌ Unknown deployment type: $DEPLOYMENT_TYPE${NC}"
        echo -e "${YELLOW}Available types: docker, compose, local, pm2${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}📋 Post-deployment checks:${NC}"
echo -e "  Health check: ${YELLOW}curl http://localhost:3000/api/health${NC}"
echo -e "  Configuration: ${YELLOW}curl http://localhost:3000/api/config${NC}"
echo -e "  Logs: ${YELLOW}docker logs dewu-mock-api-$VERSION${NC} (for Docker)"