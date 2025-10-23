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
    this.isAvailable = true;
  }

  async testConnection() {
    try {
      const { data, error } = await this.supabase
        .from('invoices')
        .select('*')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        console.log('[Supabase] Invoices table does not exist, will use fallback data');
        this.isAvailable = false;
        return false;
      }
      
      this.isAvailable = true;
      return true;
    } catch (error) {
      console.error('[Supabase] Connection test failed:', error);
      this.isAvailable = false;
      return false;
    }
  }

  async getInvoices(filters) {
    if (!this.isAvailable) {
      return null;
    }

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

      query = query.range(offset, offset + page_size - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('[Supabase] Query error:', error);
        this.isAvailable = false;
        return null;
      }

      return { data: data || [], count: count || 0 };
    } catch (error) {
      console.error('[Supabase] Error getting invoices:', error);
      this.isAvailable = false;
      return null;
    }
  }

  async updateInvoice(order_no, updateData) {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const { data, error } = await this.supabase
        .from('invoices')
        .update(updateData)
        .eq('order_no', order_no)
        .select();

      if (error) {
        console.error('[Supabase] Update error:', error);
        this.isAvailable = false;
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('[Supabase] Error updating invoice:', error);
      this.isAvailable = false;
      return false;
    }
  }

  async initializeData(mockData) {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const { data: existingInvoices, error } = await this.supabase
        .from('invoices')
        .select('*')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.log('[Supabase] Invoices table does not exist, will use fallback data');
        this.isAvailable = false;
        return false;
      }

      if (existingInvoices && existingInvoices.length > 0) {
        console.log('[Supabase] Invoices table already has data');
        return true;
      }

      console.log('[Supabase] Inserting initial invoice data...');
      const { error: insertError } = await this.supabase
        .from('invoices')
        .insert(mockData);

      if (insertError) {
        console.error('[Supabase] Error inserting initial data:', insertError);
        this.isAvailable = false;
        return false;
      }

      console.log('[Supabase] Initial data inserted successfully');
      return true;
    } catch (error) {
      console.error('[Supabase] Error initializing data:', error);
      this.isAvailable = false;
      return false;
    }
  }
}

// Mock 数据
const mockInvoiceData = [
  {
    "invoice_title": "得物科技有限公司",
    "seller_reject_reason": "",
    "verify_time": "2024-10-15 14:30:25",
    "category_type": 1,
    "order_time": "2024-10-10 09:15:30",
    "invoice_image_url": "https://example.com/invoice/img_001.jpg",
    "bank_name": "中国银行",
    "invoice_type": 1,
    "company_address": "上海市普陀区交通局888号",
    "article_number": "iPhone 14-黑色",
    "bidding_price": 25900,
    "spu_id": 12345,
    "invoice_title_type": 2,
    "spu_title": "【现货发售】Apple iPhone 14 黑色 全网通双卡双待5G手机",
    "bank_account": "开户银行账号123456789",
    "status": 0,
    "upload_time": "2024-10-12 16:20:15",
    "apply_time": "2024-10-11 10:45:20",
    "company_phone": "021-88888888",
    "handle_flag": 1,
    "amount": 25900,
    "seller_post": {
      "express_no": "SF1301946631496",
      "take_end_time": "2024-10-16 11:00:00",
      "sender_name": "张三",
      "take_start_time": "2024-10-16 10:00:00",
      "logistics_name": "顺丰速运",
      "sender_full_address": "上海市普陀区交通局888号"
    },
    "sku_id": 67890,
    "reject_time": "",
    "order_no": "11001232435",
    "properties": "官方标配 128GB",
    "tax_number": "91310000123456789X",
    "reject_reason": "",
    "seller_post_appointment": false
  },
  {
    "invoice_title": "上海潮流科技",
    "seller_reject_reason": "查询不到公司税号",
    "verify_time": "2024-10-14 11:25:30",
    "category_type": 2,
    "order_time": "2024-10-08 14:20:15",
    "invoice_image_url": "https://example.com/invoice/img_002.jpg",
    "bank_name": "工商银行",
    "invoice_type": 2,
    "company_address": "北京市朝阳区建国门外大街1号",
    "article_number": "iPhone 13-白色",
    "bidding_price": 18900,
    "spu_id": 23456,
    "invoice_title_type": 1,
    "spu_title": "【现货发售】Apple iPhone 13 白色 全网通双卡双待5G手机",
    "bank_account": "开户银行账号987654321",
    "status": 5,
    "upload_time": "2024-10-09 13:15:45",
    "apply_time": "2024-10-08 15:30:10",
    "company_phone": "010-66666666",
    "handle_flag": 0,
    "amount": 18900,
    "seller_post": {
      "express_no": "YT2301946631497",
      "take_end_time": "2024-10-15 15:00:00",
      "sender_name": "李四",
      "take_start_time": "2024-10-15 14:00:00",
      "logistics_name": "圆通快递",
      "sender_full_address": "北京市朝阳区建国门外大街1号"
    },
    "sku_id": 78901,
    "reject_time": "2024-10-14 11:25:30",
    "order_no": "11001232436",
    "properties": "官方标配 256GB",
    "tax_number": "91110000234567890Y",
    "reject_reason": "查询不到公司税号",
    "seller_post_appointment": true
  },
  {
    "invoice_title": "深圳创新企业",
    "seller_reject_reason": "",
    "verify_time": "2024-10-13 16:45:20",
    "category_type": 1,
    "order_time": "2024-10-05 11:30:25",
    "invoice_image_url": "https://example.com/invoice/img_003.jpg",
    "bank_name": "建设银行",
    "invoice_type": 1,
    "company_address": "深圳市南山区科技园南区",
    "article_number": "MacBook Pro-银色",
    "bidding_price": 45000,
    "spu_id": 34567,
    "invoice_title_type": 2,
    "spu_title": "【现货发售】Apple MacBook Pro 银色 M2芯片笔记本电脑",
    "bank_account": "开户银行账号456789123",
    "status": 2,
    "upload_time": "2024-10-06 09:20:30",
    "apply_time": "2024-10-05 12:15:40",
    "company_phone": "0755-77777777",
    "handle_flag": 1,
    "amount": 45000,
    "seller_post": {
      "express_no": "ZT3301946631498",
      "take_end_time": "2024-10-14 12:00:00",
      "sender_name": "王五",
      "take_start_time": "2024-10-14 11:00:00",
      "logistics_name": "中通快递",
      "sender_full_address": "深圳市南山区科技园南区"
    },
    "sku_id": 89012,
    "reject_time": "",
    "order_no": "11001232437",
    "properties": "高配版 512GB",
    "tax_number": "91440300345678901Z",
    "reject_reason": "",
    "seller_post_appointment": false
  },
  {
    "invoice_title": "杭州电商公司",
    "seller_reject_reason": "",
    "verify_time": "",
    "category_type": 1,
    "order_time": "2024-10-12 08:45:15",
    "invoice_image_url": "https://example.com/invoice/img_004.jpg",
    "bank_name": "农业银行",
    "invoice_type": 1,
    "company_address": "杭州市西湖区文三路259号",
    "article_number": "iPad Air-玫瑰金",
    "bidding_price": 12800,
    "spu_id": 45678,
    "invoice_title_type": 1,
    "spu_title": "【现货发售】Apple iPad Air 玫瑰金 平板电脑",
    "bank_account": "开户银行账号789123456",
    "status": 0,
    "upload_time": "2024-10-13 10:30:20",
    "apply_time": "2024-10-12 09:20:35",
    "company_phone": "0571-55555555",
    "handle_flag": 1,
    "amount": 12800,
    "seller_post": {
      "express_no": "ST4301946631499",
      "take_end_time": "2024-10-17 13:00:00",
      "sender_name": "赵六",
      "take_start_time": "2024-10-17 12:00:00",
      "logistics_name": "申通快递",
      "sender_full_address": "杭州市西湖区文三路259号"
    },
    "sku_id": 90123,
    "reject_time": "",
    "order_no": "11001232438",
    "properties": "标准版 64GB",
    "tax_number": "91330100456789012A",
    "reject_reason": "",
    "seller_post_appointment": true
  },
  {
    "invoice_title": "广州数字科技",
    "seller_reject_reason": "发票信息不完整",
    "verify_time": "2024-10-11 14:20:10",
    "category_type": 2,
    "order_time": "2024-10-03 16:15:25",
    "invoice_image_url": "https://example.com/invoice/img_005.jpg",
    "bank_name": "招商银行",
    "invoice_type": 2,
    "company_address": "广州市天河区珠江新城",
    "article_number": "AirPods Pro-白色",
    "bidding_price": 3200,
    "spu_id": 56789,
    "invoice_title_type": 2,
    "spu_title": "【现货发售】Apple AirPods Pro 白色 无线蓝牙耳机",
    "bank_account": "开户银行账号321654987",
    "status": 3,
    "upload_time": "2024-10-04 11:45:30",
    "apply_time": "2024-10-03 17:30:15",
    "company_phone": "020-44444444",
    "handle_flag": 0,
    "amount": 3200,
    "seller_post": {
      "express_no": "YD5301946631500",
      "take_end_time": "2024-10-12 14:00:00",
      "sender_name": "钱七",
      "take_start_time": "2024-10-12 13:00:00",
      "logistics_name": "韵达快递",
      "sender_full_address": "广州市天河区珠江新城"
    },
    "sku_id": 12340,
    "reject_time": "2024-10-11 14:20:10",
    "order_no": "11001232439",
    "properties": "官方标配",
    "tax_number": "91440100567890123B",
    "reject_reason": "发票信息不完整",
    "seller_post_appointment": false
  }
];

// 业务逻辑控制器 (单例模式)
class BusinessLogic {
  constructor() {
    if (BusinessLogic.instance) {
      return BusinessLogic.instance;
    }
    
    this.config = createConfig();
    this.tokenManager = new TokenManager();
    this.supabaseService = new SupabaseService(this.config);
    this.mockData = [...mockInvoiceData];
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
    
    console.log('[Core] Initializing business logic...');
    console.log('[Config] Environment:', this.config.server.nodeEnv);
    console.log('[Config] Supabase URL:', this.config.supabase.url);
    console.log('[Config] CORS Origin:', this.config.server.corsOrigin);

    // Test Supabase connection and initialize data
    const supabaseAvailable = await this.supabaseService.testConnection();
    if (supabaseAvailable) {
      await this.supabaseService.initializeData(this.mockData);
    }
    
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

    // 尝试从 Supabase 获取数据
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

    if (supabaseResult) {
      console.log(`[Invoice-List] Using Supabase data: ${supabaseResult.data.length} items`);
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
    }

    // 回退到 mock 数据
    console.log('[Invoice-List] Supabase not available, using fallback data');
    let filteredInvoices = [...this.mockData];

    // 手动应用过滤器
    if (spu_id !== undefined) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.spu_id === parseInt(spu_id));
    }
    if (status !== undefined) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.status === parseInt(status));
    }
    if (order_no) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.order_no === order_no);
    }
    if (invoice_title_type !== undefined) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.invoice_title_type === parseInt(invoice_title_type));
    }
    if (apply_start_time) {
      const startTime = new Date(apply_start_time);
      filteredInvoices = filteredInvoices.filter(invoice => {
        const applyTime = new Date(invoice.apply_time);
        return applyTime >= startTime;
      });
    }
    if (apply_end_time) {
      const endTime = new Date(apply_end_time);
      filteredInvoices = filteredInvoices.filter(invoice => {
        const applyTime = new Date(invoice.apply_time);
        return applyTime <= endTime;
      });
    }

    // 计算分页
    const totalResults = filteredInvoices.length;
    const startIndex = (pageNo - 1) * pageSizeNum;
    const endIndex = startIndex + pageSizeNum;
    const pageData = filteredInvoices.slice(startIndex, endIndex);

    console.log(`[Invoice-List] Fallback data: ${pageData.length} items, total: ${totalResults}`);

    return {
      success: true,
      data: {
        trace_id: generateTraceId(),
        code: 0,
        msg: 'success',
        data: {
          page_no: pageNo,
          page_size: pageSizeNum,
          total_results: totalResults,
          list: pageData
        }
      }
    };
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
          status: 400
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
          status: 400
        }
      };
    }

    if (operation_type === 2 && !reject_operation) {
      return {
        success: false,
        error: {
          code: 1001,
          msg: 'reject_operation is required when operation_type=2 (reject)',
          status: 400
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

    // 尝试在 Supabase 中更新
    const supabaseSuccess = await this.supabaseService.updateInvoice(order_no, updateData);

    if (supabaseSuccess) {
      console.log(`[Invoice-Handle] Successfully updated invoice ${order_no} in Supabase`);
    } else {
      console.log(`[Invoice-Handle] Supabase not available, using fallback update`);
      
      // 回退到 mock 数据更新
      const invoice = this.mockData.find(inv => inv.order_no === order_no);
      if (invoice) {
        Object.assign(invoice, updateData);
        console.log(`[Invoice-Handle] Updated invoice ${order_no} in fallback data`);
      }
    }

    return {
      success: true,
      data: {
        trace_id: generateTraceId(),
        code: 200,
        msg: 'success',
        data: {}
      }
    };
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
  generateTraceId,
  mockInvoiceData
};