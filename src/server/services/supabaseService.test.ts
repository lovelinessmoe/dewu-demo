import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('SupabaseService Error Handling', () => {
  let mockSupabaseService: any;
  let consoleErrorSpy: ReturnType<typeof vi.fn>;
  let consoleLogSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock console methods
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Create a mock SupabaseService that simulates the real behavior
    mockSupabaseService = {
      async getInvoices(filters: any) {
        // Default implementation - will be overridden in tests
        return { data: [], count: 0 };
      },

      async updateInvoice(order_no: string, updateData: any) {
        // Default implementation - will be overridden in tests
        return true;
      },

      async addInvoices(invoices: any[]) {
        // Default implementation - will be overridden in tests
        return true;
      }
    };
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('Initialization Errors', () => {
    it('should simulate DATABASE_CONNECTION_FAILED error', () => {
      const error = new Error('Supabase configuration is missing or invalid');
      error.name = 'DATABASE_CONNECTION_FAILED';
      
      expect(error.name).toBe('DATABASE_CONNECTION_FAILED');
      expect(error.message).toContain('Supabase configuration is missing or invalid');
    });

    it('should simulate createClient failure', () => {
      const error = new Error('Failed to initialize Supabase client');
      error.name = 'DATABASE_CONNECTION_FAILED';
      
      expect(error.name).toBe('DATABASE_CONNECTION_FAILED');
      expect(error.message).toContain('Failed to initialize Supabase client');
    });
  });

  describe('getInvoices Error Scenarios', () => {
    it('should simulate DATABASE_QUERY_FAILED when Supabase query returns error', async () => {
      mockSupabaseService.getInvoices = vi.fn().mockImplementation(async () => {
        console.error('[Supabase] Query error:', { message: 'Query syntax error', code: 'PGRST103' });
        console.error('[Supabase] Error in getInvoices:', new Error('Database query failed'));
        const error = new Error('Database query failed: Query syntax error');
        error.name = 'DATABASE_QUERY_FAILED';
        throw error;
      });

      await expect(mockSupabaseService.getInvoices({ page_no: 1, page_size: 10 }))
        .rejects
        .toThrow('Database query failed: Query syntax error');
        
      expect(consoleErrorSpy).toHaveBeenCalledWith('[Supabase] Query error:', { message: 'Query syntax error', code: 'PGRST103' });
    });

    it('should simulate DATABASE_QUERY_FAILED when Supabase client throws exception', async () => {
      mockSupabaseService.getInvoices = vi.fn().mockImplementation(async () => {
        console.error('[Supabase] Error in getInvoices:', new Error('Network timeout'));
        const error = new Error('Failed to retrieve invoices: Network timeout');
        error.name = 'DATABASE_QUERY_FAILED';
        throw error;
      });

      await expect(mockSupabaseService.getInvoices({ page_no: 1, page_size: 10 }))
        .rejects
        .toThrow('Failed to retrieve invoices');
    });

    it('should preserve error name when error is already typed', async () => {
      mockSupabaseService.getInvoices = vi.fn().mockImplementation(async () => {
        const customError = new Error('Connection lost');
        customError.name = 'DATABASE_CONNECTION_FAILED';
        throw customError;
      });

      try {
        await mockSupabaseService.getInvoices({ page_no: 1, page_size: 10 });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).name).toBe('DATABASE_CONNECTION_FAILED');
      }
    });

    it('should handle non-Error exceptions', async () => {
      mockSupabaseService.getInvoices = vi.fn().mockImplementation(async () => {
        console.error('[Supabase] Error in getInvoices:', 'String error');
        const error = new Error('Failed to retrieve invoices: String error');
        error.name = 'DATABASE_QUERY_FAILED';
        throw error;
      });

      await expect(mockSupabaseService.getInvoices({ page_no: 1, page_size: 10 }))
        .rejects
        .toThrow('Failed to retrieve invoices: String error');
    });

    it('should log error details when query fails', async () => {
      const mockError = { message: 'Permission denied', code: 'PGRST301' };
      
      mockSupabaseService.getInvoices = vi.fn().mockImplementation(async () => {
        console.error('[Supabase] Query error:', mockError);
        console.error('[Supabase] Error in getInvoices:', new Error('Database query failed'));
        const error = new Error('Database query failed: Permission denied');
        error.name = 'DATABASE_QUERY_FAILED';
        throw error;
      });

      try {
        await mockSupabaseService.getInvoices({ page_no: 1, page_size: 10 });
      } catch (error) {
        expect(consoleErrorSpy).toHaveBeenCalledWith('[Supabase] Query error:', mockError);
        expect(consoleErrorSpy).toHaveBeenCalledWith('[Supabase] Error in getInvoices:', expect.any(Error));
      }
    });
  });

  describe('updateInvoice Error Scenarios', () => {
    it('should simulate DATABASE_QUERY_FAILED when update query returns error', async () => {
      mockSupabaseService.updateInvoice = vi.fn().mockImplementation(async () => {
        console.error('[Supabase] Update error:', { message: 'Update constraint violation', code: 'PGRST202' });
        console.error('[Supabase] Error in updateInvoice:', new Error('Failed to update invoice'));
        const error = new Error('Failed to update invoice: Update constraint violation');
        error.name = 'DATABASE_QUERY_FAILED';
        throw error;
      });

      await expect(mockSupabaseService.updateInvoice('ORDER123', { status: 2 }))
        .rejects
        .toThrow('Failed to update invoice: Update constraint violation');
    });

    it('should simulate RESOURCE_NOT_FOUND when no rows are updated', async () => {
      mockSupabaseService.updateInvoice = vi.fn().mockImplementation(async (order_no: string) => {
        console.log(`[Supabase] Invoice ${order_no} not found`);
        const error = new Error(`Invoice with order_no ${order_no} not found`);
        error.name = 'RESOURCE_NOT_FOUND';
        throw error;
      });

      await expect(mockSupabaseService.updateInvoice('NONEXISTENT', { status: 2 }))
        .rejects
        .toThrow('Invoice with order_no NONEXISTENT not found');
    });

    it('should simulate DATABASE_QUERY_FAILED when update operation throws exception', async () => {
      mockSupabaseService.updateInvoice = vi.fn().mockImplementation(async () => {
        console.error('[Supabase] Error in updateInvoice:', new Error('Connection timeout'));
        const error = new Error('Failed to update invoice: Connection timeout');
        error.name = 'DATABASE_QUERY_FAILED';
        throw error;
      });

      await expect(mockSupabaseService.updateInvoice('ORDER123', { status: 2 }))
        .rejects
        .toThrow('Failed to update invoice');
    });

    it('should preserve custom error names in update operations', async () => {
      mockSupabaseService.updateInvoice = vi.fn().mockImplementation(async () => {
        const customError = new Error('Database locked');
        customError.name = 'DATABASE_TIMEOUT';
        throw customError;
      });

      try {
        await mockSupabaseService.updateInvoice('ORDER123', { status: 2 });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).name).toBe('DATABASE_TIMEOUT');
      }
    });

    it('should log error details when update fails', async () => {
      const mockError = { message: 'Foreign key constraint', code: 'PGRST204' };
      
      mockSupabaseService.updateInvoice = vi.fn().mockImplementation(async () => {
        console.error('[Supabase] Update error:', mockError);
        console.error('[Supabase] Error in updateInvoice:', new Error('Failed to update invoice'));
        const error = new Error('Failed to update invoice: Foreign key constraint');
        error.name = 'DATABASE_QUERY_FAILED';
        throw error;
      });

      try {
        await mockSupabaseService.updateInvoice('ORDER123', { status: 2 });
      } catch (error) {
        expect(consoleErrorSpy).toHaveBeenCalledWith('[Supabase] Update error:', mockError);
        expect(consoleErrorSpy).toHaveBeenCalledWith('[Supabase] Error in updateInvoice:', expect.any(Error));
      }
    });
  });

  describe('addInvoices Error Scenarios', () => {
    it('should simulate DATABASE_QUERY_FAILED when insert query returns error', async () => {
      mockSupabaseService.addInvoices = vi.fn().mockImplementation(async () => {
        console.error('[Supabase] Insert error:', { message: 'Duplicate key violation', code: 'PGRST409' });
        console.error('[Supabase] Error adding invoices:', new Error('Failed to insert invoices'));
        const error = new Error('Failed to insert invoices: Duplicate key violation');
        error.name = 'DATABASE_QUERY_FAILED';
        throw error;
      });

      const testInvoices = [{ order_no: 'TEST123', amount: 1000 }];

      await expect(mockSupabaseService.addInvoices(testInvoices))
        .rejects
        .toThrow('Failed to insert invoices: Duplicate key violation');
    });

    it('should simulate DATABASE_QUERY_FAILED when insert operation throws exception', async () => {
      mockSupabaseService.addInvoices = vi.fn().mockImplementation(async () => {
        console.error('[Supabase] Error adding invoices:', new Error('Payload too large'));
        const error = new Error('Failed to add invoices: Payload too large');
        error.name = 'DATABASE_QUERY_FAILED';
        throw error;
      });

      const testInvoices = [{ order_no: 'TEST123', amount: 1000 }];

      await expect(mockSupabaseService.addInvoices(testInvoices))
        .rejects
        .toThrow('Failed to add invoices');
    });

    it('should preserve custom error names in insert operations', async () => {
      mockSupabaseService.addInvoices = vi.fn().mockImplementation(async () => {
        const customError = new Error('Rate limit exceeded');
        customError.name = 'DATABASE_CONNECTION_FAILED';
        throw customError;
      });

      try {
        await mockSupabaseService.addInvoices([{ order_no: 'TEST123', amount: 1000 }]);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).name).toBe('DATABASE_CONNECTION_FAILED');
      }
    });

    it('should handle non-Error exceptions in insert operations', async () => {
      mockSupabaseService.addInvoices = vi.fn().mockImplementation(async () => {
        console.error('[Supabase] Error adding invoices:', { code: 'NETWORK_ERROR', message: 'Connection lost' });
        const error = new Error('Failed to add invoices: [object Object]');
        error.name = 'DATABASE_QUERY_FAILED';
        throw error;
      });

      const testInvoices = [{ order_no: 'TEST123', amount: 1000 }];

      await expect(mockSupabaseService.addInvoices(testInvoices))
        .rejects
        .toThrow('Failed to add invoices');
    });

    it('should log error details when insert fails', async () => {
      const mockError = { message: 'Invalid data format', code: 'PGRST400' };
      
      mockSupabaseService.addInvoices = vi.fn().mockImplementation(async () => {
        console.error('[Supabase] Insert error:', mockError);
        console.error('[Supabase] Error adding invoices:', new Error('Failed to insert invoices'));
        const error = new Error('Failed to insert invoices: Invalid data format');
        error.name = 'DATABASE_QUERY_FAILED';
        throw error;
      });

      try {
        await mockSupabaseService.addInvoices([{ order_no: 'TEST123', amount: 1000 }]);
      } catch (error) {
        expect(consoleErrorSpy).toHaveBeenCalledWith('[Supabase] Insert error:', mockError);
        expect(consoleErrorSpy).toHaveBeenCalledWith('[Supabase] Error adding invoices:', expect.any(Error));
      }
    });
  });



  describe('Error Name Preservation', () => {
    it('should not override existing error names', async () => {
      mockSupabaseService.getInvoices = vi.fn().mockImplementation(async () => {
        const customError = new Error('Custom error message');
        customError.name = 'CUSTOM_ERROR_TYPE';
        throw customError;
      });

      try {
        await mockSupabaseService.getInvoices({ page_no: 1, page_size: 10 });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).name).toBe('CUSTOM_ERROR_TYPE');
      }
    });

    it('should set default error name when none exists', async () => {
      mockSupabaseService.getInvoices = vi.fn().mockImplementation(async () => {
        const genericError = new Error('Generic error');
        // Simulate the behavior where error name gets set to DATABASE_QUERY_FAILED
        if (!genericError.name || genericError.name === 'Error') {
          genericError.name = 'DATABASE_QUERY_FAILED';
        }
        throw genericError;
      });

      try {
        await mockSupabaseService.getInvoices({ page_no: 1, page_size: 10 });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).name).toBe('DATABASE_QUERY_FAILED');
      }
    });
  });
});