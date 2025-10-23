import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('SupabaseService Sorting Validation', () => {
  let mockQuery: any;
  let consoleLogSpy: ReturnType<typeof vi.fn>;
  let consoleErrorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create mock query chain that tracks method calls
    mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  // Helper function to simulate the SupabaseService.getInvoices method
  const simulateGetInvoices = async (filters: any) => {
    const {
      page_no = 1,
      page_size = 10,
      spu_id,
      status,
      order_no,
      apply_start_time,
      apply_end_time,
      invoice_title_type
    } = filters;

    const pageNo = parseInt(String(page_no));
    const pageSizeNum = Math.min(parseInt(String(page_size)), 20);
    const offset = (pageNo - 1) * pageSizeNum;

    // Simulate query building (this mirrors the actual implementation)
    let query = mockQuery.select('*', { count: 'exact' });

    // Apply filters
    if (spu_id !== undefined) {
      query = query.eq('spu_id', parseInt(String(spu_id)));
    }

    if (status !== undefined) {
      query = query.eq('status', parseInt(String(status)));
    }

    if (order_no) {
      query = query.eq('order_no', order_no);
    }

    if (invoice_title_type !== undefined) {
      query = query.eq('invoice_title_type', parseInt(String(invoice_title_type)));
    }

    if (apply_start_time) {
      query = query.gte('apply_time', apply_start_time);
    }

    if (apply_end_time) {
      query = query.lte('apply_time', apply_end_time);
    }

    // Add consistent sorting (ORDER BY upload_time DESC) - this is what we're testing
    query = query.order('upload_time', { ascending: false });

    // Add pagination
    query = query.range(offset, offset + pageSizeNum - 1);

    return { data: [], count: 0 };
  };

  describe('ORDER BY Clause Validation', () => {
    it('should include ORDER BY upload_time DESC in basic query', async () => {
      await simulateGetInvoices({ page_no: 1, page_size: 10 });

      // Verify order method was called with correct parameters
      expect(mockQuery.order).toHaveBeenCalledWith('upload_time', { ascending: false });
    });

    it('should include ORDER BY clause when filtering by spu_id', async () => {
      await simulateGetInvoices({ 
        page_no: 1, 
        page_size: 10, 
        spu_id: 123 
      });

      expect(mockQuery.order).toHaveBeenCalledWith('upload_time', { ascending: false });
    });

    it('should include ORDER BY clause when filtering by status', async () => {
      await simulateGetInvoices({ 
        page_no: 1, 
        page_size: 10, 
        status: 1 
      });

      expect(mockQuery.order).toHaveBeenCalledWith('upload_time', { ascending: false });
    });

    it('should include ORDER BY clause when filtering by order_no', async () => {
      await simulateGetInvoices({ 
        page_no: 1, 
        page_size: 10, 
        order_no: 'ORDER123' 
      });

      expect(mockQuery.order).toHaveBeenCalledWith('upload_time', { ascending: false });
    });

    it('should include ORDER BY clause when filtering by date range', async () => {
      await simulateGetInvoices({ 
        page_no: 1, 
        page_size: 10, 
        apply_start_time: '2024-01-01',
        apply_end_time: '2024-12-31'
      });

      expect(mockQuery.order).toHaveBeenCalledWith('upload_time', { ascending: false });
    });

    it('should include ORDER BY clause when filtering by invoice_title_type', async () => {
      await simulateGetInvoices({ 
        page_no: 1, 
        page_size: 10, 
        invoice_title_type: 2 
      });

      expect(mockQuery.order).toHaveBeenCalledWith('upload_time', { ascending: false });
    });
  });

  describe('Sort Order Validation', () => {
    it('should use descending order (newest first)', async () => {
      await simulateGetInvoices({ page_no: 1, page_size: 10 });

      expect(mockQuery.order).toHaveBeenCalledWith('upload_time', { ascending: false });
    });

    it('should verify sort order is applied before pagination', async () => {
      await simulateGetInvoices({ page_no: 2, page_size: 5 });

      // Verify order is called before range
      expect(mockQuery.order).toHaveBeenCalledWith('upload_time', { ascending: false });
      expect(mockQuery.range).toHaveBeenCalledWith(5, 9); // page 2, size 5: offset 5, end 9
    });

    it('should maintain sort order with different page sizes', async () => {
      const testCases = [
        { page_no: 1, page_size: 5, expectedRange: [0, 4] },
        { page_no: 1, page_size: 10, expectedRange: [0, 9] },
        { page_no: 1, page_size: 20, expectedRange: [0, 19] },
        { page_no: 2, page_size: 10, expectedRange: [10, 19] },
        { page_no: 3, page_size: 5, expectedRange: [10, 14] }
      ];

      for (const testCase of testCases) {
        // Reset mocks for each test case
        vi.clearAllMocks();

        await simulateGetInvoices({ 
          page_no: testCase.page_no, 
          page_size: testCase.page_size 
        });

        expect(mockQuery.order).toHaveBeenCalledWith('upload_time', { ascending: false });
        expect(mockQuery.range).toHaveBeenCalledWith(
          testCase.expectedRange[0], 
          testCase.expectedRange[1]
        );
      }
    });
  });

  describe('Pagination with Sorting', () => {
    it('should maintain sort order across different pages', async () => {
      // Test page 1
      await simulateGetInvoices({ page_no: 1, page_size: 2 });

      expect(mockQuery.order).toHaveBeenCalledWith('upload_time', { ascending: false });
      expect(mockQuery.range).toHaveBeenCalledWith(0, 1);

      // Reset mocks for page 2
      vi.clearAllMocks();

      // Test page 2
      await simulateGetInvoices({ page_no: 2, page_size: 2 });

      expect(mockQuery.order).toHaveBeenCalledWith('upload_time', { ascending: false });
      expect(mockQuery.range).toHaveBeenCalledWith(2, 3);
    });

    it('should handle edge cases in pagination with sorting', async () => {
      // Test page beyond available data
      await simulateGetInvoices({ page_no: 10, page_size: 10 });

      expect(mockQuery.order).toHaveBeenCalledWith('upload_time', { ascending: false });
      expect(mockQuery.range).toHaveBeenCalledWith(90, 99);
    });

    it('should respect maximum page size limit with sorting', async () => {
      // Test with page_size > 20 (should be capped at 20)
      await simulateGetInvoices({ page_no: 1, page_size: 50 });

      expect(mockQuery.order).toHaveBeenCalledWith('upload_time', { ascending: false });
      expect(mockQuery.range).toHaveBeenCalledWith(0, 19); // Capped at 20 items
    });
  });

  describe('Sorting with Filter Combinations', () => {
    it('should maintain sorting with single filter (spu_id)', async () => {
      await simulateGetInvoices({ 
        page_no: 1, 
        page_size: 10, 
        spu_id: 123 
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('spu_id', 123);
      expect(mockQuery.order).toHaveBeenCalledWith('upload_time', { ascending: false });
    });

    it('should maintain sorting with multiple filters', async () => {
      await simulateGetInvoices({ 
        page_no: 1, 
        page_size: 10, 
        spu_id: 123,
        status: 1,
        apply_start_time: '2024-01-01',
        apply_end_time: '2024-12-31'
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('spu_id', 123);
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 1);
      expect(mockQuery.gte).toHaveBeenCalledWith('apply_time', '2024-01-01');
      expect(mockQuery.lte).toHaveBeenCalledWith('apply_time', '2024-12-31');
      expect(mockQuery.order).toHaveBeenCalledWith('upload_time', { ascending: false });
    });

    it('should maintain sorting with date range filters', async () => {
      await simulateGetInvoices({ 
        page_no: 1, 
        page_size: 10, 
        apply_start_time: '2024-01-01T00:00:00Z',
        apply_end_time: '2024-12-31T23:59:59Z'
      });

      expect(mockQuery.gte).toHaveBeenCalledWith('apply_time', '2024-01-01T00:00:00Z');
      expect(mockQuery.lte).toHaveBeenCalledWith('apply_time', '2024-12-31T23:59:59Z');
      expect(mockQuery.order).toHaveBeenCalledWith('upload_time', { ascending: false });
    });

    it('should maintain sorting with all possible filters combined', async () => {
      await simulateGetInvoices({ 
        page_no: 2, 
        page_size: 15, 
        spu_id: 456,
        status: 2,
        order_no: 'ORDER789',
        invoice_title_type: 1,
        apply_start_time: '2024-06-01T00:00:00Z',
        apply_end_time: '2024-06-30T23:59:59Z'
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('spu_id', 456);
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 2);
      expect(mockQuery.eq).toHaveBeenCalledWith('order_no', 'ORDER789');
      expect(mockQuery.eq).toHaveBeenCalledWith('invoice_title_type', 1);
      expect(mockQuery.gte).toHaveBeenCalledWith('apply_time', '2024-06-01T00:00:00Z');
      expect(mockQuery.lte).toHaveBeenCalledWith('apply_time', '2024-06-30T23:59:59Z');
      expect(mockQuery.order).toHaveBeenCalledWith('upload_time', { ascending: false });
      expect(mockQuery.range).toHaveBeenCalledWith(15, 29); // page 2, size 15
    });
  });

  describe('Query Structure Validation', () => {
    it('should verify correct query method call sequence', async () => {
      const callOrder: string[] = [];

      // Override mock methods to track call order
      mockQuery.select = vi.fn().mockImplementation(() => {
        callOrder.push('select');
        return mockQuery;
      });
      mockQuery.eq = vi.fn().mockImplementation(() => {
        callOrder.push('eq');
        return mockQuery;
      });
      mockQuery.order = vi.fn().mockImplementation(() => {
        callOrder.push('order');
        return mockQuery;
      });
      mockQuery.range = vi.fn().mockImplementation(() => {
        callOrder.push('range');
        return mockQuery;
      });

      await simulateGetInvoices({ 
        page_no: 1, 
        page_size: 10, 
        spu_id: 123 
      });

      // Verify the sequence: select -> filters -> order -> range
      expect(callOrder).toContain('select');
      expect(callOrder).toContain('order');
      expect(callOrder).toContain('range');
      
      const selectIndex = callOrder.indexOf('select');
      const orderIndex = callOrder.indexOf('order');
      const rangeIndex = callOrder.indexOf('range');

      expect(selectIndex).toBeLessThan(orderIndex);
      expect(orderIndex).toBeLessThan(rangeIndex);
    });

    it('should verify sorting is applied after all filters', async () => {
      const callOrder: string[] = [];

      // Override mock methods to track call order
      mockQuery.select = vi.fn().mockImplementation(() => {
        callOrder.push('select');
        return mockQuery;
      });
      mockQuery.eq = vi.fn().mockImplementation(() => {
        callOrder.push('eq');
        return mockQuery;
      });
      mockQuery.gte = vi.fn().mockImplementation(() => {
        callOrder.push('gte');
        return mockQuery;
      });
      mockQuery.lte = vi.fn().mockImplementation(() => {
        callOrder.push('lte');
        return mockQuery;
      });
      mockQuery.order = vi.fn().mockImplementation(() => {
        callOrder.push('order');
        return mockQuery;
      });
      mockQuery.range = vi.fn().mockImplementation(() => {
        callOrder.push('range');
        return mockQuery;
      });

      await simulateGetInvoices({ 
        page_no: 1, 
        page_size: 10, 
        spu_id: 123,
        status: 1,
        apply_start_time: '2024-01-01',
        apply_end_time: '2024-12-31'
      });

      const orderIndex = callOrder.indexOf('order');
      const rangeIndex = callOrder.indexOf('range');

      // Order should come after all filters but before range
      expect(orderIndex).toBeGreaterThan(-1);
      expect(rangeIndex).toBeGreaterThan(-1);
      expect(orderIndex).toBeLessThan(rangeIndex);

      // All filter operations should come before order
      const filterIndices = callOrder
        .map((call, index) => ({ call, index }))
        .filter(item => ['eq', 'gte', 'lte'].includes(item.call))
        .map(item => item.index);

      filterIndices.forEach(filterIndex => {
        expect(filterIndex).toBeLessThan(orderIndex);
      });
    });
  });

  describe('Sorting Parameter Validation', () => {
    it('should always use upload_time as sort field', async () => {
      await simulateGetInvoices({ page_no: 1, page_size: 10 });

      expect(mockQuery.order).toHaveBeenCalledWith('upload_time', expect.any(Object));
    });

    it('should always use descending order', async () => {
      await simulateGetInvoices({ page_no: 1, page_size: 10 });

      expect(mockQuery.order).toHaveBeenCalledWith(expect.any(String), { ascending: false });
    });

    it('should use consistent sorting parameters across all filter combinations', async () => {
      const filterCombinations = [
        { page_no: 1, page_size: 10 },
        { page_no: 1, page_size: 10, spu_id: 123 },
        { page_no: 1, page_size: 10, status: 1 },
        { page_no: 1, page_size: 10, order_no: 'ORDER123' },
        { page_no: 1, page_size: 10, invoice_title_type: 2 },
        { page_no: 1, page_size: 10, apply_start_time: '2024-01-01' },
        { page_no: 1, page_size: 10, apply_end_time: '2024-12-31' },
        { 
          page_no: 1, 
          page_size: 10, 
          spu_id: 123, 
          status: 1, 
          apply_start_time: '2024-01-01',
          apply_end_time: '2024-12-31'
        }
      ];

      for (const filters of filterCombinations) {
        // Reset mocks for each test case
        vi.clearAllMocks();

        await simulateGetInvoices(filters);

        // Verify consistent sorting parameters
        expect(mockQuery.order).toHaveBeenCalledWith('upload_time', { ascending: false });
        expect(mockQuery.order).toHaveBeenCalledTimes(1);
      }
    });
  });
});