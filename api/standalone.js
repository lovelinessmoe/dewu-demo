const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const crypto = require('crypto');

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

// Mock token store
const tokenStore = new Map();

// Helper functions
const generateRandomString = (length, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

const createMockToken = (access_token, open_id, scope = ['all']) => {
  const now = Date.now();
  const expiresIn = 3600 * 1000; // 1 hour
  
  const tokenData = {
    access_token,
    refresh_token: `refresh_${access_token}`,
    open_id,
    scope,
    expires_at: now + expiresIn,
    created_at: now
  };
  
  tokenStore.set(access_token, tokenData);
  return tokenData;
};

// Serve a simple HTML page for root route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dewu Mock API</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
            .method { color: #007acc; font-weight: bold; }
            pre { background: #f0f0f0; padding: 10px; border-radius: 3px; overflow-x: auto; }
        </style>
    </head>
    <body>
        <h1>🚀 Dewu Mock API</h1>
        <p>Mock API server for Dewu (得物) platform interfaces</p>
        
        <h2>Available Endpoints</h2>
        
        <div class="endpoint">
            <h3><span class="method">GET</span> /health</h3>
            <p>Health check endpoint</p>
        </div>
        
        <div class="endpoint">
            <h3><span class="method">POST</span> /api/v1/h5/passport/v1/oauth2/token</h3>
            <p>Generate OAuth2 access token</p>
            <pre>{
  "client_id": "test_client_id",
  "client_secret": "test_client_secret", 
  "authorization_code": "test_auth_code_123"
}</pre>
        </div>
        
        <div class="endpoint">
            <h3><span class="method">POST</span> /api/v1/h5/passport/v1/oauth2/refresh_token</h3>
            <p>Refresh OAuth2 access token</p>
            <pre>{
  "client_id": "test_client_id",
  "client_secret": "test_client_secret",
  "refresh_token": "your_refresh_token"
}</pre>
        </div>
        
        <div class="endpoint">
            <h3><span class="method">POST</span> /dop/api/v1/invoice/list</h3>
            <p>Get invoice list (requires access_token)</p>
            <pre>{
  "access_token": "your_access_token",
  "page_no": 1,
  "page_size": 10
}</pre>
        </div>
        
        <div class="endpoint">
            <h3><span class="method">POST</span> /dop/api/v1/invoice/handle</h3>
            <p>Handle invoice (requires access_token)</p>
            <pre>{
  "access_token": "your_access_token",
  "order_no": "110011234354",
  "operation_type": 1,
  "category_type": 1
}</pre>
        </div>
        
        <div class="endpoint">
            <h3><span class="method">POST</span> /dop/api/v1/common/merchant/base/info</h3>
            <p>Get merchant info (requires access_token)</p>
            <pre>{
  "access_token": "your_access_token"
}</pre>
        </div>
        
        <h2>Usage Flow</h2>
        <ol>
            <li>Get access token using <code>/api/v1/h5/passport/v1/oauth2/token</code></li>
            <li>Use the access token in subsequent API calls</li>
            <li>Refresh token when needed using <code>/api/v1/h5/passport/v1/oauth2/refresh_token</code></li>
        </ol>
        
        <p><strong>Status:</strong> <span style="color: green;">✅ Online</span></p>
        <p><strong>Version:</strong> 1.0.0</p>
        <p><strong>Environment:</strong> Production</p>
    </body>
    </html>
  `);
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

// OAuth2 token generation
app.post('/api/v1/h5/passport/v1/oauth2/token', (req, res) => {
  try {
    const { client_id, client_secret, authorization_code } = req.body;
    
    if (!client_id || !client_secret || !authorization_code) {
      return res.status(400).json({
        code: 1001,
        msg: 'Missing required parameters',
        status: 400
      });
    }

    const tokenResponse = {
      code: 200,
      msg: 'success',
      data: {
        scope: ['all'],
        open_id: generateRandomString(16),
        access_token: generateRandomString(58),
        access_token_expires_in: 31536000,
        refresh_token: generateRandomString(58),
        refresh_token_expires_in: 31536000
      },
      status: 200
    };

    // Store token
    createMockToken(
      tokenResponse.data.access_token,
      tokenResponse.data.open_id,
      tokenResponse.data.scope
    );

    res.json(tokenResponse);
  } catch (error) {
    res.status(500).json({
      code: 5000,
      msg: 'Internal server error',
      status: 500
    });
  }
});

// OAuth2 token refresh
app.post('/api/v1/h5/passport/v1/oauth2/refresh_token', (req, res) => {
  try {
    const { client_id, client_secret, refresh_token } = req.body;
    
    if (!client_id || !client_secret || !refresh_token) {
      return res.status(400).json({
        code: 1001,
        msg: 'Missing required parameters',
        status: 400
      });
    }

    const tokenResponse = {
      code: 200,
      msg: 'success',
      data: {
        scope: ['all'],
        open_id: generateRandomString(16),
        access_token: generateRandomString(58),
        access_token_expires_in: 31536000,
        refresh_token: generateRandomString(58),
        refresh_token_expires_in: 31536000
      },
      status: 200
    };

    // Store new token
    createMockToken(
      tokenResponse.data.access_token,
      tokenResponse.data.open_id,
      tokenResponse.data.scope
    );

    res.json(tokenResponse);
  } catch (error) {
    res.status(500).json({
      code: 5000,
      msg: 'Internal server error',
      status: 500
    });
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const { access_token } = req.body;
  
  if (!access_token) {
    return res.status(401).json({
      code: 1002,
      msg: 'Access token is required',
      status: 401
    });
  }
  
  const storedToken = tokenStore.get(access_token);
  if (!storedToken) {
    return res.status(401).json({
      code: 1002,
      msg: 'Invalid access token',
      status: 401
    });
  }
  
  if (Date.now() >= storedToken.expires_at) {
    tokenStore.delete(access_token);
    return res.status(403).json({
      code: 1003,
      msg: 'Access token has expired',
      status: 403
    });
  }
  
  req.tokenData = storedToken;
  next();
};

// Invoice list
app.post('/dop/api/v1/invoice/list', authenticateToken, (req, res) => {
  try {
    const { page_no = 1, page_size = 10 } = req.body;
    
    // Generate mock invoice data
    const mockInvoices = Array.from({ length: Math.min(page_size, 5) }, (_, i) => ({
      invoice_title: `测试公司${i + 1}`,
      seller_reject_reason: '',
      verify_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      category_type: 1,
      order_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      invoice_image_url: `https://example.com/invoice/img_${String(i + 1).padStart(3, '0')}.jpg`,
      bank_name: '中国银行',
      invoice_type: 1,
      company_address: '上海市普陀区交通局888号',
      article_number: `iPhone 14-黑色`,
      bidding_price: 25900,
      spu_id: 12345 + i,
      invoice_title_type: 2,
      spu_title: '【现货发售】Apple iPhone 14 黑色 全网通双卡双待5G手机',
      bank_account: '开户银行账号123456789',
      status: 0,
      upload_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      apply_time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      company_phone: '021-88888888',
      handle_flag: 1,
      amount: 25900,
      seller_post: {
        express_no: 'SF1301946631496',
        take_end_time: '2024-10-16 11:00:00',
        sender_name: '张三',
        take_start_time: '2024-10-16 10:00:00',
        logistics_name: '顺丰速运',
        sender_full_address: '上海市普陀区交通局888号'
      },
      sku_id: 67890 + i,
      reject_time: '',
      order_no: `1100123243${5 + i}`,
      properties: '官方标配 128GB',
      tax_number: '91310000123456789X',
      reject_reason: '',
      seller_post_appointment: false
    }));

    res.json({
      trace_id: generateRandomString(32, '0123456789'),
      code: 0,
      msg: 'success',
      data: {
        page_no: parseInt(page_no),
        page_size: parseInt(page_size),
        total_results: 5,
        list: mockInvoices
      }
    });
  } catch (error) {
    res.status(500).json({
      code: 5000,
      msg: 'Internal server error',
      status: 500
    });
  }
});

// Invoice handle
app.post('/dop/api/v1/invoice/handle', authenticateToken, (req, res) => {
  try {
    const { order_no, operation_type, category_type } = req.body;
    
    if (!order_no || !operation_type || !category_type) {
      return res.status(400).json({
        code: 1001,
        msg: 'Missing required parameters',
        status: 400
      });
    }

    res.json({
      trace_id: generateRandomString(32, '0123456789'),
      code: 200,
      msg: 'success',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      code: 5000,
      msg: 'Internal server error',
      status: 500
    });
  }
});

// Merchant info
app.post('/dop/api/v1/common/merchant/base/info', authenticateToken, (req, res) => {
  try {
    res.json({
      domain: '',
      code: 200,
      msg: 'success',
      data: {
        merchant_id: generateRandomString(16),
        type_id: generateRandomString(12)
      },
      errors: []
    });
  } catch (error) {
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