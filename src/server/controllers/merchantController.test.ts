import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import server from '../app';
import { createMockToken } from '../middleware/auth';

const app = server.getApp();

describe('MerchantController', () => {
  let validAccessToken: string;
  
  beforeEach(() => {
    // Create a valid access token for testing
    validAccessToken = 'at_test_token_12345678901234567890';
    createMockToken(validAccessToken, 'test_open_id', ['read', 'write']);
  });

  describe('getMerchantBaseInfo', () => {
    describe('Authentication', () => {
      it('should return 401 error when access_token is missing', async () => {
        const response = await request(app)
          .post('/dop/api/v1/common/merchant/base/info')
          .send({});

        expect(response.status).toBe(401);
        expect(response.body.code).toBe(1002);
        expect(response.body.msg).toBe('Access token is required');
      });

      it('should return 401 error when access_token is invalid', async () => {
        const response = await request(app)
          .post('/dop/api/v1/common/merchant/base/info')
          .send({
            access_token: 'invalid_token'
          });

        expect(response.status).toBe(401);
        expect(response.body.code).toBe(1002);
        expect(response.body.msg).toBe('Invalid access token');
      });
    });

    describe('Successful requests', () => {
      it('should return merchant base info with valid access token', async () => {
        const response = await request(app)
          .post('/dop/api/v1/common/merchant/base/info')
          .send({
            access_token: validAccessToken
          });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.msg).toBe('success');
        expect(response.body.domain).toBeDefined();
        expect(response.body.data).toBeDefined();
        expect(response.body.errors).toBeDefined();
        expect(Array.isArray(response.body.errors)).toBe(true);
        
        // Verify merchant info structure according to Dewu specification
        const merchantData = response.body.data;
        expect(merchantData.merchant_id).toBeDefined();
        expect(typeof merchantData.merchant_id).toBe('string');
        expect(merchantData.merchant_id.length).toBeGreaterThan(0);
        
        expect(merchantData.type_id).toBeDefined();
        expect(typeof merchantData.type_id).toBe('string');
        expect(merchantData.type_id.length).toBeGreaterThan(0);
      });
    });
  });
});