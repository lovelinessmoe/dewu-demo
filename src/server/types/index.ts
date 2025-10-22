// Core API Response Types

// Common interfaces
export interface BaseRequest {
  app_key: string;
  access_token: string;
  timestamp: number;
  sign: string;
}

export interface BaseResponse {
  code: number;
  msg: string;
  status?: number;
}

export interface ErrorResponse extends BaseResponse {
  data?: any;
  errors?: Array<{
    name: string;
    message: string;
  }>;
}

// OAuth2 Token Interfaces
export interface TokenRequest {
  client_id: string;
  client_secret: string;
  authorization_code?: string;
  grant_type?: string;
}

export interface RefreshTokenRequest {
  client_id: string;
  client_secret: string;
  refresh_token: string;
  grant_type?: string;
}

export interface TokenResponse extends BaseResponse {
  data: {
    scope: string[];
    open_id: string;
    access_token: string;
    access_token_expires_in: number;
    refresh_token: string;
    refresh_token_expires_in: number;
  };
}

// Invoice Interfaces
export interface SellerPost {
  express_no: string;
  take_end_time: string;
  sender_name: string;
  take_start_time: string;
  logistics_name: string;
  sender_full_address: string;
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
  seller_post: SellerPost;
  sku_id: number;
  reject_time: string;
  order_no: string;
  properties: string;
  tax_number: string;
  reject_reason: string;
  seller_post_appointment: boolean;
}

export interface InvoiceListRequest extends BaseRequest {
  page_no: number;
  page_size: number;
  spu_id?: number;
  status?: number;
  order_no?: string;
  apply_start_time?: string;
  apply_end_time?: string;
  invoice_title_type?: number;
}

export interface InvoiceListResponse extends BaseResponse {
  trace_id: string;
  data: {
    page_no: number;
    page_size: number;
    total_results: number;
    list: InvoiceItem[];
  };
}

export interface InvoiceHandleRequest extends BaseRequest {
  order_no: string;
  image_key?: string;
  category_type: number;
  reject_operation?: number;
  operation_type: number;
}

export interface InvoiceHandleResponse extends BaseResponse {
  trace_id: string;
  data: {};
}

// Merchant Info Interfaces
export interface MerchantInfoRequest extends BaseRequest {}

export interface MerchantInfoResponse {
  domain: string;
  code: number;
  msg: string;
  data: {
    merchant_id: string;
    type_id: string;
  };
  errors: Array<{
    name: string;
    message: string;
  }>;
}

// Request Signature Validation Interfaces
export interface SignatureValidationRequest {
  app_key: string;
  timestamp: number;
  sign: string;
  [key: string]: any;
}

export interface SignatureValidationResult {
  isValid: boolean;
  error?: string;
}

// Common Status Codes and Error Types
export enum HttpStatusCode {
  OK = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500
}

export enum ApiErrorCode {
  SUCCESS = 0,
  INVALID_PARAMETERS = 1001,
  INVALID_TOKEN = 1002,
  TOKEN_EXPIRED = 1003,
  INVALID_SIGNATURE = 1004,
  INSUFFICIENT_PERMISSIONS = 1005,
  RESOURCE_NOT_FOUND = 1006,
  INTERNAL_ERROR = 5000
}

// Error codes enum for backward compatibility
export enum ErrorCodes {
  SUCCESS = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
  INVALID_CLIENT = 1001,
  INVALID_REFRESH_TOKEN = 1002,
  INVALID_TOKEN = 1003,
  INVOICE_NOT_FOUND = 1004,
  MERCHANT_NOT_FOUND = 1005
}

// Additional types for mock data compatibility
export interface Invoice {
  invoice_id: string;
  merchant_id: string;
  amount: number;
  status: 'pending' | 'processed' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface MerchantInfo {
  merchant_id: string;
  name: string;
  status: 'active' | 'inactive';
  created_at: string;
  contact_info: {
    email: string;
    phone: string;
  };
}

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  httpStatus: HttpStatusCode;
}

// Common API Response Helpers
export const createSuccessResponse = <T>(data: T, message = 'Success'): BaseResponse & { data: T } => ({
  code: ApiErrorCode.SUCCESS,
  msg: message,
  status: HttpStatusCode.OK,
  data
});

export const createErrorResponse = (
  code: ApiErrorCode,
  message: string,
  httpStatus: HttpStatusCode = HttpStatusCode.BAD_REQUEST
): ErrorResponse => ({
  code,
  msg: message,
  status: httpStatus
});

// Legacy compatibility - keeping some existing interfaces for backward compatibility
export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string[];
  open_id: string;
}

export interface PaginationParams {
  page: number;
  page_size: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}