import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import server from '../server/app';
import { createMockToken, addAppSecret } from '../server/middleware/auth';

const app = server.getApp();

describe('Error Code Check', () => {
  let consoleErrorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('should check actual error response when Supabase is unavailable', async () => {
    const timestamp = Date.now();
    const requestData = {
      app_key: 'test_app_key',
      access_token: 'at_test_token_12345678901234567890',
      timestamp,
      page_no: 1,
      page_size: 10
    };

    addAppSecret('test_app_key', 'test_app_secret');
    createMockToken('at_test_token_12345678901234567890', {
      open_id: 'test_open_id',
      scope: ['read', 'write'],
      expires_at: timestamp + 3600000
    });

    const response = await request(app)
      .post('/dop/api/v1/invoice/list')
      .send(requestData);

    console.log('Response Status:', response.status);
    console.log('Response Body:', JSON.stringify(response.body, null, 2));
    
    // Just verify we get an error response with proper structure
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.body).toHaveProperty('code');
    expect(response.body).toHaveProperty('msg');
    expect(response.body).toHaveProperty('trace_id');
  });
});