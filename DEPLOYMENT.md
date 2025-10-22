# Dewu Mock API Deployment Guide

This guide covers various deployment options for the Dewu Mock API application.

## Quick Start

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Production
```bash
# Build the application
npm run build

# Start production server
npm run start:production
```

## Deployment Options

### 1. Docker Deployment (Recommended)

#### Single Container
```bash
# Build and run with Docker
npm run docker:build
npm run docker:run

# Or use the deployment script
./scripts/deploy.sh docker
```

#### Docker Compose
```bash
# Production deployment
docker-compose up -d

# Development deployment
docker-compose --profile dev up -d

# Testing
docker-compose --profile test up
```

### 2. Local Deployment

#### Using Scripts
```bash
# Build and deploy locally
./scripts/deploy.sh local

# Or manually
./scripts/build.sh
./scripts/start.sh
```

#### Manual Steps
```bash
# 1. Install dependencies
npm install

# 2. Build the application
npm run build:production

# 3. Start the server
NODE_ENV=production npm run start:production
```

### 3. PM2 Deployment

```bash
# Install PM2 globally
npm install -g pm2

# Deploy with PM2
./scripts/deploy.sh pm2

# Monitor the process
pm2 monit

# View logs
pm2 logs dewu-mock-api
```

### 4. Cloud Deployment

#### Heroku
```bash
# Create Heroku app
heroku create dewu-mock-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set CONFIG_PROFILE=production

# Deploy
git push heroku main
```

#### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### DigitalOcean App Platform
1. Connect your GitHub repository
2. Set build command: `npm run build:production`
3. Set run command: `npm run start:production`
4. Set environment variables as needed

## Environment Configuration

### Required Environment Variables

```bash
NODE_ENV=production
PORT=3000
CONFIG_PROFILE=production
```

### Optional Environment Variables

```bash
# Server Configuration
CORS_ORIGIN=*
LOG_LEVEL=info
STATIC_PATH=./dist/client

# Mock Data Configuration
MOCK_DATA_PATH=./dist/server/data
TOKEN_EXPIRATION=7200
RESPONSE_DELAY=200
ERROR_RATE=0.01

# Client Credentials
PROD_CLIENT_ID=your_client_id
PROD_CLIENT_SECRET=your_client_secret
```

### Configuration Profiles

Available profiles:
- `development` - Fast responses, detailed logging
- `testing` - No delays, predictable behavior
- `production` - Realistic timing, minimal errors
- `demo` - Varied scenarios for demonstrations
- `stress` - High error rates for stress testing

## Build Process

### Build Steps
1. **Clean**: Remove previous build artifacts
2. **Lint**: Check code quality
3. **Test**: Run unit tests
4. **Compile**: Build TypeScript to JavaScript
5. **Bundle**: Create client bundle with Vite
6. **Copy**: Copy assets and configuration files

### Build Outputs
```
dist/
├── client/          # React frontend build
│   ├── index.html
│   ├── assets/
│   └── ...
└── server/          # Express backend build
    ├── app.js
    ├── config/
    ├── controllers/
    ├── data/        # Mock data files
    └── ...
```

## Health Checks

### Endpoints
- **Health**: `GET /api/health`
- **Configuration**: `GET /api/config`

### Docker Health Check
```bash
# Check container health
docker ps

# View health check logs
docker inspect --format='{{json .State.Health}}' dewu-mock-api
```

### Manual Health Check
```bash
# Basic health check
curl http://localhost:3000/api/health

# Configuration check
curl http://localhost:3000/api/config
```

## Monitoring

### Logs
```bash
# Docker logs
docker logs dewu-mock-api

# PM2 logs
pm2 logs dewu-mock-api

# Local logs (stdout)
tail -f logs/app.log
```

### Metrics
- Response times
- Error rates
- Memory usage
- CPU usage

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

#### Build Failures
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
npm run clean
```

#### Configuration Issues
```bash
# Validate configuration
curl http://localhost:3000/api/config

# Check environment variables
printenv | grep -E "(NODE_ENV|PORT|CONFIG_PROFILE)"
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run start:production

# Or set log level
LOG_LEVEL=debug npm run start:production
```

## Security Considerations

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure appropriate `CORS_ORIGIN`
- [ ] Use strong client credentials
- [ ] Enable HTTPS in reverse proxy
- [ ] Set up proper logging
- [ ] Configure rate limiting
- [ ] Regular security updates

### Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Performance Optimization

### Production Settings
- Enable gzip compression
- Set appropriate cache headers
- Use CDN for static assets
- Configure connection pooling
- Set up load balancing for multiple instances

### Resource Limits
```yaml
# Docker Compose resource limits
services:
  dewu-mock-api:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## Backup and Recovery

### Data Backup
```bash
# Backup mock data
cp -r src/server/data backup/data-$(date +%Y%m%d)

# Backup configuration
cp .env backup/env-$(date +%Y%m%d)
```

### Recovery
```bash
# Restore from backup
cp -r backup/data-20241022 src/server/data
cp backup/env-20241022 .env
```

## Support

For deployment issues:
1. Check the logs for error messages
2. Verify environment configuration
3. Test health endpoints
4. Review this deployment guide
5. Check the project README for additional information