const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// 使用统一的核心业务逻辑
const { BusinessLogic } = require('../src/shared/core/index.js');

// 初始化业务逻辑
const businessLogic = new BusinessLogic();

const app = express();

// 初始化业务逻辑
businessLogic.initialize().catch(console.error);

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
            <p>Get invoice list with filtering support (requires access_token)</p>
            <p><strong>Available filters:</strong></p>
            <ul>
                <li><code>spu_id</code>: Filter by product SPU ID (12345, 23456, 34567, 45678, 56789)</li>
                <li><code>status</code>: Filter by status (0=待处理, 2=审核通过, 3=已驳回, 5=卖家已驳回)</li>
                <li><code>order_no</code>: Filter by order number</li>
                <li><code>invoice_title_type</code>: Filter by title type (1=个人, 2=企业)</li>
                <li><code>apply_start_time</code>: Filter by start time (YYYY-MM-DD HH:mm:ss)</li>
                <li><code>apply_end_time</code>: Filter by end time (YYYY-MM-DD HH:mm:ss)</li>
            </ul>
            <pre>{
  "access_token": "your_access_token",
  "page_no": 1,
  "page_size": 10,
  "status": 0,
  "spu_id": 12345,
  "invoice_title_type": 2
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
        
        <h2>Data Storage</h2>
        <p>This API uses <strong>Supabase</strong> for persistent data storage with automatic fallback to mock data.</p>
        <ul>
            <li>✅ Real-time filtering and pagination</li>
            <li>✅ Persistent invoice status updates</li>
            <li>✅ Automatic fallback when Supabase is unavailable</li>
        </ul>
        
        <h2>Environment Variables</h2>
        <p>Configure these in your Vercel deployment:</p>
        <ul>
            <li><code>SUPABASE_URL</code>: Your Supabase project URL</li>
            <li><code>SUPABASE_ANON_KEY</code>: Your Supabase anonymous key</li>
        </ul>
        
        <p><strong>Status:</strong> <span style="color: green;">✅ Online</span></p>
        <p><strong>Version:</strong> 1.0.0</p>
        <p><strong>Environment:</strong> Production</p>
        <p><strong>Database:</strong> <span id="db-status">Checking...</span></p>
        
        <script>
        // Check database status
        fetch('/health')
          .then(res => res.json())
          .then(data => {
            document.getElementById('db-status').innerHTML = '<span style="color: green;">✅ Connected</span>';
          })
          .catch(err => {
            document.getElementById('db-status').innerHTML = '<span style="color: orange;">⚠️ Fallback Mode</span>';
          });
        </script>
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

// OAuth2 token refresh
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



// Invoice list with Supabase filtering support
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

// Invoice handle - can modify invoice status in Supabase
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

// Merchant info
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

// 如果直接运行此文件，启动服务器
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`🚀 Dewu Mock API Server (Standalone) started successfully`);
    console.log(`📍 Server running on port ${port}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🏥 Health Check: http://localhost:${port}/health`);
    console.log(`📊 API Status: http://localhost:${port}/api/status`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
  });
}

module.exports = app;