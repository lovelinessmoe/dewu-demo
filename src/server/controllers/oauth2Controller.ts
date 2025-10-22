import { Request, Response } from 'express';
import {
  TokenRequest,
  RefreshTokenRequest,
  TokenResponse,
  ErrorResponse,
  ApiErrorCode,
  HttpStatusCode
} from '../types/index';
import { MockDataGenerator } from '../utils/mockDataGenerator';

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

      // Extract and validate request parameters
      const { client_id, client_secret, authorization_code, grant_type }: TokenRequest = req.body;

      // Validate required parameters
      if (!client_id || !client_secret || !authorization_code) {
        const errorResponse: ErrorResponse = {
          code: ApiErrorCode.INVALID_PARAMETERS,
          msg: 'Missing required parameters: client_id, client_secret, authorization_code',
          status: HttpStatusCode.BAD_REQUEST
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Validate parameter formats
      if (typeof client_id !== 'string' || typeof client_secret !== 'string' || typeof authorization_code !== 'string') {
        const errorResponse: ErrorResponse = {
          code: ApiErrorCode.INVALID_PARAMETERS,
          msg: 'Invalid parameter format. All parameters must be strings',
          status: HttpStatusCode.BAD_REQUEST
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Mock validation of client credentials
      if (client_id.length < 8 || client_secret.length < 16) {
        const errorResponse: ErrorResponse = {
          code: ApiErrorCode.INVALID_TOKEN,
          msg: 'Invalid client credentials',
          status: HttpStatusCode.UNAUTHORIZED
        };
        res.status(401).json(errorResponse);
        return;
      }

      // Mock validation of authorization code
      if (authorization_code.length < 10) {
        const errorResponse: ErrorResponse = {
          code: ApiErrorCode.INVALID_PARAMETERS,
          msg: 'Invalid authorization code',
          status: HttpStatusCode.BAD_REQUEST
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Generate mock token response
      const tokenResponse: TokenResponse = MockDataGenerator.generateTokenResponse();

      // Store the token in the auth middleware's token store
      const { createMockToken } = await import('../middleware/auth');
      createMockToken(
        tokenResponse.data.access_token,
        tokenResponse.data.open_id,
        tokenResponse.data.scope
      );
      console.log(`[OAuth2-Token] Token stored for user: ${tokenResponse.data.open_id}`);

      // Log successful token generation
      console.log(`[OAuth2] Token generated for client_id: ${client_id}`);

      res.status(200).json(tokenResponse);
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

      // Extract and validate request parameters
      const { client_id, client_secret, refresh_token, grant_type }: RefreshTokenRequest = req.body;

      // Validate required parameters
      if (!client_id || !client_secret || !refresh_token) {
        const errorResponse: ErrorResponse = {
          code: ApiErrorCode.INVALID_PARAMETERS,
          msg: 'Missing required parameters: client_id, client_secret, refresh_token',
          status: HttpStatusCode.BAD_REQUEST
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Validate parameter formats
      if (typeof client_id !== 'string' || typeof client_secret !== 'string' || typeof refresh_token !== 'string') {
        const errorResponse: ErrorResponse = {
          code: ApiErrorCode.INVALID_PARAMETERS,
          msg: 'Invalid parameter format. All parameters must be strings',
          status: HttpStatusCode.BAD_REQUEST
        };
        res.status(400).json(errorResponse);
        return;
      }

      // Mock validation of client credentials
      if (client_id.length < 8 || client_secret.length < 16) {
        const errorResponse: ErrorResponse = {
          code: ApiErrorCode.INVALID_TOKEN,
          msg: 'Invalid client credentials',
          status: HttpStatusCode.UNAUTHORIZED
        };
        res.status(401).json(errorResponse);
        return;
      }

      // Mock validation of refresh token
      if (refresh_token.length < 35) {
        const errorResponse: ErrorResponse = {
          code: ApiErrorCode.INVALID_TOKEN,
          msg: 'Invalid refresh token format',
          status: HttpStatusCode.UNAUTHORIZED
        };
        res.status(401).json(errorResponse);
        return;
      }

      // Mock check for expired refresh token (simulate 10% chance of expired token)
      if (Math.random() < 0.1) {
        const errorResponse: ErrorResponse = {
          code: ApiErrorCode.TOKEN_EXPIRED,
          msg: 'Refresh token has expired',
          status: HttpStatusCode.UNAUTHORIZED
        };
        res.status(401).json(errorResponse);
        return;
      }

      // Generate new token response with updated tokens
      const tokenResponse: TokenResponse = MockDataGenerator.generateTokenResponse();

      // Store the new token in the auth middleware's token store
      const { createMockToken } = await import('../middleware/auth');
      createMockToken(
        tokenResponse.data.access_token,
        tokenResponse.data.open_id,
        tokenResponse.data.scope
      );
      console.log(`[OAuth2-Refresh] New token stored for user: ${tokenResponse.data.open_id}`);

      // Log successful token refresh
      console.log(`[OAuth2] Token refreshed for client_id: ${client_id}`);

      res.status(200).json(tokenResponse);
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