import { Request, Response } from 'express';
import {
  TokenRequest,
  RefreshTokenRequest,
  TokenResponse,
  ErrorResponse,
  ApiErrorCode,
  HttpStatusCode
} from '../types/index';
import { BusinessLogic } from '../../shared/core/index.js';

// 创建业务逻辑实例
const businessLogic = new BusinessLogic();

/**
 * OAuth2 Controller for handling token generation and refresh endpoints
 */
export class OAuth2Controller {

  /**
   * Handle token generation endpoint
   * POST /api/v1/h5/passport/v1/oauth2/token
   */
  static async generateToken(req: Request, res: Response): Promise<void> {
    try {
      // Log incoming request details
      console.log(`[OAuth2-Token] ${req.method} ${req.originalUrl}`);
      console.log(`[OAuth2-Token] Request Headers:`, JSON.stringify(req.headers, null, 2));
      console.log(`[OAuth2-Token] Request Body:`, JSON.stringify(req.body, null, 2));
      console.log(`[OAuth2-Token] Request ID: ${req.requestId}`);
      
      // Validate Content-Type header
      const contentType = req.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorResponse: ErrorResponse = {
          code: ApiErrorCode.INVALID_PARAMETERS,
          msg: 'Content-Type must be application/json',
          status: HttpStatusCode.BAD_REQUEST
        };
        res.status(400).json(errorResponse);
        return;
      }

      // 使用统一的业务逻辑
      const result = businessLogic.generateToken(req.body);
      
      if (!result.success) {
        res.status(result.error!.status).json(result.error);
        return;
      }

      // Log successful token generation
      console.log(`[OAuth2] Token generated for client_id: ${req.body.client_id}`);

      res.status(200).json(result.data);
    } catch (error) {
      console.error('[OAuth2] Error generating token:', error);

      const errorResponse: ErrorResponse = {
        code: ApiErrorCode.INTERNAL_ERROR,
        msg: 'Internal server error during token generation',
        status: HttpStatusCode.INTERNAL_SERVER_ERROR
      };
      res.status(500).json(errorResponse);
    }
  }

  /**
   * Handle token refresh endpoint
   * POST /api/v1/h5/passport/v1/oauth2/refresh_token
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Log incoming request details
      console.log(`[OAuth2-Refresh] ${req.method} ${req.originalUrl}`);
      console.log(`[OAuth2-Refresh] Request Headers:`, JSON.stringify(req.headers, null, 2));
      console.log(`[OAuth2-Refresh] Request Body:`, JSON.stringify(req.body, null, 2));
      console.log(`[OAuth2-Refresh] Request ID: ${req.requestId}`);
      
      // Validate Content-Type header
      const contentType = req.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorResponse: ErrorResponse = {
          code: ApiErrorCode.INVALID_PARAMETERS,
          msg: 'Content-Type must be application/json',
          status: HttpStatusCode.BAD_REQUEST
        };
        res.status(400).json(errorResponse);
        return;
      }

      // 使用统一的业务逻辑
      const result = businessLogic.refreshToken(req.body);
      
      if (!result.success) {
        res.status(result.error!.status).json(result.error);
        return;
      }

      // Log successful token refresh
      console.log(`[OAuth2] Token refreshed for client_id: ${req.body.client_id}`);

      res.status(200).json(result.data);
    } catch (error) {
      console.error('[OAuth2] Error refreshing token:', error);

      const errorResponse: ErrorResponse = {
        code: ApiErrorCode.INTERNAL_ERROR,
        msg: 'Internal server error during token refresh',
        status: HttpStatusCode.INTERNAL_SERVER_ERROR
      };
      res.status(500).json(errorResponse);
    }
  }
}