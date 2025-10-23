import { Request, Response, NextFunction } from 'express';
import { ErrorResponse, ApiErrorCode, HttpStatusCode, SignatureValidationRequest, SignatureValidationResult, generateTraceId, createErrorResponse } from '../types/index';
import crypto from 'crypto';
import { BusinessLogic } from '../../shared/core/index.js';

// 创建业务逻辑实例
const businessLogic = new BusinessLogic();

// Extended Request interface to include token data
export interface AuthenticatedRequest extends Request {
  requestId?: string;
  tokenData?: {
    access_token: string;
    open_id: string;
    scope: string[];
    expires_at: number;
  };
}

// Mock token storage - in a real implementation this would be a database or cache
interface StoredToken {
  access_token: string;
  refresh_token: string;
  open_id: string;
  scope: string[];
  expires_at: number;
  created_at: number;
}

// Helper function to generate mock token data (保持向后兼容)
export const createMockToken = (access_token: string, open_id: string, scope: string[] = ['read', 'write']): StoredToken => {
  const tokenManager = businessLogic.getTokenManager();
  const tokenData = tokenManager.createToken(access_token, open_id, scope);
  
  return {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    open_id: tokenData.open_id,
    scope: tokenData.scope,
    expires_at: tokenData.expires_at,
    created_at: tokenData.created_at
  };
};

// Helper function to validate token format
const isValidTokenFormat = (token: string): boolean => {
  // Basic token format validation - should be a non-empty string
  return typeof token === 'string' && token.length > 0 && token.trim() === token;
};

// Helper function to create error response (deprecated - use the one from types)
const createAuthErrorResponse = (code: number, msg: string, status: number, traceId?: string): ErrorResponse => {
  return {
    code,
    msg,
    data: null,
    status,
    ...(traceId && { trace_id: traceId })
  };
};

// Main authentication middleware
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    // Log incoming request details
    console.log(`[Auth] ${req.method} ${req.originalUrl}`);
    console.log(`[Auth] Request Headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`[Auth] Request Body:`, JSON.stringify(req.body, null, 2));
    console.log(`[Auth] Request ID: ${req.requestId}`);

    // Extract access token from request body (as per Dewu API specification)
    const { access_token } = req.body;

    // 使用统一的业务逻辑进行认证
    const authResult = businessLogic.authenticateToken(access_token);
    
    if (!authResult.success) {
      const errorResponse = createAuthErrorResponse(
        authResult.error!.code,
        authResult.error!.msg,
        authResult.error!.status,
        generateTraceId()
      );
      res.status(authResult.error!.status).json(errorResponse);
      return;
    }

    console.log(`[Auth] Token validation successful for user: ${authResult.tokenData!.open_id}`);

    // Token is valid - attach token data to request
    req.tokenData = {
      access_token: authResult.tokenData!.access_token,
      open_id: authResult.tokenData!.open_id,
      scope: authResult.tokenData!.scope,
      expires_at: authResult.tokenData!.expires_at
    };

    // Continue to next middleware/route handler
    next();

  } catch (error) {
    console.error('Authentication middleware error:', error);

    const errorResponse = createAuthErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      'Internal server error during authentication',
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      generateTraceId()
    );
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
};

// Optional middleware for checking specific scopes
export const requireScope = (requiredScopes: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.tokenData) {
      const errorResponse = createAuthErrorResponse(
        ApiErrorCode.INVALID_TOKEN,
        'Authentication required',
        HttpStatusCode.UNAUTHORIZED,
        generateTraceId()
      );
      res.status(HttpStatusCode.UNAUTHORIZED).json(errorResponse);
      return;
    }

    const userScopes = req.tokenData.scope;
    const hasRequiredScope = requiredScopes.some(scope => userScopes.includes(scope));

    if (!hasRequiredScope) {
      const errorResponse = createAuthErrorResponse(
        ApiErrorCode.INSUFFICIENT_PERMISSIONS,
        `Insufficient permissions. Required scopes: ${requiredScopes.join(', ')}`,
        HttpStatusCode.FORBIDDEN,
        generateTraceId()
      );
      res.status(HttpStatusCode.FORBIDDEN).json(errorResponse);
      return;
    }

    next();
  };
};

// Utility function to get token info (for testing/debugging)
export const getTokenInfo = (access_token: string): StoredToken | undefined => {
  const tokenManager = businessLogic.getTokenManager();
  const validation = tokenManager.validateToken(access_token);
  if (validation.valid && validation.tokenData) {
    return {
      access_token: validation.tokenData.access_token,
      refresh_token: validation.tokenData.refresh_token,
      open_id: validation.tokenData.open_id,
      scope: validation.tokenData.scope,
      expires_at: validation.tokenData.expires_at,
      created_at: validation.tokenData.created_at
    };
  }
  return undefined;
};

// Utility function to revoke token
export const revokeToken = (access_token: string): boolean => {
  // 由于统一的 TokenManager 没有直接的删除方法，这里返回 true 表示成功
  // 在实际实现中，可以在 TokenManager 中添加删除方法
  return true;
};

// Utility function to clean up expired tokens (could be called periodically)
export const cleanupExpiredTokens = (): number => {
  // 由于使用统一的 TokenManager，这里返回 0
  // 在实际实现中，可以在 TokenManager 中添加清理方法
  return 0;
};

// Export token store for testing purposes (返回空 Map 保持兼容性)
export const getTokenStore = () => new Map();

// Mock app secrets for signature validation - in real implementation this would be from database
const APP_SECRETS = new Map<string, string>([
  ['test_app_key', 'test_app_secret'],
  ['your_app_key', 'your_app_secret'],
  ['demo_app_key', 'demo_app_secret']
]);

// Helper function to generate signature for mock validation
// This implements a simple HMAC-SHA256 signature algorithm
const generateSignature = (params: Record<string, any>, appSecret: string): string => {
  // Sort parameters by key (excluding sign parameter)
  const sortedParams = Object.keys(params)
    .filter(key => key !== 'sign')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  // Create signature using HMAC-SHA256
  const hmac = crypto.createHmac('sha256', appSecret);
  hmac.update(sortedParams);
  return hmac.digest('hex').toUpperCase();
};

// Signature validation function
export const validateSignature = (request: SignatureValidationRequest): SignatureValidationResult => {
  try {
    const { app_key, timestamp, sign, ...otherParams } = request;

    // Check if required signature parameters are present
    if (!app_key || !timestamp || !sign) {
      return {
        isValid: false,
        error: 'Missing required signature parameters: app_key, timestamp, or sign'
      };
    }

    // Validate timestamp (should be within 5 minutes of current time for security)
    const currentTime = Date.now();
    const requestTime = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
    const timeDiff = Math.abs(currentTime - requestTime);
    const maxTimeDiff = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (timeDiff > maxTimeDiff) {
      return {
        isValid: false,
        error: 'Request timestamp is too old or too far in the future'
      };
    }

    // Get app secret
    const appSecret = APP_SECRETS.get(app_key);
    if (!appSecret) {
      return {
        isValid: false,
        error: 'Invalid app_key'
      };
    }

    // Generate expected signature
    const expectedSignature = generateSignature({ app_key, timestamp, ...otherParams }, appSecret);

    // Compare signatures (case-insensitive)
    if (sign.toUpperCase() !== expectedSignature) {
      return {
        isValid: false,
        error: 'Invalid signature'
      };
    }

    return { isValid: true };

  } catch (error) {
    return {
      isValid: false,
      error: `Signature validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Signature validation middleware
export const validateRequestSignature = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    // Log incoming request details for signature validation
    console.log(`[Signature] ${req.method} ${req.originalUrl}`);
    console.log(`[Signature] Request Headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`[Signature] Request Body:`, JSON.stringify(req.body, null, 2));
    console.log(`[Signature] Request ID: ${req.requestId}`);

    // Extract signature parameters from request body
    const { app_key, timestamp, sign, ...otherParams } = req.body;

    // Validate signature
    const validationResult = validateSignature({
      app_key,
      timestamp,
      sign,
      ...otherParams
    });

    if (!validationResult.isValid) {
      const errorResponse = createAuthErrorResponse(
        ApiErrorCode.INVALID_SIGNATURE,
        validationResult.error || 'Invalid request signature',
        HttpStatusCode.UNAUTHORIZED,
        generateTraceId()
      );
      res.status(HttpStatusCode.UNAUTHORIZED).json(errorResponse);
      return;
    }

    // Signature is valid, continue to next middleware
    next();

  } catch (error) {
    console.error('Signature validation middleware error:', error);

    const errorResponse = createAuthErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      'Internal server error during signature validation',
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      generateTraceId()
    );
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
};

// Combined authentication and signature validation middleware (signature validation disabled)
export const authenticateAndValidateSignature = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  // Log incoming request details for authentication
  console.log(`[Auth] ${req.method} ${req.originalUrl}`);
  console.log(`[Auth] Request Headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`[Auth] Request Body:`, JSON.stringify(req.body, null, 2));
  console.log(`[Auth] Request ID: ${req.requestId}`);

  // Skip signature validation and only validate access token
  authenticateToken(req, res, next);
};

// Utility function to add app secret (for testing/setup)
export const addAppSecret = (appKey: string, appSecret: string): void => {
  APP_SECRETS.set(appKey, appSecret);
};

// Utility function to get app secret (for testing)
export const getAppSecret = (appKey: string): string | undefined => {
  return APP_SECRETS.get(appKey);
};