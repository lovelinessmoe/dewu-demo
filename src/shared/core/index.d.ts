/**
 * TypeScript 类型定义文件，用于统一的核心业务逻辑模块
 */

export interface Config {
  supabase: {
    url: string;
    key: string;
  };
  server: {
    port: number;
    nodeEnv: string;
    corsOrigin: string;
    logLevel: string;
  };
  response: {
    delayMs: number;
    errorRate: number;
  };
  pagination: {
    defaultPageSize: number;
    maxPageSize: number;
  };
  tokens: {
    defaultExpiration: number;
    refreshExpiration: number;
  };
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  open_id: string;
  scope: string[];
  expires_at: number;
  created_at: number;
}

export interface TokenResponse {
  code: number;
  msg: string;
  data: {
    scope: string[];
    open_id: string;
    access_token: string;
    access_token_expires_in: number;
    refresh_token: string;
    refresh_token_expires_in: number;
  };
  status: number;
}

export interface BusinessResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: number;
    msg: string;
    status: number;
  };
}

export interface AuthResult {
  success: boolean;
  tokenData?: TokenData;
  error?: {
    code: number;
    msg: string;
    status: number;
  };
}

export interface InvoiceFilters {
  page_no: number;
  page_size: number;
  spu_id?: number;
  status?: number;
  order_no?: string;
  apply_start_time?: string;
  apply_end_time?: string;
  invoice_title_type?: number;
}

export interface InvoiceItem {
  invoice_title: string;
  seller_reject_reason: string;
  verify_time: string;
  category_type: number;
  order_time: string;
  invoice_image_url: string;
  bank_name: string;
  invoice_type: number;
  company_address: string;
  article_number: string;
  bidding_price: number;
  spu_id: number;
  invoice_title_type: number;
  spu_title: string;
  bank_account: string;
  status: number;
  upload_time: string;
  apply_time: string;
  company_phone: string;
  handle_flag: number;
  amount: number;
  seller_post: {
    express_no: string;
    take_end_time: string;
    sender_name: string;
    take_start_time: string;
    logistics_name: string;
    sender_full_address: string;
  };
  sku_id: number;
  reject_time: string;
  order_no: string;
  properties: string;
  tax_number: string;
  reject_reason: string;
  seller_post_appointment: boolean;
}

export declare class TokenManager {
  constructor();
  createToken(access_token: string, open_id: string, scope?: string[]): TokenData;
  validateToken(access_token: string): { valid: boolean; error?: string; tokenData?: TokenData };
  generateTokenResponse(): TokenResponse;
}

export declare class SupabaseService {
  constructor(config: Config);
  getInvoices(filters: InvoiceFilters): Promise<{ data: InvoiceItem[]; count: number } | null>;
  updateInvoice(order_no: string, updateData: Partial<InvoiceItem>): Promise<boolean>;
}

export declare class BusinessLogic {
  constructor();
  initialize(): Promise<void>;
  getTokenManager(): TokenManager;
  generateToken(requestData: any): BusinessResult<TokenResponse>;
  refreshToken(requestData: any): BusinessResult<TokenResponse>;
  authenticateToken(access_token: string): AuthResult;
  getInvoiceList(requestData: any): Promise<BusinessResult>;
  handleInvoice(requestData: any): Promise<BusinessResult>;
  addInvoices(invoices: InvoiceItem[]): Promise<BusinessResult>;
  updateInvoiceInfo(order_no: string, invoiceData: Partial<InvoiceItem>): Promise<BusinessResult>;
  getMerchantInfo(): BusinessResult;
}

export declare function createConfig(): Config;
export declare function generateRandomString(length: number, charset?: string): string;
export declare function generateTraceId(): string;