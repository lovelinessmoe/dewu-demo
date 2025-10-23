const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// 使用统一的核心业务逻辑
const { BusinessLogic } = require('../src/shared/core/index.js');

// 初始化业务逻辑
const businessLogic = new BusinessLogic();

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

// Initialize business logic (Supabase-only mode)
businessLogic.initialize().catch(console.error);

// Add request ID middleware
app.use((req, res, next) => {
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  req.timestamp = Date.now();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const { access_token } = req.body;
  
  const authResult = businessLogic.authenticateToken(access_token);
  
  if (!authResult.success) {
    return res.status(authResult.error.status).json(authResult.error);
  }

  req.tokenData = authResult.tokenData;
  next();
};

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
app.post('/api/v1/h5/passport/v1/oauth2/token', (req, res) => {
  try {
    const result = businessLogic.generateToken(req.body);
    
    if (!result.success) {
      return res.status(result.error.status).json(result.error);
    }

    res.json(result.data);
  } catch (error) {
    console.error('[OAuth2-Token] Error:', error);
    res.status(500).json({
      code: 5000,
      msg: 'Internal server error',
      status: 500
    });
  }
});

app.post('/api/v1/h5/passport/v1/oauth2/refresh_token', (req, res) => {
  try {
    const result = businessLogic.refreshToken(req.body);
    
    if (!result.success) {
      return res.status(result.error.status).json(result.error);
    }

    res.json(result.data);
  } catch (error) {
    console.error('[OAuth2-Refresh] Error:', error);
    res.status(500).json({
      code: 5000,
      msg: 'Internal server error',
      status: 500
    });
  }
});

// Invoice routes
app.post('/dop/api/v1/invoice/list', authenticateToken, async (req, res) => {
  try {
    const result = await businessLogic.getInvoiceList(req.body);
    
    if (!result.success) {
      return res.status(result.error.status).json(result.error);
    }

    res.json(result.data);
  } catch (error) {
    console.error('[Invoice-List] Error:', error);
    res.status(500).json({
      code: 5000,
      msg: 'Internal server error',
      status: 500
    });
  }
});

app.post('/dop/api/v1/invoice/handle', authenticateToken, async (req, res) => {
  try {
    const result = await businessLogic.handleInvoice(req.body);
    
    if (!result.success) {
      return res.status(result.error.status).json(result.error);
    }

    res.json(result.data);
  } catch (error) {
    console.error('[Invoice-Handle] Error:', error);
    res.status(500).json({
      code: 5000,
      msg: 'Internal server error',
      status: 500
    });
  }
});

// Add invoices
app.post('/dop/api/v1/invoice/add', authenticateToken, async (req, res) => {
  try {
    const { invoices } = req.body;

    if (!invoices || !Array.isArray(invoices) || invoices.length === 0) {
      return res.status(400).json({
        code: 1001,
        msg: 'invoices array is required and must not be empty',
        status: 400
      });
    }

    const result = await businessLogic.addInvoices(invoices);
    
    if (!result.success) {
      return res.status(result.error.status).json(result.error);
    }

    res.json(result.data);
  } catch (error) {
    console.error('[Invoice-Add] Error:', error);
    res.status(500).json({
      code: 5000,
      msg: 'Internal server error',
      status: 500
    });
  }
});

// Update invoice
app.post('/dop/api/v1/invoice/update', authenticateToken, async (req, res) => {
  try {
    const { order_no, invoice_data } = req.body;

    if (!order_no || !invoice_data) {
      return res.status(400).json({
        code: 1001,
        msg: 'order_no and invoice_data are required',
        status: 400
      });
    }

    const result = await businessLogic.updateInvoiceInfo(order_no, invoice_data);
    
    if (!result.success) {
      return res.status(result.error.status).json(result.error);
    }

    res.json(result.data);
  } catch (error) {
    console.error('[Invoice-Update] Error:', error);
    res.status(500).json({
      code: 5000,
      msg: 'Internal server error',
      status: 500
    });
  }
});

// Merchant routes
app.post('/dop/api/v1/common/merchant/base/info', authenticateToken, (req, res) => {
  try {
    const result = businessLogic.getMerchantInfo();
    
    if (!result.success) {
      return res.status(result.error.status).json(result.error);
    }

    res.json(result.data);
  } catch (error) {
    console.error('[Merchant-Info] Error:', error);
    res.status(500).json({
      code: 5000,
      msg: 'Internal server error',
      status: 500
    });
  }
});

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