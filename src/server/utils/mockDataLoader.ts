import fs from 'fs';
import path from 'path';
import { 
  TokenResponse, 
  InvoiceItem, 
  InvoiceListResponse, 
  MerchantInfoResponse,
  ErrorResponse,
  Invoice,
  MerchantInfo,
  ErrorCodes
} from '../types/index';
import { MockDataGenerator } from './mockDataGenerator';

export interface MockDataConfig {
  tokens: {
    defaultExpiration: number;
    refreshExpiration: number;
    validClients: Array<{
      client_id: string;
      client_secret: string;
    }>;
  };
  invoices: {
    defaultPageSize: number;
    maxPageSize: number;
    scenarios: string[];
  };
  merchants: {
    scenarios: string[];
  };
  responses: {
    delayMs?: number;
    errorRate?: number;
  };
}

export interface MockDataStore {
  config: MockDataConfig;
  invoices: InvoiceItem[];
  merchants: MerchantInfo[];
  tokens: Map<string, { expires_at: number; open_id: string; refresh_token: string }>;
}

/**
 * Mock data loader that manages configuration and sample data from JSON files
 */
export class MockDataLoader {
  private static instance: MockDataLoader;
  private dataStore: MockDataStore;
  private dataPath: string;

  private constructor(dataPath: string = './src/server/data') {
    this.dataPath = dataPath;
    this.dataStore = {
      config: this.getDefaultConfig(),
      invoices: [],
      merchants: [],
      tokens: new Map()
    };
    this.loadData();
  }

  static getInstance(dataPath?: string): MockDataLoader {
    if (!MockDataLoader.instance) {
      MockDataLoader.instance = new MockDataLoader(dataPath);
    }
    return MockDataLoader.instance;
  }

  /**
   * Load all mock data from JSON files
   */
  private loadData(): void {
    try {
      this.loadConfig();
      this.loadInvoices();
      this.loadMerchants();
      console.log('Mock data loaded successfully');
    } catch (error) {
      console.warn('Failed to load some mock data files, using generated data:', error);
      this.generateFallbackData();
    }
  }

  /**
   * Load configuration from config.json
   */
  private loadConfig(): void {
    const configPath = path.join(this.dataPath, 'config.json');
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      this.dataStore.config = { ...this.getDefaultConfig(), ...JSON.parse(configData) };
    }
  }

  /**
   * Load invoices from invoices.json or generate them
   */
  private loadInvoices(): void {
    const invoicesPath = path.join(this.dataPath, 'invoices.json');
    if (fs.existsSync(invoicesPath)) {
      const invoicesData = fs.readFileSync(invoicesPath, 'utf8');
      // Convert old format to new Dewu format if needed
      const rawInvoices = JSON.parse(invoicesData);
      if (rawInvoices.length > 0 && rawInvoices[0].invoice_id) {
        // Old format detected, generate new format
        this.dataStore.invoices = MockDataGenerator.generateInvoiceItems(50);
      } else {
        this.dataStore.invoices = rawInvoices;
      }
    } else {
      // Generate sample invoices if file doesn't exist
      this.dataStore.invoices = MockDataGenerator.generateInvoiceItems(50);
    }
  }

  /**
   * Load merchants from merchants.json or generate them
   */
  private loadMerchants(): void {
    const merchantsPath = path.join(this.dataPath, 'merchants.json');
    if (fs.existsSync(merchantsPath)) {
      const merchantsData = fs.readFileSync(merchantsPath, 'utf8');
      this.dataStore.merchants = JSON.parse(merchantsData);
    } else {
      // Generate sample merchants if file doesn't exist
      this.dataStore.merchants = Array.from({ length: 10 }, () => MockDataGenerator.generateMerchantInfo());
    }
  }

  /**
   * Generate fallback data when JSON files are not available
   */
  private generateFallbackData(): void {
    this.dataStore.invoices = MockDataGenerator.generateInvoiceItems(50);
    this.dataStore.merchants = Array.from({ length: 10 }, () => ({
      merchant_id: `merchant_${Math.random().toString(36).substr(2, 9)}`,
      name: `Test Merchant ${Math.floor(Math.random() * 100)}`,
      status: Math.random() > 0.2 ? 'active' : 'inactive',
      created_at: new Date().toISOString(),
      contact_info: {
        email: `test${Math.floor(Math.random() * 1000)}@example.com`,
        phone: `+86-138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`
      }
    }));
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): MockDataConfig {
    return {
      tokens: {
        defaultExpiration: 7200, // 2 hours
        refreshExpiration: 2592000, // 30 days
        validClients: [
          { client_id: 'test_client_id', client_secret: 'test_client_secret' },
          { client_id: 'demo_client_id', client_secret: 'demo_client_secret' }
        ]
      },
      invoices: {
        defaultPageSize: 10,
        maxPageSize: 100,
        scenarios: ['default', 'high_volume', 'error_prone']
      },
      merchants: {
        scenarios: ['default', 'inactive_merchants', 'new_merchants']
      },
      responses: {
        delayMs: 100,
        errorRate: 0.05 // 5% error rate for testing
      }
    };
  }

  /**
   * Validate client credentials
   */
  validateClient(clientId: string, clientSecret: string): boolean {
    return this.dataStore.config.tokens.validClients.some(
      client => client.client_id === clientId && client.client_secret === clientSecret
    );
  }

  /**
   * Store access token
   */
  storeToken(accessToken: string, openId: string, refreshToken: string): void {
    const expiresAt = Date.now() + (this.dataStore.config.tokens.defaultExpiration * 1000);
    this.dataStore.tokens.set(accessToken, {
      expires_at: expiresAt,
      open_id: openId,
      refresh_token: refreshToken
    });
  }

  /**
   * Validate access token
   */
  validateToken(accessToken: string): { valid: boolean; openId?: string } {
    const tokenData = this.dataStore.tokens.get(accessToken);
    if (!tokenData) {
      return { valid: false };
    }

    if (Date.now() > tokenData.expires_at) {
      this.dataStore.tokens.delete(accessToken);
      return { valid: false };
    }

    return { valid: true, openId: tokenData.open_id };
  }

  /**
   * Validate refresh token
   */
  validateRefreshToken(refreshToken: string): { valid: boolean; accessToken?: string } {
    for (const [accessToken, tokenData] of this.dataStore.tokens.entries()) {
      if (tokenData.refresh_token === refreshToken) {
        return { valid: true, accessToken };
      }
    }
    return { valid: false };
  }

  /**
   * Get paginated invoices in Dewu format
   */
  getInvoices(pageNo: number = 1, pageSize: number = 10, status?: number): InvoiceListResponse {
    let filteredInvoices = this.dataStore.invoices;
    
    if (status !== undefined) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.status === status);
    }

    const startIndex = (pageNo - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

    return {
      trace_id: this.generateTraceId(),
      code: 200,
      msg: 'success',
      data: {
        page_no: pageNo,
        page_size: pageSize,
        total_results: filteredInvoices.length,
        list: paginatedInvoices
      }
    };
  }

  /**
   * Get invoice by order number
   */
  getInvoiceByOrderNo(orderNo: string): InvoiceItem | null {
    return this.dataStore.invoices.find(invoice => invoice.order_no === orderNo) || null;
  }

  /**
   * Update invoice status
   */
  updateInvoiceStatus(orderNo: string, status: number): boolean {
    const invoice = this.getInvoiceByOrderNo(orderNo);
    if (invoice) {
      invoice.status = status;
      invoice.verify_time = new Date().toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
      return true;
    }
    return false;
  }

  /**
   * Get merchant info by merchant ID
   */
  getMerchantInfo(merchantId?: string): MerchantInfo | null {
    if (merchantId) {
      return this.dataStore.merchants.find(merchant => merchant.merchant_id === merchantId) || null;
    }
    // Return first active merchant if no ID specified
    return this.dataStore.merchants.find(merchant => merchant.status === 'active') || this.dataStore.merchants[0] || null;
  }

  /**
   * Get all merchants
   */
  getAllMerchants(): MerchantInfo[] {
    return this.dataStore.merchants;
  }

  /**
   * Get configuration
   */
  getConfig(): MockDataConfig {
    return this.dataStore.config;
  }

  /**
   * Reload data from files
   */
  reloadData(): void {
    this.loadData();
  }

  /**
   * Add artificial delay for realistic API simulation
   */
  async simulateDelay(): Promise<void> {
    const delay = this.dataStore.config.responses.delayMs || 0;
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * Simulate random errors for testing error handling
   */
  shouldSimulateError(): boolean {
    const errorRate = this.dataStore.config.responses.errorRate || 0;
    return Math.random() < errorRate;
  }

  /**
   * Create error response
   */
  createErrorResponse(code: ErrorCodes, message: string, status: number = 400): ErrorResponse {
    return {
      code,
      msg: message,
      status
    };
  }

  /**
   * Generate trace ID for responses
   */
  private generateTraceId(): string {
    return Math.floor(Math.random() * 1000000000).toString();
  }

  /**
   * Static method to load invoices for use in controllers
   */
  static async loadInvoices(): Promise<InvoiceItem[]> {
    const loader = MockDataLoader.getInstance();
    return loader.dataStore.invoices;
  }
}