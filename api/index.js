const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import controllers
const { OAuth2Controller } = require('../dist/server/controllers/oauth2Controller.js');
const { InvoiceController } = require('../dist/server/controllers/invoiceController.js');
const { MerchantController } = require('../dist/server/controllers/merchantController.js');
const { authenticateToken, authenticateAndValidateSignature } = require('../dist/server/middleware/auth.js');

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add request ID middleware
app.use((req, res, next) => {
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  req.timestamp = Date.now();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: 'production',
    version: '1.0.0',
    requestId: req.requestId
  });
});

// API status
app.get('/api/status', (req, res) => {
  res.json({
    api: 'Dewu Mock API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      oauth2: '/api/v1/h5/passport/v1/oauth2/*',
      invoices: '/dop/api/v1/invoice/*',
      merchant: '/dop/api/v1/common/merchant/*'
    },
    environment: 'production',
    requestId: req.requestId
  });
});

// OAuth2 routes
app.post('/api/v1/h5/passport/v1/oauth2/token', OAuth2Controller.generateToken);
app.post('/api/v1/h5/passport/v1/oauth2/refresh_token', OAuth2Controller.refreshToken);

// Invoice routes
app.post('/dop/api/v1/invoice/list', authenticateAndValidateSignature, InvoiceController.getInvoiceList);
app.post('/dop/api/v1/invoice/handle', authenticateAndValidateSignature, InvoiceController.handleInvoice);

// Merchant routes
app.post('/dop/api/v1/common/merchant/base/info', authenticateToken, MerchantController.getMerchantBaseInfo);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    msg: `Route ${req.originalUrl} not found`,
    status: 404,
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error occurred:', error);
  res.status(500).json({
    code: 500,
    msg: 'Internal server error',
    status: 500,
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });
});

module.exports = app;