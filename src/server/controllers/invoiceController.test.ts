import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import server from '../app';
import { createMockToken, addAppSecret } from '../middleware/auth';
import crypto from 'crypto';

const app = server.getApp();

describe('InvoiceController', () => {
  let validAccessToken: string;
  let validAppKey: string;
  let validAppSecret: string;
  
  beforeEach(() => {
    // Create a valid access token for testing
    validAccessToken = 'at_test_token_12345678901234567890';
    validAppKey = 'test_app_key';
    validAppSecret = 'test_app_secret';
    
    createMockToken(validAccessToken, 'test_open_id', ['read', 'write']);
    addAppSecret(validAppKey, validAppSecret);
  });

  // Helper function to generate valid signature
  const generateSignature = (params: Record<string, any>): string => {
    const sortedParams = Object.keys(params)
      .filter(key => key !== 'sign')
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const hmac = crypto.createHmac('sha256', validAppSecret);
    hmac.update(sortedParams);
    return hmac.digest('hex').toUpperCase();
  };

  describe('getInvoiceList', () => {
    describe('Authentication and Signature Validation', () => {
      it('should return 401 error when access_token is missing', async () => {
        const timestamp = Date.now();
        const params = {
          app_key: validAppKey,
          timestamp,
          page_no: 1,
          page_size: 10
        };
        const sign = generateSignature(params);

        const response = await request(app)
          .post('/dop/api/v1/invoice/list')
          .send({
            ...params,
            sign
          });

        expect(response.status).toBe(401);
        expect(response.body.code).toBe(1002);
        expect(response.body.msg).toBe('Access token is required');
      });

      it('should return 401 error when signature is invalid', async () => {
        const timestamp = Date.now();
        const response = await request(app)
          .post('/dop/api/v1/invoice/list')
          .send({
            app_key: validAppKey,
            access_token: validAccessToken,
            timestamp,
            sign: 'invalid_signature',
            page_no: 1,
            page_size: 10
          });

        expect(response.status).toBe(401);
        expect(response.body.code).toBe(1004);
        expect(response.body.msg).toBe('Invalid signature');
      });

      it('should return 401 error when access_token is invalid', async () => {
        const timestamp = Date.now();
        const params = {
          app_key: validAppKey,
          access_token: 'invalid_token',
          timestamp,
          page_no: 1,
          page_size: 10
        };
        const sign = generateSignature(params);

        const response = await request(app)
          .post('/dop/api/v1/invoice/list')
          .send({
            ...params,
            sign
          });

        expect(response.status).toBe(401);
        expect(response.body.code).toBe(1002);
        expect(response.body.msg).toBe('Invalid access token');
      });
    });

    describe('Parameter Validation', () => {
      it('should return 400 error when page_no is missing', async () => {
        const timestamp = Date.now();
        const params = {
          app_key: validAppKey,
          access_token: validAccessToken,
          timestamp,
          page_size: 10
        };
        const sign = generateSignature(params);

        const response = await request(app)
          .post('/dop/api/v1/invoice/list')
          .send({
            ...params,
            sign
          });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(1001);
        expect(response.body.msg).toBe('page_no is required and must be greater than 0');
      });

      it('should return 400 error when page_size is missing', async () => {
        const timestamp = Date.now();
        const params = {
          app_key: validAppKey,
          access_token: validAccessToken,
          timestamp,
          page_no: 1
        };
        const sign = generateSignature(params);

        const response = await request(app)
          .post('/dop/api/v1/invoice/list')
          .send({
            ...params,
            sign
          });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(1001);
        expect(response.body.msg).toBe('page_size is required and must be greater than 0');
      });
    });

    describe('Successful requests', () => {
      it('should return invoice list with valid parameters', async () => {
        const timestamp = Date.now();
        const params = {
          app_key: validAppKey,
          access_token: validAccessToken,
          timestamp,
          page_no: 1,
          page_size: 10
        };
        const sign = generateSignature(params);

        const response = await request(app)
          .post('/dop/api/v1/invoice/list')
          .send({
            ...params,
            sign
          });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(0);
        expect(response.body.msg).toBe('success');
        expect(response.body).toHaveProperty('trace_id');
        expect(response.body.data).toHaveProperty('list');
        expect(response.body.data).toHaveProperty('total_results');
        expect(response.body.data).toHaveProperty('page_no');
        expect(response.body.data).toHaveProperty('page_size');
        expect(Array.isArray(response.body.data.list)).toBe(true);
      });

      it('should handle filtering by spu_id', async () => {
        const timestamp = Date.now();
        const params = {
          app_key: validAppKey,
          access_token: validAccessToken,
          timestamp,
          page_no: 1,
          page_size: 10,
          spu_id: 12345
        };
        const sign = generateSignature(params);

        const response = await request(app)
          .post('/dop/api/v1/invoice/list')
          .send({
            ...params,
            sign
          });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(0);
      });

      it('should handle filtering by status', async () => {
        const timestamp = Date.now();
        const params = {
          app_key: validAppKey,
          access_token: validAccessToken,
          timestamp,
          page_no: 1,
          page_size: 10,
          status: 0
        };
        const sign = generateSignature(params);

        const response = await request(app)
          .post('/dop/api/v1/invoice/list')
          .send({
            ...params,
            sign
          });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(0);
      });
    });
  });

  describe('handleInvoice', () => {
    describe('Authentication and Signature Validation', () => {
      it('should return 401 error when access_token is missing', async () => {
        const timestamp = Date.now();
        const params = {
          app_key: validAppKey,
          timestamp,
          order_no: '11001232435',
          operation_type: 1,
          category_type: 1,
          image_key: 'test_image_key'
        };
        const sign = generateSignature(params);

        const response = await request(app)
          .post('/dop/api/v1/invoice/handle')
          .send({
            ...params,
            sign
          });

        expect(response.status).toBe(401);
        expect(response.body.code).toBe(1002);
        expect(response.body.msg).toBe('Access token is required');
      });

      it('should return 401 error when signature is invalid', async () => {
        const timestamp = Date.now();
        const response = await request(app)
          .post('/dop/api/v1/invoice/handle')
          .send({
            app_key: validAppKey,
            access_token: validAccessToken,
            timestamp,
            sign: 'invalid_signature',
            order_no: '11001232435',
            operation_type: 1,
            category_type: 1,
            image_key: 'test_image_key'
          });

        expect(response.status).toBe(401);
        expect(response.body.code).toBe(1004);
        expect(response.body.msg).toBe('Invalid signature');
      });
    });

    describe('Parameter validation', () => {
      it('should return 400 error when order_no is missing', async () => {
        const timestamp = Date.now();
        const params = {
          app_key: validAppKey,
          access_token: validAccessToken,
          timestamp,
          operation_type: 1,
          category_type: 1,
          image_key: 'test_image_key'
        };
        const sign = generateSignature(params);

        const response = await request(app)
          .post('/dop/api/v1/invoice/handle')
          .send({
            ...params,
            sign
          });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(1001);
        expect(response.body.msg).toBe('order_no is required');
      });

      it('should return 400 error when operation_type is missing', async () => {
        const timestamp = Date.now();
        const params = {
          app_key: validAppKey,
          access_token: validAccessToken,
          timestamp,
          order_no: '11001232435',
          category_type: 1,
          image_key: 'test_image_key'
        };
        const sign = generateSignature(params);

        const response = await request(app)
          .post('/dop/api/v1/invoice/handle')
          .send({
            ...params,
            sign
          });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(1001);
        expect(response.body.msg).toBe('operation_type is required');
      });

      it('should return 400 error when category_type is missing', async () => {
        const timestamp = Date.now();
        const params = {
          app_key: validAppKey,
          access_token: validAccessToken,
          timestamp,
          order_no: '11001232435',
          operation_type: 1,
          image_key: 'test_image_key'
        };
        const sign = generateSignature(params);

        const response = await request(app)
          .post('/dop/api/v1/invoice/handle')
          .send({
            ...params,
            sign
          });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(1001);
        expect(response.body.msg).toBe('category_type is required');
      });

      it('should return 400 error when image_key is missing for approve operation', async () => {
        const timestamp = Date.now();
        const params = {
          app_key: validAppKey,
          access_token: validAccessToken,
          timestamp,
          order_no: '11001232435',
          operation_type: 1,
          category_type: 1
        };
        const sign = generateSignature(params);

        const response = await request(app)
          .post('/dop/api/v1/invoice/handle')
          .send({
            ...params,
            sign
          });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(1001);
        expect(response.body.msg).toBe('image_key is required when operation_type is 1 (approve)');
      });

      it('should return 400 error when reject_operation is missing for reject operation', async () => {
        const timestamp = Date.now();
        const params = {
          app_key: validAppKey,
          access_token: validAccessToken,
          timestamp,
          order_no: '11001232435',
          operation_type: 2,
          category_type: 1
        };
        const sign = generateSignature(params);

        const response = await request(app)
          .post('/dop/api/v1/invoice/handle')
          .send({
            ...params,
            sign
          });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(1001);
        expect(response.body.msg).toBe('reject_operation is required when operation_type is 2 (reject)');
      });

      it('should return 400 error when operation_type is invalid', async () => {
        const timestamp = Date.now();
        const params = {
          app_key: validAppKey,
          access_token: validAccessToken,
          timestamp,
          order_no: '11001232435',
          operation_type: 3,
          category_type: 1
        };
        const sign = generateSignature(params);

        const response = await request(app)
          .post('/dop/api/v1/invoice/handle')
          .send({
            ...params,
            sign
          });

        expect(response.status).toBe(400);
        expect(response.body.code).toBe(1001);
        expect(response.body.msg).toBe('operation_type must be 1 (approve) or 2 (reject)');
      });
    });

    describe('Successful requests', () => {
      it('should handle invoice approval successfully', async () => {
        const timestamp = Date.now();
        const params = {
          app_key: validAppKey,
          access_token: validAccessToken,
          timestamp,
          order_no: '11001232435',
          operation_type: 1,
          category_type: 1,
          image_key: 'test_image_key'
        };
        const sign = generateSignature(params);

        const response = await request(app)
          .post('/dop/api/v1/invoice/handle')
          .send({
            ...params,
            sign
          });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(0);
        expect(response.body.msg).toBe('success');
        expect(response.body).toHaveProperty('trace_id');
        expect(response.body.data).toEqual({});
      });

      it('should handle invoice rejection successfully', async () => {
        const timestamp = Date.now();
        const params = {
          app_key: validAppKey,
          access_token: validAccessToken,
          timestamp,
          order_no: '11001232436',
          operation_type: 2,
          category_type: 1,
          reject_operation: 1
        };
        const sign = generateSignature(params);

        const response = await request(app)
          .post('/dop/api/v1/invoice/handle')
          .send({
            ...params,
            sign
          });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(0);
        expect(response.body.msg).toBe('success');
        expect(response.body).toHaveProperty('trace_id');
        expect(response.body.data).toEqual({});
      });
    });
  });
});