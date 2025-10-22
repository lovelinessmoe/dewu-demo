import { MockDataLoader } from './mockDataLoader';
import { MockDataGenerator } from './mockDataGenerator';
import { configManager } from '../config/index';
import { getProfileConfig, mergeProfileWithBase } from '../config/profiles';
import { environmentManager } from '../config/environment';
import { 
  TokenResponse, 
  InvoiceListResponse, 
  MerchantInfoResponse,
  ErrorResponse,
  ErrorCodes,
  InvoiceItem
} from '../types/index';

/**
 * Main mock data manager that provides a unified interface for all mock data operations
 */
export class MockDataManager {
  private static instance: MockDataManager;
  private loader: MockDataLoader;
  private currentProfile: string;

  private constructor() {
    this.loader = MockDataLoader.getInstance();
    this.currentProfile = environmentManager.getEnvironmentVariable('CONFIG_PROFILE', 'development') || 'development';
    this.applyConfigurationProfile();
  }

  static getInstance(): MockDataManager {
    if (!MockDataManager.instance) {
      MockDataManager.instance = new MockDataManager();
    }
    return MockDataManager.instance;
  }

  /**
   * Generate OAuth2 token response
   */
  async generateToken(clientId: string, clientSecret: string, authCode: string): Promise<TokenResponse | ErrorResponse> {
    await this.loader.simulateDelay();

    // Simulate random errors for testing
    if (this.loader.shouldSimulateError()) {
      return this.loader.createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Simulated server error',
        500
      );
    }

    // Validate client credentials
    if (!this.loader.validateClient(clientId, clientSecret)) {
      return this.loader.createErrorResponse(
        ErrorCodes.INVALID_CLIENT,
        'Invalid client credentials',
        401
      );
    }

    // Generate token response
    const tokenResponse = MockDataGenerator.generateTokenResponse();
    
    // Store token for future validation
    this.loader.storeToken(
      tokenResponse.data.access_token,
      tokenResponse.data.open_id,
      tokenResponse.data.refresh_token
    );

    return tokenResponse;
  }

  /**
   * Refresh OAuth2 token
   */
  async refreshToken(clientId: string, clientSecret: string, refreshToken: string): Promise<TokenResponse | ErrorResponse> {
    await this.loader.simulateDelay();

    // Validate client credentials
    if (!this.loader.validateClient(clientId, clientSecret)) {
      return this.loader.createErrorResponse(
        ErrorCodes.INVALID_CLIENT,
        'Invalid client credentials',
        401
      );
    }

    // Validate refresh token
    const refreshValidation = this.loader.validateRefreshToken(refreshToken);
    if (!refreshValidation.valid) {
      return this.loader.createErrorResponse(
        ErrorCodes.INVALID_REFRESH_TOKEN,
        'Invalid or expired refresh token',
        401
      );
    }

    // Generate new token response
    const tokenResponse = MockDataGenerator.generateTokenResponse();
    
    // Store new token
    this.loader.storeToken(
      tokenResponse.data.access_token,
      tokenResponse.data.open_id,
      tokenResponse.data.refresh_token
    );

    return tokenResponse;
  }

  /**
   * Validate access token
   */
  validateAccessToken(accessToken: string): { valid: boolean; openId?: string; error?: ErrorResponse } {
    const validation = this.loader.validateToken(accessToken);
    
    if (!validation.valid) {
      return {
        valid: false,
        error: this.loader.createErrorResponse(
          ErrorCodes.INVALID_TOKEN,
          'Invalid or expired access token',
          401
        )
      };
    }

    return { valid: true, openId: validation.openId };
  }

  /**
   * Get invoice list with pagination
   */
  async getInvoiceList(
    accessToken: string,
    pageNo: number = 1,
    pageSize: number = 10,
    status?: number
  ): Promise<InvoiceListResponse | ErrorResponse> {
    await this.loader.simulateDelay();

    // Validate access token
    const tokenValidation = this.validateAccessToken(accessToken);
    if (!tokenValidation.valid) {
      return tokenValidation.error!;
    }

    // Simulate random errors
    if (this.loader.shouldSimulateError()) {
      return this.loader.createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to retrieve invoices',
        500
      );
    }

    // Get invoices from loader
    return this.loader.getInvoices(pageNo, pageSize, status);
  }

  /**
   * Handle invoice processing
   */
  async handleInvoice(
    accessToken: string,
    orderNo: string,
    operationType: number
  ): Promise<any> {
    await this.loader.simulateDelay();

    // Validate access token
    const tokenValidation = this.validateAccessToken(accessToken);
    if (!tokenValidation.valid) {
      return tokenValidation.error!;
    }

    // Check if invoice exists
    const invoice = this.loader.getInvoiceByOrderNo(orderNo);
    if (!invoice) {
      return this.loader.createErrorResponse(
        ErrorCodes.INVOICE_NOT_FOUND,
        'Invoice not found',
        404
      );
    }

    // Update invoice status based on operation type
    let newStatus: number;
    switch (operationType) {
      case 1: // approve
        newStatus = 1; // 运营审核中
        break;
      case 2: // reject
        newStatus = 5; // 卖家已驳回
        break;
      default:
        return this.loader.createErrorResponse(
          ErrorCodes.BAD_REQUEST,
          'Invalid operation type',
          400
        );
    }

    // Update invoice
    const updated = this.loader.updateInvoiceStatus(orderNo, newStatus);
    if (!updated) {
      return this.loader.createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to update invoice',
        500
      );
    }

    return {
      trace_id: Math.floor(Math.random() * 1000000000).toString(),
      code: 200,
      msg: 'success',
      data: {}
    };
  }

  /**
   * Get merchant base info
   */
  async getMerchantInfo(accessToken: string): Promise<MerchantInfoResponse | ErrorResponse> {
    await this.loader.simulateDelay();

    // Validate access token
    const tokenValidation = this.validateAccessToken(accessToken);
    if (!tokenValidation.valid) {
      return tokenValidation.error!;
    }

    // Simulate random errors
    if (this.loader.shouldSimulateError()) {
      return this.loader.createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to retrieve merchant info',
        500
      );
    }

    // Generate merchant info response
    return MockDataGenerator.generateMerchantInfoResponse();
  }

  /**
   * Apply configuration profile
   */
  private applyConfigurationProfile(): void {
    const profile = getProfileConfig(this.currentProfile);
    if (profile) {
      const baseConfig = configManager.getMockDataConfig();
      const mergedConfig = mergeProfileWithBase(baseConfig, profile);
      
      // Update the configuration in the config manager
      configManager.getConfig().mockData = mergedConfig;
      
      console.log(`Applied configuration profile: ${profile.name}`);
    } else {
      console.warn(`Configuration profile '${this.currentProfile}' not found, using default configuration`);
    }
  }

  /**
   * Switch to a different configuration profile
   */
  switchProfile(profileName: string): boolean {
    const profile = getProfileConfig(profileName);
    if (!profile) {
      console.error(`Profile '${profileName}' not found`);
      return false;
    }

    this.currentProfile = profileName;
    this.applyConfigurationProfile();
    this.loader.reloadData();
    
    console.log(`Switched to configuration profile: ${profile.name}`);
    return true;
  }

  /**
   * Get current configuration profile
   */
  getCurrentProfile(): string {
    return this.currentProfile;
  }

  /**
   * Get configuration
   */
  getConfig() {
    return configManager.getMockDataConfig();
  }

  /**
   * Get full application configuration
   */
  getFullConfig() {
    return configManager.getConfig();
  }

  /**
   * Reload mock data from files
   */
  reloadData(): void {
    this.loader.reloadData();
  }

  /**
   * Get all available merchants (for testing purposes)
   */
  getAllMerchants() {
    return this.loader.getAllMerchants();
  }

  /**
   * Generate additional test data
   */
  generateTestData(type: 'invoices' | 'merchants', count: number = 10) {
    switch (type) {
      case 'invoices':
        return MockDataGenerator.generateInvoiceItems(count);
      case 'merchants':
        return Array.from({ length: count }, () => ({
          merchant_id: `merchant_${Math.random().toString(36).substr(2, 9)}`,
          name: `Test Merchant ${Math.floor(Math.random() * 100)}`,
          status: Math.random() > 0.2 ? 'active' : 'inactive',
          created_at: new Date().toISOString(),
          contact_info: {
            email: `test${Math.floor(Math.random() * 1000)}@example.com`,
            phone: `+86-138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`
          }
        }));
      default:
        throw new Error(`Unknown data type: ${type}`);
    }
  }
}