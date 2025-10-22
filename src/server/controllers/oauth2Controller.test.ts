import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';
import { OAuth2Controller } from './oauth2Controller';
import { MockDataGenerator } from '../utils/mockDataGenerator';
import { ApiErrorCode } from '../types/index';

// Mock the MockDataGenerator
vi.mock('../utils/mockDataGenerator.js', () => ({
  MockDataGenerator: {
    generateTokenResponse: vi.fn()
  }
}));

describe('OAuth2Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;
  let mockGet: ReturnType<typeof vi.fn>;
  let consoleLogSpy: ReturnType<typeof vi.fn>;
  let consoleErrorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    mockGet = vi.fn();
    
    mockRequest = {
      body: {},
      get: mockGet
    };
    
    mockResponse = {
      status: mockStatus,
      json: mockJson
    };

    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('generateToken', () => {
    describe('Content-Type validation', () => {
      it('should return 400 error when Content-Type is missing', async () => {
        mockGet.mockReturnValue(undefined);

        await OAuth2Controller.generateToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.BAD_REQUEST,
          msg: 'Content-Type must be application/json',
          data: null,
          status: 400
        });
      });

      it('should return 400 error when Content-Type is not application/json', async () => {
        mockGet.mockReturnValue('text/plain');

        await OAuth2Controller.generateToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.BAD_REQUEST,
          msg: 'Content-Type must be application/json',
          data: null,
          status: 400
        });
      });

      it('should accept Content-Type with charset', async () => {
        mockGet.mockReturnValue('application/json; charset=utf-8');
        mockRequest.body = {
          client_id: 'test_client_12345',
          client_secret: 'test_secret_1234567890',
          authorization_code: 'auth_code_1234567890'
        };

        const mockTokenResponse = {
          code: 0,
          msg: 'success',
          data: {
            scope: ['read', 'write'],
            open_id: 'openid_123',
            access_token: 'at_123',
            access_token_expires_in: 7200,
            refresh_token: 'rt_123',
            refresh_token_expires_in: 2592000
          },
          status: 200
        };

        vi.mocked(MockDataGenerator.generateTokenResponse).mockReturnValue(mockTokenResponse);

        await OAuth2Controller.generateToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith(mockTokenResponse);
      });
    });

    describe('Parameter validation', () => {
      beforeEach(() => {
        mockGet.mockReturnValue('application/json');
      });

      it('should return 400 error when client_id is missing', async () => {
        mockRequest.body = {
          client_secret: 'test_secret_1234567890',
          authorization_code: 'auth_code_1234567890'
        };

        await OAuth2Controller.generateToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.BAD_REQUEST,
          msg: 'Missing required parameters: client_id, client_secret, authorization_code',
          data: null,
          status: 400
        });
      });

      it('should return 400 error when client_secret is missing', async () => {
        mockRequest.body = {
          client_id: 'test_client_12345',
          authorization_code: 'auth_code_1234567890'
        };

        await OAuth2Controller.generateToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.BAD_REQUEST,
          msg: 'Missing required parameters: client_id, client_secret, authorization_code',
          data: null,
          status: 400
        });
      });

      it('should return 400 error when authorization_code is missing', async () => {
        mockRequest.body = {
          client_id: 'test_client_12345',
          client_secret: 'test_secret_1234567890'
        };

        await OAuth2Controller.generateToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.BAD_REQUEST,
          msg: 'Missing required parameters: client_id, client_secret, authorization_code',
          data: null,
          status: 400
        });
      });

      it('should return 400 error when client_id is not a string', async () => {
        mockRequest.body = {
          client_id: 123,
          client_secret: 'test_secret_1234567890',
          authorization_code: 'auth_code_1234567890'
        };

        await OAuth2Controller.generateToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.BAD_REQUEST,
          msg: 'Invalid parameter format. All parameters must be strings',
          data: null,
          status: 400
        });
      });

      it('should return 400 error when client_secret is not a string', async () => {
        mockRequest.body = {
          client_id: 'test_client_12345',
          client_secret: 123,
          authorization_code: 'auth_code_1234567890'
        };

        await OAuth2Controller.generateToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.BAD_REQUEST,
          msg: 'Invalid parameter format. All parameters must be strings',
          data: null,
          status: 400
        });
      });

      it('should return 400 error when authorization_code is not a string', async () => {
        mockRequest.body = {
          client_id: 'test_client_12345',
          client_secret: 'test_secret_1234567890',
          authorization_code: 123
        };

        await OAuth2Controller.generateToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.BAD_REQUEST,
          msg: 'Invalid parameter format. All parameters must be strings',
          data: null,
          status: 400
        });
      });
    });

    describe('Client credential validation', () => {
      beforeEach(() => {
        mockGet.mockReturnValue('application/json');
      });

      it('should return 401 error when client_id is too short', async () => {
        mockRequest.body = {
          client_id: 'short',
          client_secret: 'test_secret_1234567890',
          authorization_code: 'auth_code_1234567890'
        };

        await OAuth2Controller.generateToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.INVALID_CLIENT,
          msg: 'Invalid client credentials',
          data: null,
          status: 401
        });
      });

      it('should return 401 error when client_secret is too short', async () => {
        mockRequest.body = {
          client_id: 'test_client_12345',
          client_secret: 'short',
          authorization_code: 'auth_code_1234567890'
        };

        await OAuth2Controller.generateToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.INVALID_CLIENT,
          msg: 'Invalid client credentials',
          data: null,
          status: 401
        });
      });
    });

    describe('Authorization code validation', () => {
      beforeEach(() => {
        mockGet.mockReturnValue('application/json');
      });

      it('should return 400 error when authorization_code is too short', async () => {
        mockRequest.body = {
          client_id: 'test_client_12345',
          client_secret: 'test_secret_1234567890',
          authorization_code: 'short'
        };

        await OAuth2Controller.generateToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.INVALID_GRANT,
          msg: 'Invalid authorization code',
          data: null,
          status: 400
        });
      });
    });

    describe('Successful token generation', () => {
      beforeEach(() => {
        mockGet.mockReturnValue('application/json');
        mockRequest.body = {
          client_id: 'test_client_12345',
          client_secret: 'test_secret_1234567890',
          authorization_code: 'auth_code_1234567890'
        };
      });

      it('should generate token successfully with valid parameters', async () => {
        const mockTokenResponse = {
          code: 0,
          msg: 'success',
          data: {
            scope: ['read', 'write'],
            open_id: 'openid_123456789',
            access_token: 'at_abcdef123456789',
            access_token_expires_in: 7200,
            refresh_token: 'rt_abcdef123456789',
            refresh_token_expires_in: 2592000
          },
          status: 200
        };

        vi.mocked(MockDataGenerator.generateTokenResponse).mockReturnValue(mockTokenResponse);

        await OAuth2Controller.generateToken(mockRequest as Request, mockResponse as Response);

        expect(MockDataGenerator.generateTokenResponse).toHaveBeenCalledOnce();
        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith(mockTokenResponse);
        expect(consoleLogSpy).toHaveBeenCalledWith('[OAuth2] Token generated for client_id: test_client_12345');
      });

      it('should return response with correct format', async () => {
        const mockTokenResponse = {
          code: 0,
          msg: 'success',
          data: {
            scope: ['read', 'write'],
            open_id: 'openid_123456789',
            access_token: 'at_abcdef123456789',
            access_token_expires_in: 7200,
            refresh_token: 'rt_abcdef123456789',
            refresh_token_expires_in: 2592000
          },
          status: 200
        };

        vi.mocked(MockDataGenerator.generateTokenResponse).mockReturnValue(mockTokenResponse);

        await OAuth2Controller.generateToken(mockRequest as Request, mockResponse as Response);

        const responseCall = mockJson.mock.calls[0][0];
        expect(responseCall).toHaveProperty('code', 0);
        expect(responseCall).toHaveProperty('msg', 'success');
        expect(responseCall).toHaveProperty('status', 200);
        expect(responseCall.data).toHaveProperty('scope');
        expect(responseCall.data).toHaveProperty('open_id');
        expect(responseCall.data).toHaveProperty('access_token');
        expect(responseCall.data).toHaveProperty('access_token_expires_in');
        expect(responseCall.data).toHaveProperty('refresh_token');
        expect(responseCall.data).toHaveProperty('refresh_token_expires_in');
      });
    });

    describe('Error handling', () => {
      beforeEach(() => {
        mockGet.mockReturnValue('application/json');
        mockRequest.body = {
          client_id: 'test_client_12345',
          client_secret: 'test_secret_1234567890',
          authorization_code: 'auth_code_1234567890'
        };
      });

      it('should handle internal server errors', async () => {
        vi.mocked(MockDataGenerator.generateTokenResponse).mockImplementation(() => {
          throw new Error('Mock error');
        });

        await OAuth2Controller.generateToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          msg: 'Internal server error during token generation',
          data: null,
          status: 500
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith('[OAuth2] Error generating token:', expect.any(Error));
      });
    });
  });

  describe('refreshToken', () => {
    describe('Content-Type validation', () => {
      it('should return 400 error when Content-Type is missing', async () => {
        mockGet.mockReturnValue(undefined);

        await OAuth2Controller.refreshToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.BAD_REQUEST,
          msg: 'Content-Type must be application/json',
          data: null,
          status: 400
        });
      });

      it('should return 400 error when Content-Type is not application/json', async () => {
        mockGet.mockReturnValue('text/plain');

        await OAuth2Controller.refreshToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.BAD_REQUEST,
          msg: 'Content-Type must be application/json',
          data: null,
          status: 400
        });
      });
    });

    describe('Parameter validation', () => {
      beforeEach(() => {
        mockGet.mockReturnValue('application/json');
      });

      it('should return 400 error when client_id is missing', async () => {
        mockRequest.body = {
          client_secret: 'test_secret_1234567890',
          refresh_token: 'rt_abcdef123456789012345678901234567890'
        };

        await OAuth2Controller.refreshToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.BAD_REQUEST,
          msg: 'Missing required parameters: client_id, client_secret, refresh_token',
          data: null,
          status: 400
        });
      });

      it('should return 400 error when client_secret is missing', async () => {
        mockRequest.body = {
          client_id: 'test_client_12345',
          refresh_token: 'rt_abcdef123456789012345678901234567890'
        };

        await OAuth2Controller.refreshToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.BAD_REQUEST,
          msg: 'Missing required parameters: client_id, client_secret, refresh_token',
          data: null,
          status: 400
        });
      });

      it('should return 400 error when refresh_token is missing', async () => {
        mockRequest.body = {
          client_id: 'test_client_12345',
          client_secret: 'test_secret_1234567890'
        };

        await OAuth2Controller.refreshToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.BAD_REQUEST,
          msg: 'Missing required parameters: client_id, client_secret, refresh_token',
          data: null,
          status: 400
        });
      });

      it('should return 400 error when parameters are not strings', async () => {
        mockRequest.body = {
          client_id: 123,
          client_secret: 'test_secret_1234567890',
          refresh_token: 'rt_abcdef123456789012345678901234567890'
        };

        await OAuth2Controller.refreshToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.BAD_REQUEST,
          msg: 'Invalid parameter format. All parameters must be strings',
          data: null,
          status: 400
        });
      });
    });

    describe('Client credential validation', () => {
      beforeEach(() => {
        mockGet.mockReturnValue('application/json');
      });

      it('should return 401 error when client credentials are invalid', async () => {
        mockRequest.body = {
          client_id: 'short',
          client_secret: 'test_secret_1234567890',
          refresh_token: 'rt_abcdef123456789012345678901234567890'
        };

        await OAuth2Controller.refreshToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.INVALID_CLIENT,
          msg: 'Invalid client credentials',
          data: null,
          status: 401
        });
      });
    });

    describe('Refresh token validation', () => {
      beforeEach(() => {
        mockGet.mockReturnValue('application/json');
        mockRequest.body = {
          client_id: 'test_client_12345',
          client_secret: 'test_secret_1234567890'
        };
      });

      it('should return 401 error when refresh_token format is invalid (wrong prefix)', async () => {
        mockRequest.body.refresh_token = 'at_abcdef123456789012345678901234567890';

        await OAuth2Controller.refreshToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.INVALID_REFRESH_TOKEN,
          msg: 'Invalid refresh token format',
          data: null,
          status: 401
        });
      });

      it('should return 401 error when refresh_token is too short', async () => {
        mockRequest.body.refresh_token = 'rt_short';

        await OAuth2Controller.refreshToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.INVALID_REFRESH_TOKEN,
          msg: 'Invalid refresh token format',
          data: null,
          status: 401
        });
      });
    });

    describe('Successful token refresh', () => {
      beforeEach(() => {
        mockGet.mockReturnValue('application/json');
        mockRequest.body = {
          client_id: 'test_client_12345',
          client_secret: 'test_secret_1234567890',
          refresh_token: 'rt_abcdef123456789012345678901234567890'
        };
        
        // Mock Math.random to avoid expired token scenario
        vi.spyOn(Math, 'random').mockReturnValue(0.5);
      });

      afterEach(() => {
        vi.mocked(Math.random).mockRestore();
      });

      it('should refresh token successfully with valid parameters', async () => {
        const mockTokenResponse = {
          code: 0,
          msg: 'success',
          data: {
            scope: ['read', 'write'],
            open_id: 'openid_123456789',
            access_token: 'at_new_token_123456789',
            access_token_expires_in: 7200,
            refresh_token: 'rt_new_token_123456789',
            refresh_token_expires_in: 2592000
          },
          status: 200
        };

        vi.mocked(MockDataGenerator.generateTokenResponse).mockReturnValue(mockTokenResponse);

        await OAuth2Controller.refreshToken(mockRequest as Request, mockResponse as Response);

        expect(MockDataGenerator.generateTokenResponse).toHaveBeenCalledOnce();
        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith(mockTokenResponse);
        expect(consoleLogSpy).toHaveBeenCalledWith('[OAuth2] Token refreshed for client_id: test_client_12345');
      });

      it('should return response with correct format', async () => {
        const mockTokenResponse = {
          code: 0,
          msg: 'success',
          data: {
            scope: ['read', 'write'],
            open_id: 'openid_123456789',
            access_token: 'at_new_token_123456789',
            access_token_expires_in: 7200,
            refresh_token: 'rt_new_token_123456789',
            refresh_token_expires_in: 2592000
          },
          status: 200
        };

        vi.mocked(MockDataGenerator.generateTokenResponse).mockReturnValue(mockTokenResponse);

        await OAuth2Controller.refreshToken(mockRequest as Request, mockResponse as Response);

        const responseCall = mockJson.mock.calls[0][0];
        expect(responseCall).toHaveProperty('code', 0);
        expect(responseCall).toHaveProperty('msg', 'success');
        expect(responseCall).toHaveProperty('status', 200);
        expect(responseCall.data).toHaveProperty('scope');
        expect(responseCall.data).toHaveProperty('open_id');
        expect(responseCall.data).toHaveProperty('access_token');
        expect(responseCall.data).toHaveProperty('access_token_expires_in');
        expect(responseCall.data).toHaveProperty('refresh_token');
        expect(responseCall.data).toHaveProperty('refresh_token_expires_in');
      });
    });

    describe('Expired refresh token handling', () => {
      beforeEach(() => {
        mockGet.mockReturnValue('application/json');
        mockRequest.body = {
          client_id: 'test_client_12345',
          client_secret: 'test_secret_1234567890',
          refresh_token: 'rt_abcdef123456789012345678901234567890'
        };
      });

      it('should return 401 error when refresh token is expired', async () => {
        // Mock Math.random to simulate expired token (< 0.1)
        vi.spyOn(Math, 'random').mockReturnValue(0.05);

        await OAuth2Controller.refreshToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.EXPIRED_TOKEN,
          msg: 'Refresh token has expired',
          data: null,
          status: 401
        });

        vi.mocked(Math.random).mockRestore();
      });
    });

    describe('Error handling', () => {
      beforeEach(() => {
        mockGet.mockReturnValue('application/json');
        mockRequest.body = {
          client_id: 'test_client_12345',
          client_secret: 'test_secret_1234567890',
          refresh_token: 'rt_abcdef123456789012345678901234567890'
        };
        
        // Mock Math.random to avoid expired token scenario
        vi.spyOn(Math, 'random').mockReturnValue(0.5);
      });

      afterEach(() => {
        vi.mocked(Math.random).mockRestore();
      });

      it('should handle internal server errors', async () => {
        vi.mocked(MockDataGenerator.generateTokenResponse).mockImplementation(() => {
          throw new Error('Mock error');
        });

        await OAuth2Controller.refreshToken(mockRequest as Request, mockResponse as Response);

        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({
          code: ErrorCodes.INTERNAL_SERVER_ERROR,
          msg: 'Internal server error during token refresh',
          data: null,
          status: 500
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith('[OAuth2] Error refreshing token:', expect.any(Error));
      });
    });
  });
});