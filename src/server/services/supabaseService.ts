import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InvoiceItem } from '../types/index';

export class SupabaseService {
  private static instance: SupabaseService;
  private supabase: SupabaseClient | null = null;
  private isAvailable: boolean = false;

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

    if (supabaseUrl && supabaseKey && supabaseUrl !== 'https://your-project.supabase.co') {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.isAvailable = true;
        console.log('[Supabase] Service initialized successfully');
        console.log('[Supabase] URL:', supabaseUrl);
      } catch (error) {
        console.error('[Supabase] Failed to initialize:', error);
        this.isAvailable = false;
      }
    } else {
      console.log('[Supabase] Not configured, using fallback data');
      this.isAvailable = false;
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
  }): Promise<{ data: InvoiceItem[]; count: number } | null> {
    if (!this.isAvailable || !this.supabase) {
      return null;
    }

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

      // Build query
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

      // Add pagination
      query = query.range(offset, offset + pageSizeNum - 1);

      // Execute query
      const { data, error, count } = await query;

      if (error) {
        console.error('[Supabase] Query error:', error);
        return null;
      }

      console.log(`[Supabase] Query successful: ${data?.length || 0} items, total: ${count}`);
      return { data: data || [], count: count || 0 };

    } catch (error) {
      console.error('[Supabase] Error in getInvoices:', error);
      return null;
    }
  }

  public async updateInvoice(order_no: string, updateData: Partial<InvoiceItem>): Promise<boolean> {
    if (!this.isAvailable || !this.supabase) {
      return false;
    }

    try {
      const { data, error } = await this.supabase
        .from('invoices')
        .update(updateData)
        .eq('order_no', order_no)
        .select();

      if (error) {
        console.error('[Supabase] Update error:', error);
        return false;
      }

      if (data && data.length > 0) {
        console.log(`[Supabase] Successfully updated invoice ${order_no}`);
        return true;
      } else {
        console.log(`[Supabase] Invoice ${order_no} not found`);
        return false;
      }

    } catch (error) {
      console.error('[Supabase] Error in updateInvoice:', error);
      return false;
    }
  }

  public async initializeData(mockData: InvoiceItem[]): Promise<boolean> {
    if (!this.isAvailable || !this.supabase) {
      return false;
    }

    try {
      // Check if data already exists
      const { data: existingInvoices, error } = await this.supabase
        .from('invoices')
        .select('*')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.log('[Supabase] Table does not exist, skipping initialization');
        return false;
      }

      if (existingInvoices && existingInvoices.length > 0) {
        console.log('[Supabase] Data already exists, skipping initialization');
        return true;
      }

      // Insert initial data
      console.log('[Supabase] Inserting initial data...');
      const { error: insertError } = await this.supabase
        .from('invoices')
        .insert(mockData);

      if (insertError) {
        console.error('[Supabase] Error inserting data:', insertError);
        return false;
      }

      console.log('[Supabase] Initial data inserted successfully');
      return true;

    } catch (error) {
      console.error('[Supabase] Error in initializeData:', error);
      return false;
    }
  }

  public isSupabaseAvailable(): boolean {
    return this.isAvailable;
  }
}

export const supabaseService = SupabaseService.getInstance();