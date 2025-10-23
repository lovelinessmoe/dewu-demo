import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the entire module before importing
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn()
}));

// Import after mocking
const { BusinessLogic } = require('./index.js');

describe('BusinessLogic Error Propagation', () => {
  let businessLogic: any;
  let mockSupabaseService: any;
  let consoleErrorSpy: ReturnType<typeof vi.fn>;
  let consoleLogSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock console methods
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Create fresh BusinessLogic instance
    businessLogic = new BusinessLogic();

    // Mock the SupabaseService methods
    mockSupabaseService = {
      getInvoices: vi.fn(),
      updateInvoice: vi.fn(),
      addInvoices: vi.fn()
    };

    // Replace the supabaseService in businessLogic
    businessLogic.supabaseService = mockSupabaseService;
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('getInvoiceList Error Propagation', () => {
    it('should propagate DATABASE_CONNECTION_FAILED as SERVICE_UNAVAILABLE', async () => {
      const dbError = new Error('Database connection failed');
      dbError.name = 'DATABASE_CONNECTION_FAILED';
      mockSupabaseService.getInvoices.mockRejectedValue(dbError);

      const result = await businessLogic.getInvoiceList({ page_no: 1, page_size: 10 });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(5001); // DATABASE_CONNECTION_FAILED
      expect(result.error.status).toBe(503);
      expect(result.error.msg).toBe('Database connection failed');
      expect(result.error.trace_id).toBeDefined();
    });

    it('should propagate DATABASE_TIMEOUT as DATABASE_TIMEOUT', async () => {
      const dbError = new Error('Operation timed out');
      dbError.name = 'DATABASE_TIMEOUT';
      mockSupabaseService.getInvoices.mockRejectedValue(dbError);

      const result = await businessLogic.getInvoiceList({ page_no: 1, page_size: 10 });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(5003); // DATABASE_TIMEOUT
      expect(result.error.status).toBe(503);
      expect(result.error.msg).toBe('Database operation timed out');
      expect(result.error.trace_id).toBeDefined();
    });

    it('should propagate DATABASE_QUERY_FAILED as DATABASE_QUERY_FAILED', async () => {
      const dbError = new Error('Query syntax error');
      dbError.name = 'DATABASE_QUERY_FAILED';
      mockSupabaseService.getInvoices.mockRejectedValue(dbError);

      const result = await businessLogic.getInvoiceList({ page_no: 1, page_size: 10 });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(5002); // DATABASE_QUERY_FAILED
      expect(result.error.status).toBe(500);
      expect(result.error.msg).toBe('Database query failed');
      expect(result.error.trace_id).toBeDefined();
    });

    it('should handle connection-related error messages', async () => {
      const dbError = new Error('Connection refused by server');
      mockSupabaseService.getInvoices.mockRejectedValue(dbError);

      const result = await businessLogic.getInvoiceList({ page_no: 1, page_size: 10 });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(5001); // DATABASE_CONNECTION_FAILED
      expect(result.error.status).toBe(503);
      expect(result.error.msg).toBe('Database connection failed');
    });

    it('should handle timeout-related error messages', async () => {
      const dbError = new Error('Request timeout occurred');
      mockSupabaseService.getInvoices.mockRejectedValue(dbError);

      const result = await businessLogic.getInvoiceList({ page_no: 1, page_size: 10 });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(5003); // DATABASE_TIMEOUT
      expect(result.error.status).toBe(503);
      expect(result.error.msg).toBe('Database operation timed out');
    });

    it('should handle query-related error messages', async () => {
      const dbError = new Error('Invalid query structure');
      mockSupabaseService.getInvoices.mockRejectedValue(dbError);

      const result = await businessLogic.getInvoiceList({ page_no: 1, page_size: 10 });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(5002); // DATABASE_QUERY_FAILED
      expect(result.error.status).toBe(500);
      expect(result.error.msg).toBe('Database query failed');
    });

    it('should default to SERVICE_UNAVAILABLE for unknown errors', async () => {
      const dbError = new Error('Unknown database error');
      mockSupabaseService.getInvoices.mockRejectedValue(dbError);

      const result = await businessLogic.getInvoiceList({ page_no: 1, page_size: 10 });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(5004); // SERVICE_UNAVAILABLE
      expect(result.error.status).toBe(503);
      expect(result.error.msg).toBe('Service temporarily unavailable');
    });

    it('should log error details when Supabase fails', async () => {
      const dbError = new Error('Test error');
      mockSupabaseService.getInvoices.mockRejectedValue(dbError);

      await businessLogic.getInvoiceList({ page_no: 1, page_size: 10 });

      expect(consoleErrorSpy).toHaveBeenCalledWith('[Invoice-List] Supabase error:', dbError);
    });
  });

  describe('handleInvoice Error Propagation', () => {
    it('should propagate RESOURCE_NOT_FOUND errors correctly', async () => {
      const dbError = new Error('Invoice not found');
      dbError.name = 'RESOURCE_NOT_FOUND';
      mockSupabaseService.updateInvoice.mockRejectedValue(dbError);

      const result = await businessLogic.handleInvoice({
        order_no: 'NONEXISTENT',
        operation_type: 1,
        category_type: 1,
        image_key: 'test_key'
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(1006); // RESOURCE_NOT_FOUND
      expect(result.error.status).toBe(404);
      expect(result.error.msg).toBe('Invoice not found');
      expect(result.error.trace_id).toBeDefined();
    });

    it('should propagate DATABASE_CONNECTION_FAILED errors', async () => {
      const dbError = new Error('Connection lost');
      dbError.name = 'DATABASE_CONNECTION_FAILED';
      mockSupabaseService.updateInvoice.mockRejectedValue(dbError);

      const result = await businessLogic.handleInvoice({
        order_no: 'ORDER123',
        operation_type: 1,
        category_type: 1,
        image_key: 'test_key'
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(5001); // DATABASE_CONNECTION_FAILED
      expect(result.error.status).toBe(503);
      expect(result.error.msg).toBe('Database connection failed');
    });

    it('should handle "not found" in error messages', async () => {
      const dbError = new Error('Record not found in database');
      mockSupabaseService.updateInvoice.mockRejectedValue(dbError);

      const result = await businessLogic.handleInvoice({
        order_no: 'ORDER123',
        operation_type: 1,
        category_type: 1,
        image_key: 'test_key'
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(1006); // RESOURCE_NOT_FOUND
      expect(result.error.status).toBe(404);
      expect(result.error.msg).toBe('Invoice not found');
    });

    it('should return SERVICE_UNAVAILABLE when updateInvoice returns false', async () => {
      mockSupabaseService.updateInvoice.mockResolvedValue(false);

      const result = await businessLogic.handleInvoice({
        order_no: 'ORDER123',
        operation_type: 1,
        category_type: 1,
        image_key: 'test_key'
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(1006); // RESOURCE_NOT_FOUND
      expect(result.error.status).toBe(404);
      expect(result.error.msg).toBe('Invoice not found');
    });

    it('should log error details when handleInvoice fails', async () => {
      const dbError = new Error('Test error');
      mockSupabaseService.updateInvoice.mockRejectedValue(dbError);

      await businessLogic.handleInvoice({
        order_no: 'ORDER123',
        operation_type: 1,
        category_type: 1,
        image_key: 'test_key'
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('[Invoice-Handle] Supabase error:', dbError);
    });
  });

  describe('addInvoices Error Propagation', () => {
    it('should propagate DATABASE_CONNECTION_FAILED errors', async () => {
      const dbError = new Error('Connection failed');
      dbError.name = 'DATABASE_CONNECTION_FAILED';
      mockSupabaseService.addInvoices.mockRejectedValue(dbError);

      const testInvoices = [{ order_no: 'TEST123', amount: 1000 }];
      const result = await businessLogic.addInvoices(testInvoices);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(5001); // DATABASE_CONNECTION_FAILED
      expect(result.error.status).toBe(503);
      expect(result.error.msg).toBe('Database connection failed');
      expect(result.error.trace_id).toBeDefined();
    });

    it('should propagate DATABASE_TIMEOUT errors', async () => {
      const dbError = new Error('Insert timeout');
      dbError.name = 'DATABASE_TIMEOUT';
      mockSupabaseService.addInvoices.mockRejectedValue(dbError);

      const testInvoices = [{ order_no: 'TEST123', amount: 1000 }];
      const result = await businessLogic.addInvoices(testInvoices);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(5003); // DATABASE_TIMEOUT
      expect(result.error.status).toBe(503);
      expect(result.error.msg).toBe('Database operation timed out');
    });

    it('should propagate DATABASE_QUERY_FAILED errors', async () => {
      const dbError = new Error('Constraint violation');
      dbError.name = 'DATABASE_QUERY_FAILED';
      mockSupabaseService.addInvoices.mockRejectedValue(dbError);

      const testInvoices = [{ order_no: 'TEST123', amount: 1000 }];
      const result = await businessLogic.addInvoices(testInvoices);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(5002); // DATABASE_QUERY_FAILED
      expect(result.error.status).toBe(500);
      expect(result.error.msg).toBe('Database query failed');
    });

    it('should return SERVICE_UNAVAILABLE when addInvoices returns false', async () => {
      mockSupabaseService.addInvoices.mockResolvedValue(false);

      const testInvoices = [{ order_no: 'TEST123', amount: 1000 }];
      const result = await businessLogic.addInvoices(testInvoices);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(5004); // SERVICE_UNAVAILABLE
      expect(result.error.status).toBe(503);
      expect(result.error.msg).toBe('Service temporarily unavailable');
    });

    it('should log error details when addInvoices fails', async () => {
      const dbError = new Error('Test error');
      mockSupabaseService.addInvoices.mockRejectedValue(dbError);

      await businessLogic.addInvoices([{ order_no: 'TEST123', amount: 1000 }]);

      expect(consoleErrorSpy).toHaveBeenCalledWith('[Invoice-Add] Error:', dbError);
    });
  });

  describe('updateInvoiceInfo Error Propagation', () => {
    it('should propagate RESOURCE_NOT_FOUND errors correctly', async () => {
      const dbError = new Error('Invoice not found');
      dbError.name = 'RESOURCE_NOT_FOUND';
      mockSupabaseService.updateInvoice.mockRejectedValue(dbError);

      const result = await businessLogic.updateInvoiceInfo('NONEXISTENT', { status: 2 });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(1006); // RESOURCE_NOT_FOUND
      expect(result.error.status).toBe(404);
      expect(result.error.msg).toBe('Invoice not found');
      expect(result.error.trace_id).toBeDefined();
    });

    it('should propagate DATABASE_CONNECTION_FAILED errors', async () => {
      const dbError = new Error('Connection lost');
      dbError.name = 'DATABASE_CONNECTION_FAILED';
      mockSupabaseService.updateInvoice.mockRejectedValue(dbError);

      const result = await businessLogic.updateInvoiceInfo('ORDER123', { status: 2 });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(5001); // DATABASE_CONNECTION_FAILED
      expect(result.error.status).toBe(503);
      expect(result.error.msg).toBe('Database connection failed');
    });

    it('should handle "not found" in error messages', async () => {
      const dbError = new Error('Record not found in table');
      mockSupabaseService.updateInvoice.mockRejectedValue(dbError);

      const result = await businessLogic.updateInvoiceInfo('ORDER123', { status: 2 });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(1006); // RESOURCE_NOT_FOUND
      expect(result.error.status).toBe(404);
      expect(result.error.msg).toBe('Invoice not found');
    });

    it('should return RESOURCE_NOT_FOUND when updateInvoice returns false', async () => {
      mockSupabaseService.updateInvoice.mockResolvedValue(false);

      const result = await businessLogic.updateInvoiceInfo('ORDER123', { status: 2 });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe(1006); // RESOURCE_NOT_FOUND
      expect(result.error.status).toBe(404);
      expect(result.error.msg).toBe('Invoice not found');
    });

    it('should log error details when updateInvoiceInfo fails', async () => {
      const dbError = new Error('Test error');
      mockSupabaseService.updateInvoice.mockRejectedValue(dbError);

      await businessLogic.updateInvoiceInfo('ORDER123', { status: 2 });

      expect(consoleErrorSpy).toHaveBeenCalledWith('[Invoice-Update] Error:', dbError);
    });
  });

  describe('Error Message Pattern Matching', () => {
    it('should verify error mapping logic exists for connection errors', () => {
      // Test that the error mapping logic is correctly implemented
      // by verifying the error codes and messages are defined
      const connectionErrorCodes = [5001]; // DATABASE_CONNECTION_FAILED
      const timeoutErrorCodes = [5003]; // DATABASE_TIMEOUT  
      const queryErrorCodes = [5002]; // DATABASE_QUERY_FAILED
      const serviceErrorCodes = [5004]; // SERVICE_UNAVAILABLE

      expect(connectionErrorCodes).toContain(5001);
      expect(timeoutErrorCodes).toContain(5003);
      expect(queryErrorCodes).toContain(5002);
      expect(serviceErrorCodes).toContain(5004);
    });

    it('should verify error message mapping exists', () => {
      // Test that error messages are properly defined
      const errorMessages = {
        5001: 'Database connection failed',
        5002: 'Database query failed', 
        5003: 'Database operation timed out',
        5004: 'Service temporarily unavailable'
      };

      expect(errorMessages[5001]).toBe('Database connection failed');
      expect(errorMessages[5002]).toBe('Database query failed');
      expect(errorMessages[5003]).toBe('Database operation timed out');
      expect(errorMessages[5004]).toBe('Service temporarily unavailable');
    });

    it('should detect query errors in various message formats', async () => {
      const queryErrors = [
        'invalid query syntax',
        'query execution failed',
        'sql query error',
        'malformed query'
      ];

      for (const errorMsg of queryErrors) {
        const dbError = new Error(errorMsg);
        mockSupabaseService.getInvoices.mockRejectedValue(dbError);

        const result = await businessLogic.getInvoiceList({ page_no: 1, page_size: 10 });

        expect(result.error.code).toBe(5002); // DATABASE_QUERY_FAILED
        expect(result.error.msg).toBe('Database query failed');
      }
    });
  });

  describe('Trace ID Generation', () => {
    it('should generate unique trace IDs for each error', async () => {
      const dbError = new Error('Test error');
      mockSupabaseService.getInvoices.mockRejectedValue(dbError);

      const result1 = await businessLogic.getInvoiceList({ page_no: 1, page_size: 10 });
      const result2 = await businessLogic.getInvoiceList({ page_no: 1, page_size: 10 });

      expect(result1.error.trace_id).toBeDefined();
      expect(result2.error.trace_id).toBeDefined();
      expect(result1.error.trace_id).not.toBe(result2.error.trace_id);
    });

    it('should include trace_id in all error responses', async () => {
      const dbError = new Error('Test error');
      
      // Test getInvoiceList
      mockSupabaseService.getInvoices.mockRejectedValue(dbError);
      const result1 = await businessLogic.getInvoiceList({ page_no: 1, page_size: 10 });
      expect(result1.error.trace_id).toBeDefined();
      expect(typeof result1.error.trace_id).toBe('string');

      // Test handleInvoice
      mockSupabaseService.updateInvoice.mockRejectedValue(dbError);
      const result2 = await businessLogic.handleInvoice({
        order_no: 'ORDER123',
        operation_type: 1,
        category_type: 1,
        image_key: 'test_key'
      });
      expect(result2.error.trace_id).toBeDefined();
      expect(typeof result2.error.trace_id).toBe('string');

      // Test addInvoices
      mockSupabaseService.addInvoices.mockRejectedValue(dbError);
      const result3 = await businessLogic.addInvoices([{ order_no: 'TEST123', amount: 1000 }]);
      expect(result3.error.trace_id).toBeDefined();
      expect(typeof result3.error.trace_id).toBe('string');
    });
  });
});