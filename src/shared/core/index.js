/**
 * 统一的核心业务逻辑模块
 * 这个模块可以被 TypeScript 和 JavaScript 环境同时使用
 */

const { createClient } = require('@supabase/supabase-js');

// 配置管理
const createConfig = () => ({
  supabase: {
    url: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
    key: process.env.SUPABASE_ANON_KEY || 'your-anon-key'
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    logLevel: process.env.LOG_LEVEL || 'info'
  },
  response: {
    delayMs: parseInt(process.env.RESPONSE_DELAY || '100', 10),
    errorRate: parseFloat(process.env.ERROR_RATE || '0.02')
  },
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '10', 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '20', 10)
  },
  tokens: {
    defaultExpiration: parseInt(process.env.TOKEN_EXPIRATION || '7200', 10),
    refreshExpiration: parseInt(process.env.REFRESH_TOKEN_EXPIRATION || '2592000', 10)
  }
});

// 工具函数
const generateRandomString = (length, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

const generateTraceId = () => generateRandomString(32, '0123456789');

// Token 管理
class TokenManager {
  constructor() {
    this.tokenStore = new Map();
  }

  createToken(access_token, open_id, scope = ['all']) {
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

    this.tokenStore.set(access_token, tokenData);
    return tokenData;
  }

  validateToken(access_token) {
    const storedToken = this.tokenStore.get(access_token);
    if (!storedToken) {
      return { valid: false, error: 'Invalid access token' };
    }

    if (Date.now() >= storedToken.expires_at) {
      this.tokenStore.delete(access_token);
      return { valid: false, error: 'Access token has expired' };
    }

    return { valid: true, tokenData: storedToken };
  }

  generateTokenResponse() {
    return {
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
  }
}

// Supabase 服务
class SupabaseService {
  constructor(config) {
    this.config = config;
    this.supabase = createClient(config.supabase.url, config.supabase.key);
  }

  async getInvoices(filters) {
    try {
      const { page_no, page_size, spu_id, status, order_no, apply_start_time, apply_end_time, invoice_title_type } = filters;
      
      const offset = (page_no - 1) * page_size;
      let query = this.supabase.from('invoices').select('*', { count: 'exact' });

      // Apply filters
      if (spu_id !== undefined) {
        query = query.eq('spu_id', parseInt(spu_id));
      }
      if (status !== undefined) {
        query = query.eq('status', parseInt(status));
      }
      if (order_no) {
        query = query.eq('order_no', order_no);
      }
      if (invoice_title_type !== undefined) {
        query = query.eq('invoice_title_type', parseInt(invoice_title_type));
      }
      if (apply_start_time) {
        query = query.gte('apply_time', apply_start_time);
      }
      if (apply_end_time) {
        query = query.lte('apply_time', apply_end_time);
      }

      // Add consistent sorting (ORDER BY upload_time DESC)
      query = query.order('upload_time', { ascending: false });

      // Add pagination
      query = query.range(offset, offset + page_size - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('[Supabase] Query error:', error);
        throw new Error(`Database query failed: ${error.message}`);
      }

      console.log(`[Supabase] Query successful: ${data?.length || 0} items, total: ${count}`);
      return { data: data || [], count: count || 0 };
    } catch (error) {
      console.error('[Supabase] Error getting invoices:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to retrieve invoices: ${error}`);
    }
  }

  async updateInvoice(order_no, updateData) {
    try {
      const { data, error } = await this.supabase
        .from('invoices')
        .update(updateData)
        .eq('order_no', order_no)
        .select();

      if (error) {
        console.error('[Supabase] Update error:', error);
        throw new Error(`Failed to update invoice: ${error.message}`);
      }

      if (data && data.length > 0) {
        console.log(`[Supabase] Successfully updated invoice ${order_no}`);
        return true;
      } else {
        console.log(`[Supabase] Invoice ${order_no} not found`);
        throw new Error(`Invoice with order_no ${order_no} not found`);
      }
    } catch (error) {
      console.error('[Supabase] Error updating invoice:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to update invoice: ${error}`);
    }
  }

  async addInvoices(invoices) {
    try {
      const { data, error } = await this.supabase
        .from('invoices')
        .insert(invoices)
        .select();

      if (error) {
        console.error('[Supabase] Insert error:', error);
        throw new Error(`Failed to insert invoices: ${error.message}`);
      }

      console.log(`[Supabase] Successfully inserted ${data?.length || 0} invoices`);
      return true;
    } catch (error) {
      console.error('[Supabase] Error adding invoices:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to add invoices: ${error}`);
    }
  }
}



// 业务逻辑控制器 (单例模式)
class BusinessLogic {
  constructor() {
    if (BusinessLogic.instance) {
      return BusinessLogic.instance;
    }
    
    this.config = createConfig();
    this.tokenManager = new TokenManager();
    this.supabaseService = new SupabaseService(this.config);
    this.initialized = false;
    
    BusinessLogic.instance = this;
  }

  // 获取 tokenManager 实例
  getTokenManager() {
    return this.tokenManager;
  }

  async initialize() {
    if (this.initialized) {
      return;
    }
    
    console.log('[Core] Initializing business logic (Supabase-only mode)...');
    console.log('[Config] Environment:', this.config.server.nodeEnv);
    console.log('[Config] Supabase URL:', this.config.supabase.url);
    console.log('[Config] CORS Origin:', this.config.server.corsOrigin);
    console.log('[Core] System configured for Supabase-only operations');

    this.initialized = true;
  }

  // OAuth2 业务逻辑
  generateToken(requestData) {
    const { client_id, client_secret, authorization_code } = requestData;

    // 验证必需参数
    if (!client_id || !client_secret || !authorization_code) {
      return {
        success: false,
        error: {
          code: 1001,
          msg: 'Missing required parameters',
          status: 400
        }
      };
    }

    // 生成 token 响应
    const tokenResponse = this.tokenManager.generateTokenResponse();
    
    // 存储 token
    this.tokenManager.createToken(
      tokenResponse.data.access_token,
      tokenResponse.data.open_id,
      tokenResponse.data.scope
    );

    return { success: true, data: tokenResponse };
  }

  refreshToken(requestData) {
    const { client_id, client_secret, refresh_token } = requestData;

    // 验证必需参数
    if (!client_id || !client_secret || !refresh_token) {
      return {
        success: false,
        error: {
          code: 1001,
          msg: 'Missing required parameters',
          status: 400
        }
      };
    }

    // 生成新 token 响应
    const tokenResponse = this.tokenManager.generateTokenResponse();
    
    // 存储新 token
    this.tokenManager.createToken(
      tokenResponse.data.access_token,
      tokenResponse.data.open_id,
      tokenResponse.data.scope
    );

    return { success: true, data: tokenResponse };
  }

  // 认证中间件逻辑
  authenticateToken(access_token) {
    if (!access_token) {
      return {
        success: false,
        error: {
          code: 1002,
          msg: 'Access token is required',
          status: 401
        }
      };
    }

    const validation = this.tokenManager.validateToken(access_token);
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: validation.error === 'Access token has expired' ? 1003 : 1002,
          msg: validation.error,
          status: validation.error === 'Access token has expired' ? 403 : 401
        }
      };
    }

    return { success: true, tokenData: validation.tokenData };
  }

  // Invoice 业务逻辑
  async getInvoiceList(requestData) {
    const {
      page_no = 1,
      page_size = 10,
      spu_id,
      status,
      order_no,
      apply_start_time,
      apply_end_time,
      invoice_title_type
    } = requestData;

    const pageNo = parseInt(page_no);
    const pageSizeNum = Math.min(parseInt(page_size), this.config.pagination.maxPageSize);

    console.log(`[Invoice-List] Request params:`, {
      page_no: pageNo, page_size: pageSizeNum, spu_id, status, order_no,
      apply_start_time, apply_end_time, invoice_title_type
    });

    try {
      // Get data from Supabase exclusively
      const supabaseResult = await this.supabaseService.getInvoices({
        page_no: pageNo,
        page_size: pageSizeNum,
        spu_id,
        status,
        order_no,
        apply_start_time,
        apply_end_time,
        invoice_title_type
      });

      console.log(`[Invoice-List] Retrieved ${supabaseResult.data.length} items from Supabase`);
      return {
        success: true,
        data: {
          trace_id: generateTraceId(),
          code: 0,
          msg: 'success',
          data: {
            page_no: pageNo,
            page_size: pageSizeNum,
            total_results: supabaseResult.count,
            list: supabaseResult.data
          }
        }
      };
    } catch (error) {
      console.error('[Invoice-List] Supabase error:', error);
      const traceId = generateTraceId();
      
      // Map database errors to specific error codes
      let errorCode = 5004; // SERVICE_UNAVAILABLE
      let httpStatus = 503;
      let errorMessage = 'Service temporarily unavailable';
      
      if (error instanceof Error) {
        const errorName = error.name || '';
        const errorMsg = error.message.toLowerCase();
        
        if (errorName === 'DATABASE_CONNECTION_FAILED' || errorMsg.includes('connection')) {
          errorCode = 5001; // DATABASE_CONNECTION_FAILED
          errorMessage = 'Database connection failed';
        } else if (errorName === 'DATABASE_TIMEOUT' || errorMsg.includes('timeout')) {
          errorCode = 5003; // DATABASE_TIMEOUT
          errorMessage = 'Database operation timed out';
        } else if (errorName === 'DATABASE_QUERY_FAILED' || errorMsg.includes('query')) {
          errorCode = 5002; // DATABASE_QUERY_FAILED
          httpStatus = 500;
          errorMessage = 'Database query failed';
        }
      }
      
      return {
        success: false,
        error: {
          code: errorCode,
          msg: errorMessage,
          status: httpStatus,
          trace_id: traceId
        }
      };
    }
  }

  async handleInvoice(requestData) {
    const { order_no, operation_type, category_type, image_key, reject_operation } = requestData;

    console.log(`[Invoice-Handle] Request:`, { order_no, operation_type, category_type, image_key, reject_operation });

    // 验证必需参数
    if (!order_no || !operation_type || !category_type) {
      return {
        success: false,
        error: {
          code: 1001,
          msg: 'Missing required parameters: order_no, operation_type, category_type',
          status: 400,
          trace_id: generateTraceId()
        }
      };
    }

    // 验证操作类型特定要求
    if (operation_type === 1 && !image_key) {
      return {
        success: false,
        error: {
          code: 1001,
          msg: 'image_key is required when operation_type=1 (approve)',
          status: 400,
          trace_id: generateTraceId()
        }
      };
    }

    if (operation_type === 2 && !reject_operation) {
      return {
        success: false,
        error: {
          code: 1001,
          msg: 'reject_operation is required when operation_type=2 (reject)',
          status: 400,
          trace_id: generateTraceId()
        }
      };
    }

    const currentTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let updateData = {};

    if (operation_type === 1) {
      // 批准：设置状态为 2 (审核通过)
      updateData = {
        status: 2,
        verify_time: currentTime,
        seller_reject_reason: '',
        reject_reason: '',
        reject_time: ''
      };
      console.log(`[Invoice-Handle] Preparing to approve invoice ${order_no}`);
    } else if (operation_type === 2) {
      // 拒绝：设置状态为 5 (卖家已驳回)
      const rejectReasons = {
        103: '请提供真实姓名，否则无法开具个人抬头发票',
        104: '税号与开票公司名称不匹配，请核实',
        105: '因疫情暂无法开具或邮寄，请过段时间再申请'
      };
      const rejectReason = rejectReasons[reject_operation] || '其他原因';

      updateData = {
        status: 5,
        reject_time: currentTime,
        seller_reject_reason: rejectReason,
        reject_reason: rejectReason
      };
      console.log(`[Invoice-Handle] Preparing to reject invoice ${order_no}, reason: ${rejectReason}`);
    }

    try {
      // Update in Supabase exclusively
      const supabaseSuccess = await this.supabaseService.updateInvoice(order_no, updateData);

      if (!supabaseSuccess) {
        return {
          success: false,
          error: {
            code: 1006, // RESOURCE_NOT_FOUND
            msg: 'Invoice not found',
            status: 404,
            trace_id: generateTraceId()
          }
        };
      }

      console.log(`[Invoice-Handle] Successfully updated invoice ${order_no} in Supabase`);
      return {
        success: true,
        data: {
          trace_id: generateTraceId(),
          code: 200,
          msg: 'success',
          data: {}
        }
      };
    } catch (error) {
      console.error('[Invoice-Handle] Supabase error:', error);
      const traceId = generateTraceId();
      
      // Map database errors to specific error codes
      let errorCode = 5004; // SERVICE_UNAVAILABLE
      let httpStatus = 503;
      let errorMessage = 'Service temporarily unavailable';
      
      if (error instanceof Error) {
        const errorName = error.name || '';
        const errorMsg = error.message.toLowerCase();
        
        if (errorName === 'RESOURCE_NOT_FOUND' || errorMsg.includes('not found')) {
          errorCode = 1006; // RESOURCE_NOT_FOUND
          httpStatus = 404;
          errorMessage = 'Invoice not found';
        } else if (errorName === 'DATABASE_CONNECTION_FAILED' || errorMsg.includes('connection')) {
          errorCode = 5001; // DATABASE_CONNECTION_FAILED
          errorMessage = 'Database connection failed';
        } else if (errorName === 'DATABASE_TIMEOUT' || errorMsg.includes('timeout')) {
          errorCode = 5003; // DATABASE_TIMEOUT
          errorMessage = 'Database operation timed out';
        } else if (errorName === 'DATABASE_QUERY_FAILED' || errorMsg.includes('query')) {
          errorCode = 5002; // DATABASE_QUERY_FAILED
          httpStatus = 500;
          errorMessage = 'Database query failed';
        }
      }
      
      return {
        success: false,
        error: {
          code: errorCode,
          msg: errorMessage,
          status: httpStatus,
          trace_id: traceId
        }
      };
    }
  }

  // 添加发票到数据存储
  async addInvoices(invoices) {
    console.log(`[Invoice-Add] Adding ${invoices.length} invoices`);

    try {
      // Add to Supabase exclusively
      const supabaseSuccess = await this.supabaseService.addInvoices(invoices);
      
      if (!supabaseSuccess) {
        return {
          success: false,
          error: {
            code: 5004, // SERVICE_UNAVAILABLE
            msg: 'Service temporarily unavailable',
            status: 503,
            trace_id: generateTraceId()
          }
        };
      }

      console.log(`[Invoice-Add] Successfully added ${invoices.length} invoices to Supabase`);
      return {
        success: true,
        data: {
          trace_id: generateTraceId(),
          code: 200,
          msg: 'success',
          data: {
            added_count: invoices.length
          }
        }
      };
    } catch (error) {
      console.error('[Invoice-Add] Error:', error);
      const traceId = generateTraceId();
      
      // Map database errors to specific error codes
      let errorCode = 5004; // SERVICE_UNAVAILABLE
      let httpStatus = 503;
      let errorMessage = 'Service temporarily unavailable';
      
      if (error instanceof Error) {
        const errorName = error.name || '';
        const errorMsg = error.message.toLowerCase();
        
        if (errorName === 'DATABASE_CONNECTION_FAILED' || errorMsg.includes('connection')) {
          errorCode = 5001; // DATABASE_CONNECTION_FAILED
          errorMessage = 'Database connection failed';
        } else if (errorName === 'DATABASE_TIMEOUT' || errorMsg.includes('timeout')) {
          errorCode = 5003; // DATABASE_TIMEOUT
          errorMessage = 'Database operation timed out';
        } else if (errorName === 'DATABASE_QUERY_FAILED' || errorMsg.includes('query')) {
          errorCode = 5002; // DATABASE_QUERY_FAILED
          httpStatus = 500;
          errorMessage = 'Database query failed';
        }
      }
      
      return {
        success: false,
        error: {
          code: errorCode,
          msg: errorMessage,
          status: httpStatus,
          trace_id: traceId
        }
      };
    }
  }

  // 更新发票信息
  async updateInvoiceInfo(order_no, invoiceData) {
    console.log(`[Invoice-Update] Updating invoice ${order_no}`);

    try {
      // Update in Supabase exclusively
      const supabaseSuccess = await this.supabaseService.updateInvoice(order_no, invoiceData);
      
      if (!supabaseSuccess) {
        return {
          success: false,
          error: {
            code: 1006, // RESOURCE_NOT_FOUND
            msg: 'Invoice not found',
            status: 404,
            trace_id: generateTraceId()
          }
        };
      }

      console.log(`[Invoice-Update] Successfully updated invoice ${order_no} in Supabase`);
      return {
        success: true,
        data: {
          trace_id: generateTraceId(),
          code: 200,
          msg: 'success',
          data: {}
        }
      };
    } catch (error) {
      console.error('[Invoice-Update] Error:', error);
      const traceId = generateTraceId();
      
      // Map database errors to specific error codes
      let errorCode = 5004; // SERVICE_UNAVAILABLE
      let httpStatus = 503;
      let errorMessage = 'Service temporarily unavailable';
      
      if (error instanceof Error) {
        const errorName = error.name || '';
        const errorMsg = error.message.toLowerCase();
        
        if (errorName === 'RESOURCE_NOT_FOUND' || errorMsg.includes('not found')) {
          errorCode = 1006; // RESOURCE_NOT_FOUND
          httpStatus = 404;
          errorMessage = 'Invoice not found';
        } else if (errorName === 'DATABASE_CONNECTION_FAILED' || errorMsg.includes('connection')) {
          errorCode = 5001; // DATABASE_CONNECTION_FAILED
          errorMessage = 'Database connection failed';
        } else if (errorName === 'DATABASE_TIMEOUT' || errorMsg.includes('timeout')) {
          errorCode = 5003; // DATABASE_TIMEOUT
          errorMessage = 'Database operation timed out';
        } else if (errorName === 'DATABASE_QUERY_FAILED' || errorMsg.includes('query')) {
          errorCode = 5002; // DATABASE_QUERY_FAILED
          httpStatus = 500;
          errorMessage = 'Database query failed';
        }
      }
      
      return {
        success: false,
        error: {
          code: errorCode,
          msg: errorMessage,
          status: httpStatus,
          trace_id: traceId
        }
      };
    }
  }

  // Merchant 业务逻辑
  getMerchantInfo() {
    return {
      success: true,
      data: {
        domain: '',
        code: 200,
        msg: 'success',
        data: {
          merchant_id: generateRandomString(16),
          type_id: generateRandomString(12)
        },
        errors: []
      }
    };
  }
}

module.exports = {
  BusinessLogic,
  TokenManager,
  SupabaseService,
  createConfig,
  generateRandomString,
  generateTraceId
};