import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InvoiceItem, ApiErrorCode, HttpStatusCode, generateTraceId, mapDatabaseError } from '../types/index';

export class SupabaseService {
  private static instance: SupabaseService;
  private supabase!: SupabaseClient;

  private constructor() {
    this.initializeSupabase();
  }

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  private initializeSupabase(): void {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://your-project.supabase.co') {
      const error = new Error('Supabase configuration is missing or invalid. Please check SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
      error.name = 'DATABASE_CONNECTION_FAILED';
      throw error;
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      console.log('[Supabase] Service initialized successfully');
      console.log('[Supabase] URL:', supabaseUrl);
    } catch (error) {
      console.error('[Supabase] Failed to initialize:', error);
      const dbError = new Error(`Failed to initialize Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`);
      dbError.name = 'DATABASE_CONNECTION_FAILED';
      throw dbError;
    }
  }

  public async getInvoices(filters: {
    page_no?: number;
    page_size?: number;
    spu_id?: number;
    status?: number;
    order_no?: string;
    apply_start_time?: string;
    apply_end_time?: string;
    invoice_title_type?: number;
  }): Promise<{ data: InvoiceItem[]; count: number }> {
    try {
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

      // Build query with consistent sorting
      let query = this.supabase.from('invoices').select('*', { count: 'exact' });

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

      // Add consistent sorting (ORDER BY upload_time DESC)
      query = query.order('upload_time', { ascending: false });

      // Add pagination
      query = query.range(offset, offset + pageSizeNum - 1);

      // Execute query
      const { data, error, count } = await query;

      if (error) {
        console.error('[Supabase] Query error:', error);
        const dbError = new Error(`Database query failed: ${error.message}`);
        dbError.name = 'DATABASE_QUERY_FAILED';
        throw dbError;
      }

      console.log(`[Supabase] Query successful: ${data?.length || 0} items, total: ${count}`);
      return { data: data || [], count: count || 0 };

    } catch (error) {
      console.error('[Supabase] Error in getInvoices:', error);
      if (error instanceof Error) {
        // Preserve the error type if it's already set
        if (!error.name || error.name === 'Error') {
          error.name = 'DATABASE_QUERY_FAILED';
        }
        throw error;
      }
      const dbError = new Error(`Failed to retrieve invoices: ${error}`);
      dbError.name = 'DATABASE_QUERY_FAILED';
      throw dbError;
    }
  }

  public async updateInvoice(order_no: string, updateData: Partial<InvoiceItem>): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('invoices')
        .update(updateData)
        .eq('order_no', order_no)
        .select();

      if (error) {
        console.error('[Supabase] Update error:', error);
        const dbError = new Error(`Failed to update invoice: ${error.message}`);
        dbError.name = 'DATABASE_QUERY_FAILED';
        throw dbError;
      }

      if (data && data.length > 0) {
        console.log(`[Supabase] Successfully updated invoice ${order_no}`);
        return true;
      } else {
        console.log(`[Supabase] Invoice ${order_no} not found`);
        const notFoundError = new Error(`Invoice with order_no ${order_no} not found`);
        notFoundError.name = 'RESOURCE_NOT_FOUND';
        throw notFoundError;
      }

    } catch (error) {
      console.error('[Supabase] Error in updateInvoice:', error);
      if (error instanceof Error) {
        // Preserve the error type if it's already set
        if (!error.name || error.name === 'Error') {
          error.name = 'DATABASE_QUERY_FAILED';
        }
        throw error;
      }
      const dbError = new Error(`Failed to update invoice: ${error}`);
      dbError.name = 'DATABASE_QUERY_FAILED';
      throw dbError;
    }
  }

  public async addInvoices(invoices: InvoiceItem[]): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('invoices')
        .insert(invoices)
        .select();

      if (error) {
        console.error('[Supabase] Insert error:', error);
        const dbError = new Error(`Failed to insert invoices: ${error.message}`);
        dbError.name = 'DATABASE_QUERY_FAILED';
        throw dbError;
      }

      console.log(`[Supabase] Successfully inserted ${data?.length || 0} invoices`);
      return true;
    } catch (error) {
      console.error('[Supabase] Error adding invoices:', error);
      if (error instanceof Error) {
        // Preserve the error type if it's already set
        if (!error.name || error.name === 'Error') {
          error.name = 'DATABASE_QUERY_FAILED';
        }
        throw error;
      }
      const dbError = new Error(`Failed to add invoices: ${error}`);
      dbError.name = 'DATABASE_QUERY_FAILED';
      throw dbError;
    }
  }


}

export const supabaseService = SupabaseService.getInstance();