import { Request, Response, NextFunction } from 'express';
import { ErrorResponse, ApiErrorCode, HttpStatusCode, SignatureValidationRequest, SignatureValidationResult } from '../types/index';
import crypto from 'crypto';

// Extended Request interface to include token data
export interface AuthenticatedRequest extends Request {
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

// In-memory token store for mock implementation
const tokenStore = new Map<string, StoredToken>();

// Helper function to generate mock token data
export const createMockToken = (access_token: string, open_id: string, scope: string[] = ['read', 'write']): StoredToken => {
  const now = Date.now();
  const expiresIn = 3600 * 1000; // 1 hour in milliseconds

  const tokenData: StoredToken = {
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

// Helper function to validate token format
const isValidTokenFormat = (token: string): boolean => {
  // Basic token format validation - should be a non-empty string
  return typeof token === 'string' && token.length > 0 && token.trim() === token;
};

// Helper function to create error response
const createErrorResponse = (code: number, msg: string, status: number): ErrorResponse => {
  return {
    code,
    msg,
    data: null,
    status
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

    // Check if access token is provided
    if (!access_token) {
      const errorResponse = createErrorResponse(
        ApiErrorCode.INVALID_TOKEN,
        'Access token is required',
        HttpStatusCode.UNAUTHORIZED
      );
      res.status(HttpStatusCode.UNAUTHORIZED).json(errorResponse);
      return;
    }

    // Validate token format
    if (!isValidTokenFormat(access_token)) {
      const errorResponse = createErrorResponse(
        ApiErrorCode.INVALID_TOKEN,
        'Invalid access token format',
        HttpStatusCode.UNAUTHORIZED
      );
      res.status(HttpStatusCode.UNAUTHORIZED).json(errorResponse);
      return;
    }

    // Check if token exists in our mock store
    const storedToken = tokenStore.get(access_token);
    if (!storedToken) {
      console.log(`[Auth] Token not found in store for token: ${access_token.substring(0, 10)}...`);
      const errorResponse = createErrorResponse(
        ApiErrorCode.INVALID_TOKEN,
        'Invalid access token',
        HttpStatusCode.UNAUTHORIZED
      );
      res.status(HttpStatusCode.UNAUTHORIZED).json(errorResponse);
      return;
    }

    console.log(`[Auth] Token validation successful for user: ${storedToken.open_id}`);

    // Check if token is expired
    const now = Date.now();
    if (now >= storedToken.expires_at) {
      // Remove expired token from store
      tokenStore.delete(access_token);

      const errorResponse = createErrorResponse(
        ApiErrorCode.TOKEN_EXPIRED,
        'Access token has expired',
        HttpStatusCode.FORBIDDEN
      );
      res.status(HttpStatusCode.FORBIDDEN).json(errorResponse);
      return;
    }

    // Token is valid - attach token data to request
    req.tokenData = {
      access_token: storedToken.access_token,
      open_id: storedToken.open_id,
      scope: storedToken.scope,
      expires_at: storedToken.expires_at
    };

    // Continue to next middleware/route handler
    next();

  } catch (error) {
    console.error('Authentication middleware error:', error);

    const errorResponse = createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      'Internal server error during authentication',
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
};

// Optional middleware for checking specific scopes
export const requireScope = (requiredScopes: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.tokenData) {
      const errorResponse = createErrorResponse(
        ApiErrorCode.INVALID_TOKEN,
        'Authentication required',
        HttpStatusCode.UNAUTHORIZED
      );
      res.status(HttpStatusCode.UNAUTHORIZED).json(errorResponse);
      return;
    }

    const userScopes = req.tokenData.scope;
    const hasRequiredScope = requiredScopes.some(scope => userScopes.includes(scope));

    if (!hasRequiredScope) {
      const errorResponse = createErrorResponse(
        ApiErrorCode.INSUFFICIENT_PERMISSIONS,
        `Insufficient permissions. Required scopes: ${requiredScopes.join(', ')}`,
        HttpStatusCode.FORBIDDEN
      );
      res.status(HttpStatusCode.FORBIDDEN).json(errorResponse);
      return;
    }

    next();
  };
};

// Utility function to get token info (for testing/debugging)
export const getTokenInfo = (access_token: string): StoredToken | undefined => {
  return tokenStore.get(access_token);
};

// Utility function to revoke token
export const revokeToken = (access_token: string): boolean => {
  return tokenStore.delete(access_token);
};

// Utility function to clean up expired tokens (could be called periodically)
export const cleanupExpiredTokens = (): number => {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [token, data] of tokenStore.entries()) {
    if (now >= data.expires_at) {
      tokenStore.delete(token);
      cleanedCount++;
    }
  }

  return cleanedCount;
};

// Export token store for testing purposes
export const getTokenStore = () => tokenStore;

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
export const validateRequestSignature = (req: Request, res: Response, next: NextFunction): void => {
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
      const errorResponse = createErrorResponse(
        ApiErrorCode.INVALID_SIGNATURE,
        validationResult.error || 'Invalid request signature',
        HttpStatusCode.UNAUTHORIZED
      );
      res.status(HttpStatusCode.UNAUTHORIZED).json(errorResponse);
      return;
    }

    // Signature is valid, continue to next middleware
    next();

  } catch (error) {
    console.error('Signature validation middleware error:', error);

    const errorResponse = createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      'Internal server error during signature validation',
      HttpStatusCode.INTERNAL_SERVER_ERROR
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