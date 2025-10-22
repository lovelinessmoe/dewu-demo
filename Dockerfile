# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent

# Copy source code
COPY . .

# Build the application
RUN npm run build:production

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S dewu -u 1001

# Copy built application from builder stage
COPY --from=builder --chown=dewu:nodejs /app/dist ./dist
COPY --from=builder --chown=dewu:nodejs /app/package*.json ./
COPY --from=builder --chown=dewu:nodejs /app/.env.example ./.env.example

# Install only production dependencies
RUN npm ci --only=production --silent && \
    npm cache clean --force

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV STATIC_PATH=./dist/client
ENV MOCK_DATA_PATH=./dist/server/data

# Expose port
EXPOSE 3000

# Switch to non-root user
USER dewu

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "run", "start:production"]