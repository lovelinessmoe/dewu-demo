/// <reference path="./types/express.d.ts" />

// Load environment variables from .env.local file
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { configManager } from './config/index';
import oauth2Routes from './routes/oauth2Routes';
import invoiceRoutes from './routes/invoiceRoutes';
import merchantRoutes from './routes/merchantRoutes';

// Error interface for consistent error handling
interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

class ExpressServer {
  private app: Application;
  private config = configManager.getServerConfig();

  constructor() {
    this.app = express();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Disable CSP for development
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: this.config.corsOrigin === '*' ? true : this.config.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Request logging
    if (this.config.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request timestamp and ID for tracing
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.timestamp = Date.now();
      req.requestId = this.generateRequestId();
      res.setHeader('X-Request-ID', req.requestId);
      next();
    });

    // Serve static files in production
    if (this.config.nodeEnv === 'production' && this.config.staticPath) {
      this.app.use(express.static(this.config.staticPath));
    }
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      const healthInfo = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: this.config.nodeEnv,
        version: process.env.npm_package_version || '1.0.0',
        requestId: req.requestId
      };
      res.status(200).json(healthInfo);
    });

    // API status endpoint
    this.app.get('/api/status', (req: Request, res: Response) => {
      const statusInfo = {
        api: 'Dewu Mock API',
        version: '1.0.0',
        status: 'operational',
        endpoints: {
          oauth2: '/api/v1/h5/passport/v1/oauth2/*',
          invoices: '/dop/api/v1/invoice/*',
          merchant: '/dop/api/v1/common/merchant/*'
        },
        environment: configManager.getEnvironmentInfo(),
        requestId: req.requestId
      };
      res.status(200).json(statusInfo);
    });

    // OAuth2 routes
    this.app.use('/', oauth2Routes);

    // Invoice routes
    this.app.use('/', invoiceRoutes);

    // Merchant routes
    this.app.use('/', merchantRoutes);

    // Serve React app (both development and production)
    if (this.config.staticPath) {
      // Serve static files
      this.app.use(express.static(this.config.staticPath));
      
      // SPA fallback - serve index.html for all non-API routes
      this.app.get('*', (req: Request, res: Response) => {
        // Skip API routes
        if (req.originalUrl.startsWith('/api/') || 
            req.originalUrl.startsWith('/dop/') || 
            req.originalUrl.startsWith('/health') ||
            req.originalUrl.startsWith('/status')) {
          const error = {
            code: 404,
            msg: `API route ${req.originalUrl} not found`,
            status: 404,
            requestId: req.requestId,
            timestamp: new Date().toISOString()
          };
          return res.status(404).json(error);
        }
        
        // Serve React app for all other routes
        res.sendFile(path.resolve(this.config.staticPath!, 'index.html'));
      });
    } else {
      // 404 handler when no static path is configured
      this.app.use('*', (req: Request, res: Response) => {
        const error = {
          code: 404,
          msg: `Route ${req.originalUrl} not found`,
          status: 404,
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        };
        res.status(404).json(error);
      });
    }
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use((error: AppError, req: Request, res: Response, _next: NextFunction) => {
      // Log error details
      console.error('Error occurred:', {
        message: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });

      // Determine error status code
      const statusCode = error.statusCode || 500;
      const isOperational = error.isOperational || false;

      // Prepare error response
      const errorResponse = {
        code: statusCode,
        msg: isOperational ? error.message : 'Internal server error',
        status: statusCode,
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      };

      // Include stack trace in development
      if (this.config.nodeEnv === 'development') {
        (errorResponse as any).stack = error.stack;
        (errorResponse as any).details = error.message;
      }

      res.status(statusCode).json(errorResponse);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      console.error('Uncaught Exception:', error);
      this.gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown('UNHANDLED_REJECTION');
    });

    // Handle SIGTERM and SIGINT for graceful shutdown
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private gracefulShutdown(signal: string): void {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    
    // Close server and perform cleanup
    process.exit(0);
  }

  public getApp(): Application {
    return this.app;
  }

  public start(): void {
    // Validate configuration before starting
    if (!configManager.validateConfiguration()) {
      console.error('Configuration validation failed. Exiting...');
      process.exit(1);
    }

    const port = this.config.port;
    
    this.app.listen(port, () => {
      console.log(`🚀 Dewu Mock API Server started successfully`);
      console.log(`📍 Server running on port ${port}`);
      console.log(`🌍 Environment: ${this.config.nodeEnv}`);
      console.log(`🔧 CORS Origin: ${this.config.corsOrigin}`);
      console.log(`📁 Mock Data Path: ${this.config.mockDataPath}`);
      
      if (this.config.staticPath) {
        console.log(`📂 Static Files: ${this.config.staticPath}`);
      }
      
      console.log(`🏥 Health Check: http://localhost:${port}/health`);
      console.log(`📊 API Status: http://localhost:${port}/api/status`);
      console.log(`⏰ Started at: ${new Date().toISOString()}`);
    });
  }
}

// Create and export server instance
const server = new ExpressServer();

// Start server if this file is run directly
if (require.main === module) {
  server.start();
}

export default server;
export { ExpressServer };