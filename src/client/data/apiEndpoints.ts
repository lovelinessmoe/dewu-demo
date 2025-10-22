import type { ApiEndpoint, ApiCategory } from '../types/api'

export const apiEndpoints: ApiEndpoint[] = [
  {
    id: 'oauth2-token',
    title: 'Generate OAuth2 Token',
    method: 'POST',
    path: '/api/v1/h5/passport/v1/oauth2/token',
    description: 'Generate access token and refresh token using authorization code',
    category: 'oauth2',
    requiresAuth: false,
    requestFormat: {
      contentType: 'application/json',
      parameters: [
        {
          name: 'client_id',
          type: 'string',
          required: true,
          description: 'Client identifier provided by Dewu',
          example: 'your_client_id'
        },
        {
          name: 'client_secret',
          type: 'string',
          required: true,
          description: 'Client secret provided by Dewu',
          example: 'your_client_secret'
        },
        {
          name: 'authorization_code',
          type: 'string',
          required: true,
          description: 'Authorization code received from OAuth2 flow',
          example: 'auth_code_123'
        }
      ]
    },
    responseFormat: {
      success: {
        code: 0,
        msg: 'success',
        data: {
          scope: ['read', 'write'],
          open_id: 'user_open_id',
          access_token: 'access_token_string',
          access_token_expires_in: 7200,
          refresh_token: 'refresh_token_string',
          refresh_token_expires_in: 2592000
        },
        status: 200
      },
      error: {
        code: 400,
        msg: 'Invalid parameters',
        data: null,
        status: 400
      }
    },
    examples: {
      request: {
        client_id: 'demo_client_id',
        client_secret: 'demo_client_secret',
        authorization_code: 'demo_auth_code'
      },
      response: {
        code: 0,
        msg: 'success',
        data: {
          scope: ['read', 'write'],
          open_id: 'demo_user_123',
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          access_token_expires_in: 7200,
          refresh_token: 'refresh_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refresh_token_expires_in: 2592000
        },
        status: 200
      }
    }
  },
  {
    id: 'oauth2-refresh',
    title: 'Refresh OAuth2 Token',
    method: 'POST',
    path: '/api/v1/h5/passport/v1/oauth2/refresh_token',
    description: 'Refresh access token using refresh token',
    category: 'oauth2',
    requiresAuth: false,
    requestFormat: {
      contentType: 'application/json',
      parameters: [
        {
          name: 'client_id',
          type: 'string',
          required: true,
          description: 'Client identifier provided by Dewu',
          example: 'your_client_id'
        },
        {
          name: 'client_secret',
          type: 'string',
          required: true,
          description: 'Client secret provided by Dewu',
          example: 'your_client_secret'
        },
        {
          name: 'refresh_token',
          type: 'string',
          required: true,
          description: 'Valid refresh token',
          example: 'refresh_token_string'
        }
      ]
    },
    responseFormat: {
      success: {
        code: 0,
        msg: 'success',
        data: {
          scope: ['read', 'write'],
          open_id: 'user_open_id',
          access_token: 'new_access_token_string',
          access_token_expires_in: 7200,
          refresh_token: 'new_refresh_token_string',
          refresh_token_expires_in: 2592000
        },
        status: 200
      },
      error: {
        code: 401,
        msg: 'Invalid refresh token',
        data: null,
        status: 401
      }
    },
    examples: {
      request: {
        client_id: 'demo_client_id',
        client_secret: 'demo_client_secret',
        refresh_token: 'refresh_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      },
      response: {
        code: 0,
        msg: 'success',
        data: {
          scope: ['read', 'write'],
          open_id: 'demo_user_123',
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9_new...',
          access_token_expires_in: 7200,
          refresh_token: 'refresh_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9_new...',
          refresh_token_expires_in: 2592000
        },
        status: 200
      }
    }
  },
  {
    id: 'invoice-list',
    title: 'Get Invoice List',
    method: 'POST',
    path: '/dop/api/v1/invoice/list',
    description: 'Retrieve list of invoices with pagination',
    category: 'invoices',
    requiresAuth: true,
    requestFormat: {
      contentType: 'application/json',
      parameters: [
        {
          name: 'access_token',
          type: 'string',
          required: true,
          description: 'Valid access token',
          example: 'access_token_string'
        },
        {
          name: 'page',
          type: 'number',
          required: false,
          description: 'Page number (default: 1)',
          example: 1
        },
        {
          name: 'page_size',
          type: 'number',
          required: false,
          description: 'Number of items per page (default: 20)',
          example: 20
        }
      ]
    },
    responseFormat: {
      success: {
        code: 0,
        msg: 'success',
        data: {
          invoices: [
            {
              invoice_id: 'string',
              merchant_id: 'string',
              amount: 'number',
              status: 'string',
              created_at: 'string',
              updated_at: 'string'
            }
          ],
          total: 'number',
          page: 'number',
          page_size: 'number'
        },
        status: 200
      },
      error: {
        code: 401,
        msg: 'Unauthorized',
        data: null,
        status: 401
      }
    },
    examples: {
      request: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        page: 1,
        page_size: 10
      },
      response: {
        code: 0,
        msg: 'success',
        data: {
          invoices: [
            {
              invoice_id: 'inv_123456',
              merchant_id: 'merchant_789',
              amount: 99.99,
              status: 'pending',
              created_at: '2024-01-15T10:30:00Z',
              updated_at: '2024-01-15T10:30:00Z'
            }
          ],
          total: 1,
          page: 1,
          page_size: 10
        },
        status: 200
      }
    }
  },
  {
    id: 'invoice-handle',
    title: 'Handle Invoice',
    method: 'POST',
    path: '/dop/api/v1/invoice/handle',
    description: 'Process invoice operations (approve, reject, etc.)',
    category: 'invoices',
    requiresAuth: true,
    requestFormat: {
      contentType: 'application/json',
      parameters: [
        {
          name: 'access_token',
          type: 'string',
          required: true,
          description: 'Valid access token',
          example: 'access_token_string'
        },
        {
          name: 'invoice_id',
          type: 'string',
          required: true,
          description: 'Invoice identifier',
          example: 'inv_123456'
        },
        {
          name: 'action',
          type: 'string',
          required: true,
          description: 'Action to perform (approve, reject, process)',
          example: 'approve'
        }
      ]
    },
    responseFormat: {
      success: {
        code: 0,
        msg: 'success',
        data: {
          invoice_id: 'string',
          status: 'string',
          processed_at: 'string'
        },
        status: 200
      },
      error: {
        code: 400,
        msg: 'Invalid invoice data',
        data: null,
        status: 400
      }
    },
    examples: {
      request: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        invoice_id: 'inv_123456',
        action: 'approve'
      },
      response: {
        code: 0,
        msg: 'success',
        data: {
          invoice_id: 'inv_123456',
          status: 'approved',
          processed_at: '2024-01-15T11:00:00Z'
        },
        status: 200
      }
    }
  },
  {
    id: 'merchant-info',
    title: 'Get Merchant Base Info',
    method: 'POST',
    path: '/dop/api/v1/common/merchant/base/info',
    description: 'Retrieve merchant base information',
    category: 'merchant',
    requiresAuth: true,
    requestFormat: {
      contentType: 'application/json',
      parameters: [
        {
          name: 'access_token',
          type: 'string',
          required: true,
          description: 'Valid access token',
          example: 'access_token_string'
        }
      ]
    },
    responseFormat: {
      success: {
        code: 0,
        msg: 'success',
        data: {
          merchant_id: 'string',
          name: 'string',
          status: 'string',
          created_at: 'string',
          contact_info: {
            email: 'string',
            phone: 'string'
          }
        },
        status: 200
      },
      error: {
        code: 403,
        msg: 'Forbidden',
        data: null,
        status: 403
      }
    },
    examples: {
      request: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      },
      response: {
        code: 0,
        msg: 'success',
        data: {
          merchant_id: 'merchant_789',
          name: 'Demo Merchant Store',
          status: 'active',
          created_at: '2023-06-15T09:00:00Z',
          contact_info: {
            email: 'merchant@example.com',
            phone: '+1234567890'
          }
        },
        status: 200
      }
    }
  }
]

export const apiCategories: ApiCategory[] = [
  {
    id: 'oauth2',
    name: 'OAuth2 Authentication',
    description: 'Endpoints for OAuth2 token management and authentication',
    endpoints: ['oauth2-token', 'oauth2-refresh']
  },
  {
    id: 'invoices',
    name: 'Invoice Management',
    description: 'Endpoints for managing and processing invoices',
    endpoints: ['invoice-list', 'invoice-handle']
  },
  {
    id: 'merchant',
    name: 'Merchant Information',
    description: 'Endpoints for retrieving merchant data and information',
    endpoints: ['merchant-info']
  }
]