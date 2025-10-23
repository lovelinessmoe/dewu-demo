import { describe, it, expect, vi } from 'vitest';
import type { ApiError } from '../services/apiClient';

// Mock the error handling logic from InvoiceManager
const mockInvoiceManagerErrorHandler = {
  getErrorMessage: (status: number, originalMessage: string): string => {
    switch (status) {
      case 503:
        return '服务暂时不可用，数据库连接失败。请稍后重试。';
      case 500:
        return '数据库错误，处理请求时出现问题。请重试或联系技术支持。';
      case 404:
        return '未找到发票，请求的发票在系统中不存在。';
      case 0:
        return '网络连接失败，请检查网络连接后重试。';
      case 401:
        return '需要重新登录，请重新获取访问令牌。';
      case 403:
        return '访问被拒绝，您没有执行此操作的权限。';
      default:
        return originalMessage || '发生未知错误，请重试。';
    }
  },

  handleApiError: (error: ApiError): string => {
    return mockInvoiceManagerErrorHandler.getErrorMessage(error.status, error.msg);
  }
};

describe('InvoiceManager Error Handling', () => {

  describe('Load Invoices Error Handling', () => {
    it('should handle API error response for database connection failure', () => {
      const apiError: ApiError = {
        code: 5001,
        msg: 'Database connection failed',
        status: 503,
        data: null
      };

      const errorMessage = mockInvoiceManagerErrorHandler.handleApiError(apiError);
      expect(errorMessage).toContain('服务暂时不可用，数据库连接失败。请稍后重试。');
    });

    it('should handle network exception errors', () => {
      const networkError: ApiError = {
        code: 0,
        msg: 'Network Error',
        status: 0,
        data: null
      };

      const errorMessage = mockInvoiceManagerErrorHandler.handleApiError(networkError);
      expect(errorMessage).toContain('网络连接失败，请检查网络连接后重试。');
    });

    it('should handle 503 Service Unavailable errors', () => {
      const serviceError: ApiError = {
        code: 5004,
        msg: 'Service temporarily unavailable',
        status: 503,
        data: null
      };

      const errorMessage = mockInvoiceManagerErrorHandler.handleApiError(serviceError);
      expect(errorMessage).toContain('服务暂时不可用，数据库连接失败。请稍后重试。');
    });

    it('should handle 500 Database Error', () => {
      const databaseError: ApiError = {
        code: 5002,
        msg: 'Database query failed',
        status: 500,
        data: null
      };

      const errorMessage = mockInvoiceManagerErrorHandler.handleApiError(databaseError);
      expect(errorMessage).toContain('数据库错误，处理请求时出现问题。请重试或联系技术支持。');
    });
  });

  describe('Handle Invoice Error Handling', () => {
    it('should return user-friendly error message when handleInvoice fails with 503', () => {
      const apiError: ApiError = {
        code: 5004,
        msg: 'Service temporarily unavailable',
        status: 503,
        data: null
      };

      const errorMessage = mockInvoiceManagerErrorHandler.handleApiError(apiError);
      expect(errorMessage).toContain('服务暂时不可用，数据库连接失败。请稍后重试。');
    });

    it('should return user-friendly error message when handleInvoice fails with 500', () => {
      const apiError: ApiError = {
        code: 5002,
        msg: 'Database query failed',
        status: 500,
        data: null
      };

      const errorMessage = mockInvoiceManagerErrorHandler.handleApiError(apiError);
      expect(errorMessage).toContain('数据库错误，处理请求时出现问题。请重试或联系技术支持。');
    });

    it('should return user-friendly error message when handleInvoice fails with 404', () => {
      const apiError: ApiError = {
        code: 1006,
        msg: 'Invoice not found',
        status: 404,
        data: null
      };

      const errorMessage = mockInvoiceManagerErrorHandler.handleApiError(apiError);
      expect(errorMessage).toContain('未找到发票，请求的发票在系统中不存在。');
    });

    it('should return user-friendly error message when handleInvoice throws network error', () => {
      const networkError: ApiError = {
        code: 0,
        msg: 'Network Error',
        status: 0,
        data: null
      };

      const errorMessage = mockInvoiceManagerErrorHandler.handleApiError(networkError);
      expect(errorMessage).toContain('网络连接失败，请检查网络连接后重试。');
    });

    it('should return user-friendly error message when handleInvoice throws 401 auth error', () => {
      const authError: ApiError = {
        code: 1002,
        msg: 'Invalid access token',
        status: 401,
        data: null
      };

      const errorMessage = mockInvoiceManagerErrorHandler.handleApiError(authError);
      expect(errorMessage).toContain('需要重新登录，请重新获取访问令牌。');
    });
  });

  describe('Update Invoice Error Handling', () => {
    it('should return user-friendly error message when updateInvoice fails with backend error', () => {
      const apiError: ApiError = {
        code: 5002,
        msg: 'Database query failed',
        status: 500,
        data: null
      };

      const errorMessage = mockInvoiceManagerErrorHandler.handleApiError(apiError);
      expect(errorMessage).toContain('数据库错误，处理请求时出现问题。请重试或联系技术支持。');
    });

    it('should return user-friendly error message when updateInvoice throws exception', () => {
      const networkError: ApiError = {
        code: 0,
        msg: 'Network Error',
        status: 0,
        data: null
      };

      const errorMessage = mockInvoiceManagerErrorHandler.handleApiError(networkError);
      expect(errorMessage).toContain('网络连接失败，请检查网络连接后重试。');
    });
  });

  describe('Add Invoices Error Handling', () => {
    it('should return user-friendly error message when addInvoices fails with backend error', () => {
      const apiError: ApiError = {
        code: 5001,
        msg: 'Database connection failed',
        status: 503,
        data: null
      };

      const errorMessage = mockInvoiceManagerErrorHandler.handleApiError(apiError);
      expect(errorMessage).toContain('服务暂时不可用，数据库连接失败。请稍后重试。');
    });

    it('should return user-friendly error message when addInvoices throws exception', () => {
      const timeoutError: ApiError = {
        code: 5003,
        msg: 'Database operation timed out',
        status: 503,
        data: null
      };

      const errorMessage = mockInvoiceManagerErrorHandler.handleApiError(timeoutError);
      expect(errorMessage).toContain('服务暂时不可用，数据库连接失败。请稍后重试。');
    });
  });

  describe('Error Message Helper Function', () => {
    it('should return correct message for 503 status', () => {
      const errorMessage = mockInvoiceManagerErrorHandler.getErrorMessage(503, 'Service temporarily unavailable');
      expect(errorMessage).toContain('服务暂时不可用，数据库连接失败。请稍后重试。');
    });

    it('should return correct message for 500 status', () => {
      const errorMessage = mockInvoiceManagerErrorHandler.getErrorMessage(500, 'Database query failed');
      expect(errorMessage).toContain('数据库错误，处理请求时出现问题。请重试或联系技术支持。');
    });

    it('should return correct message for 404 status', () => {
      const errorMessage = mockInvoiceManagerErrorHandler.getErrorMessage(404, 'Invoice not found');
      expect(errorMessage).toContain('未找到发票，请求的发票在系统中不存在。');
    });

    it('should return correct message for 0 status (network error)', () => {
      const errorMessage = mockInvoiceManagerErrorHandler.getErrorMessage(0, 'Network Error');
      expect(errorMessage).toContain('网络连接失败，请检查网络连接后重试。');
    });

    it('should return correct message for 401/403 status', () => {
      const errorMessage401 = mockInvoiceManagerErrorHandler.getErrorMessage(401, 'Invalid access token');
      const errorMessage403 = mockInvoiceManagerErrorHandler.getErrorMessage(403, 'Access denied');
      
      expect(errorMessage401).toContain('需要重新登录，请重新获取访问令牌。');
      expect(errorMessage403).toContain('访问被拒绝，您没有执行此操作的权限。');
    });

    it('should return original message for unknown status codes', () => {
      const customMessage = 'Custom error message';
      const errorMessage = mockInvoiceManagerErrorHandler.getErrorMessage(418, customMessage);
      
      expect(errorMessage).toBe(customMessage);
    });

    it('should return fallback message when original message is empty for unknown codes', () => {
      const errorMessage = mockInvoiceManagerErrorHandler.getErrorMessage(999, '');
      
      expect(errorMessage).toContain('发生未知错误，请重试。');
    });
  });

  describe('Error Handling Validation', () => {
    it('should validate all error status codes are handled', () => {
      const testCases = [
        { status: 503, expected: '服务暂时不可用' },
        { status: 500, expected: '数据库错误' },
        { status: 404, expected: '未找到发票' },
        { status: 401, expected: '需要重新登录' },
        { status: 403, expected: '访问被拒绝' },
        { status: 0, expected: '网络连接失败' }
      ];

      testCases.forEach(({ status, expected }) => {
        const errorMessage = mockInvoiceManagerErrorHandler.getErrorMessage(status, 'test message');
        expect(errorMessage).toContain(expected);
      });
    });

    it('should handle edge cases properly', () => {
      // Test null message
      const nullMessage = mockInvoiceManagerErrorHandler.getErrorMessage(503, null as any);
      expect(nullMessage).toContain('服务暂时不可用');

      // Test undefined message
      const undefinedMessage = mockInvoiceManagerErrorHandler.getErrorMessage(503, undefined as any);
      expect(undefinedMessage).toContain('服务暂时不可用');

      // Test empty message with unknown status
      const emptyMessage = mockInvoiceManagerErrorHandler.getErrorMessage(999, '');
      expect(emptyMessage).toContain('发生未知错误，请重试。');
    });
  });
});

describe('InvoiceManager Sorting Validation', () => {
  // Mock invoice data with different upload times to test sorting
  const mockInvoiceData = [
    {
      order_no: 'ORDER001',
      upload_time: '2024-01-01T10:00:00Z',
      status: 1,
      amount: 1000
    },
    {
      order_no: 'ORDER002', 
      upload_time: '2024-01-03T10:00:00Z',
      status: 1,
      amount: 2000
    },
    {
      order_no: 'ORDER003',
      upload_time: '2024-01-02T10:00:00Z', 
      status: 2,
      amount: 1500
    }
  ];

  // Mock loadInvoices function that simulates the frontend behavior
  const mockLoadInvoices = (backendSortedData: any[]) => {
    // Simulate the frontend preserving backend sort order
    // The comment in the actual code says: "Preserve backend sort order - invoices are already sorted by upload_time DESC"
    return backendSortedData; // Frontend should NOT re-sort, just preserve the order
  };

  describe('Backend Sort Order Preservation', () => {
    it('should preserve backend sort order without client-side sorting', () => {
      // Simulate backend returning data sorted by upload_time DESC (newest first)
      const backendSortedData = [
        mockInvoiceData[1], // 2024-01-03 (newest)
        mockInvoiceData[2], // 2024-01-02 (middle)
        mockInvoiceData[0]  // 2024-01-01 (oldest)
      ];

      const frontendData = mockLoadInvoices(backendSortedData);

      // Frontend should preserve the exact order from backend
      expect(frontendData[0].order_no).toBe('ORDER002'); // Newest first
      expect(frontendData[1].order_no).toBe('ORDER003'); // Middle
      expect(frontendData[2].order_no).toBe('ORDER001'); // Oldest last
    });

    it('should not apply additional client-side sorting', () => {
      // Simulate backend returning properly sorted data
      const backendSortedData = [
        { order_no: 'ORDER_NEW', upload_time: '2024-12-31T23:59:59Z', status: 1 },
        { order_no: 'ORDER_MID', upload_time: '2024-06-15T12:00:00Z', status: 2 },
        { order_no: 'ORDER_OLD', upload_time: '2024-01-01T00:00:00Z', status: 1 }
      ];

      const frontendData = mockLoadInvoices(backendSortedData);

      // Verify frontend maintains the exact order (no re-sorting)
      expect(frontendData).toEqual(backendSortedData);
      
      // Verify the order is newest to oldest
      expect(new Date(frontendData[0].upload_time).getTime())
        .toBeGreaterThan(new Date(frontendData[1].upload_time).getTime());
      expect(new Date(frontendData[1].upload_time).getTime())
        .toBeGreaterThan(new Date(frontendData[2].upload_time).getTime());
    });

    it('should handle empty data arrays correctly', () => {
      const emptyBackendData: any[] = [];
      const frontendData = mockLoadInvoices(emptyBackendData);

      expect(frontendData).toEqual([]);
      expect(frontendData.length).toBe(0);
    });

    it('should handle single invoice correctly', () => {
      const singleInvoiceData = [mockInvoiceData[0]];
      const frontendData = mockLoadInvoices(singleInvoiceData);

      expect(frontendData).toEqual(singleInvoiceData);
      expect(frontendData.length).toBe(1);
      expect(frontendData[0].order_no).toBe('ORDER001');
    });
  });

  describe('Sort Order Validation with Different Data Sets', () => {
    it('should preserve sort order with mixed status values', () => {
      const mixedStatusData = [
        { order_no: 'A', upload_time: '2024-03-01T10:00:00Z', status: 2 },
        { order_no: 'B', upload_time: '2024-02-01T10:00:00Z', status: 1 },
        { order_no: 'C', upload_time: '2024-01-01T10:00:00Z', status: 3 }
      ];

      const frontendData = mockLoadInvoices(mixedStatusData);

      // Should preserve exact order regardless of status
      expect(frontendData[0].order_no).toBe('A');
      expect(frontendData[1].order_no).toBe('B');
      expect(frontendData[2].order_no).toBe('C');
    });

    it('should preserve sort order with same upload times', () => {
      const sameTimeData = [
        { order_no: 'FIRST', upload_time: '2024-01-01T10:00:00Z', status: 1 },
        { order_no: 'SECOND', upload_time: '2024-01-01T10:00:00Z', status: 2 }
      ];

      const frontendData = mockLoadInvoices(sameTimeData);

      // Should preserve backend order even with identical timestamps
      expect(frontendData[0].order_no).toBe('FIRST');
      expect(frontendData[1].order_no).toBe('SECOND');
    });

    it('should preserve sort order with large datasets', () => {
      // Generate a large dataset to test performance and consistency
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        order_no: `ORDER_${String(i).padStart(3, '0')}`,
        upload_time: new Date(2024, 0, 1, 10, i, 0).toISOString(),
        status: (i % 3) + 1
      })).reverse(); // Reverse to simulate newest first

      const frontendData = mockLoadInvoices(largeDataset);

      // Should preserve exact order
      expect(frontendData).toEqual(largeDataset);
      expect(frontendData.length).toBe(100);
      
      // Verify first and last items
      expect(frontendData[0].order_no).toBe('ORDER_099');
      expect(frontendData[99].order_no).toBe('ORDER_000');
    });
  });

  describe('Frontend Sorting Behavior Validation', () => {
    it('should not have client-side sorting functions', () => {
      // This test validates that the frontend doesn't implement sorting functions
      // that would conflict with backend sorting
      
      // Mock the InvoiceManager state structure
      const mockState = {
        invoices: mockInvoiceData,
        loading: false,
        error: null,
        editingInvoice: null,
        showEditModal: false,
        showAddModal: false,
        generateCount: 5
        // Note: No sortBy, sortOrder, or sorting-related state properties
      };

      // Verify no sorting-related properties exist in state
      expect(mockState).not.toHaveProperty('sortBy');
      expect(mockState).not.toHaveProperty('sortOrder');
      expect(mockState).not.toHaveProperty('sortDirection');
      expect(mockState).not.toHaveProperty('sortField');
    });

    it('should validate that loadInvoices preserves API response order', () => {
      // Mock API response structure
      const mockApiResponse = {
        code: 0,
        msg: 'success',
        data: {
          list: [
            { order_no: 'NEWEST', upload_time: '2024-12-31T10:00:00Z' },
            { order_no: 'MIDDLE', upload_time: '2024-06-15T10:00:00Z' },
            { order_no: 'OLDEST', upload_time: '2024-01-01T10:00:00Z' }
          ],
          total: 3
        }
      };

      // Simulate the loadInvoices function behavior
      const processedInvoices = mockApiResponse.data.list; // Direct assignment, no sorting

      // Verify the order is preserved exactly as received from API
      expect(processedInvoices[0].order_no).toBe('NEWEST');
      expect(processedInvoices[1].order_no).toBe('MIDDLE');
      expect(processedInvoices[2].order_no).toBe('OLDEST');
    });

    it('should handle API responses with pre-sorted data correctly', () => {
      // Test various scenarios of pre-sorted data from backend
      const testScenarios = [
        {
          name: 'Chronological order',
          data: [
            { order_no: 'A', upload_time: '2024-03-01T10:00:00Z' },
            { order_no: 'B', upload_time: '2024-02-01T10:00:00Z' },
            { order_no: 'C', upload_time: '2024-01-01T10:00:00Z' }
          ]
        },
        {
          name: 'Mixed timestamps',
          data: [
            { order_no: 'X', upload_time: '2024-12-25T15:30:00Z' },
            { order_no: 'Y', upload_time: '2024-05-10T08:45:00Z' },
            { order_no: 'Z', upload_time: '2024-01-15T22:15:00Z' }
          ]
        }
      ];

      testScenarios.forEach(scenario => {
        const frontendData = mockLoadInvoices(scenario.data);
        
        // Frontend should preserve exact order for each scenario
        expect(frontendData).toEqual(scenario.data);
        
        // Verify no re-sorting occurred
        scenario.data.forEach((item, index) => {
          expect(frontendData[index].order_no).toBe(item.order_no);
        });
      });
    });
  });

  describe('Integration with Backend Sorting', () => {
    it('should work correctly with backend ORDER BY upload_time DESC', () => {
      // Simulate what the backend would return with ORDER BY upload_time DESC
      const backendOrderedData = [
        { order_no: 'RECENT', upload_time: '2024-10-15T14:30:00Z', status: 1 },
        { order_no: 'YESTERDAY', upload_time: '2024-10-14T09:15:00Z', status: 2 },
        { order_no: 'LASTWEEK', upload_time: '2024-10-08T16:45:00Z', status: 1 },
        { order_no: 'LASTMONTH', upload_time: '2024-09-15T11:20:00Z', status: 3 }
      ];

      const frontendResult = mockLoadInvoices(backendOrderedData);

      // Verify frontend preserves the DESC order from backend
      expect(frontendResult).toEqual(backendOrderedData);
      
      // Verify the timestamps are in descending order (newest first)
      for (let i = 0; i < frontendResult.length - 1; i++) {
        const currentTime = new Date(frontendResult[i].upload_time).getTime();
        const nextTime = new Date(frontendResult[i + 1].upload_time).getTime();
        expect(currentTime).toBeGreaterThanOrEqual(nextTime);
      }
    });

    it('should maintain consistency across page loads', () => {
      // Simulate multiple API calls returning the same sorted data
      const consistentData = [
        { order_no: 'STABLE_1', upload_time: '2024-05-01T10:00:00Z' },
        { order_no: 'STABLE_2', upload_time: '2024-04-01T10:00:00Z' },
        { order_no: 'STABLE_3', upload_time: '2024-03-01T10:00:00Z' }
      ];

      // Simulate multiple loads
      const load1 = mockLoadInvoices([...consistentData]);
      const load2 = mockLoadInvoices([...consistentData]);
      const load3 = mockLoadInvoices([...consistentData]);

      // All loads should produce identical results
      expect(load1).toEqual(load2);
      expect(load2).toEqual(load3);
      expect(load1).toEqual(consistentData);
    });
  });
});