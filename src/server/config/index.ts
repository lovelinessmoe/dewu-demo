import path from 'path';
import fs from 'fs';

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  logLevel: string;
  mockDataPath: string;
  staticPath?: string;
}

export interface TokenConfig {
  defaultExpiration: number;
  refreshExpiration: number;
  validClients: Array<{
    client_id: string;
    client_secret: string;
  }>;
}

export interface InvoiceConfig {
  defaultPageSize: number;
  maxPageSize: number;
  scenarios: string[];
}

export interface MerchantConfig {
  scenarios: string[];
}

export interface ResponseConfig {
  delayMs: number;
  errorRate: number;
}

export interface MockDataConfig {
  tokens: TokenConfig;
  invoices: InvoiceConfig;
  merchants: MerchantConfig;
  responses: ResponseConfig;
}

export interface AppConfig {
  server: ServerConfig;
  mockData: MockDataConfig;
}

class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;
  private configPath: string;

  private constructor() {
    this.configPath = this.resolveConfigPath();
    this.config = this.loadConfiguration();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private resolveConfigPath(): string {
    // Check for custom config path from environment
    const customPath = process.env.CONFIG_PATH;
    if (customPath && fs.existsSync(customPath)) {
      return customPath;
    }

    // Default to data directory config
    const defaultPath = path.resolve(process.cwd(), 'src/server/data/config.json');
    return defaultPath;
  }

  private loadConfiguration(): AppConfig {
    try {
      // Load server configuration from environment variables
      const serverConfig: ServerConfig = {
        port: parseInt(process.env.PORT || '3000', 10),
        nodeEnv: process.env.NODE_ENV || 'development',
        corsOrigin: process.env.CORS_ORIGIN || '*',
        logLevel: process.env.LOG_LEVEL || 'info',
        mockDataPath: process.env.MOCK_DATA_PATH || path.resolve(process.cwd(), 'src/server/data'),
        staticPath: process.env.STATIC_PATH
      };

      // Load mock data configuration from JSON file
      let mockDataConfig: MockDataConfig;
      
      if (fs.existsSync(this.configPath)) {
        const configFile = fs.readFileSync(this.configPath, 'utf-8');
        mockDataConfig = JSON.parse(configFile);
        
        // Override with environment variables if provided
        this.applyEnvironmentOverrides(mockDataConfig);
      } else {
        console.warn(`Configuration file not found at ${this.configPath}, using defaults`);
        mockDataConfig = this.getDefaultMockDataConfig();
      }

      return {
        server: serverConfig,
        mockData: mockDataConfig
      };
    } catch (error) {
      console.error('Failed to load configuration:', error);
      console.log('Using default configuration');
      return this.getDefaultConfiguration();
    }
  }

  private applyEnvironmentOverrides(config: MockDataConfig): void {
    // Token configuration overrides
    if (process.env.TOKEN_EXPIRATION) {
      config.tokens.defaultExpiration = parseInt(process.env.TOKEN_EXPIRATION, 10);
    }
    if (process.env.REFRESH_TOKEN_EXPIRATION) {
      config.tokens.refreshExpiration = parseInt(process.env.REFRESH_TOKEN_EXPIRATION, 10);
    }

    // Response configuration overrides
    if (process.env.RESPONSE_DELAY) {
      config.responses.delayMs = parseInt(process.env.RESPONSE_DELAY, 10);
    }
    if (process.env.ERROR_RATE) {
      const errorRate = parseFloat(process.env.ERROR_RATE);
      if (errorRate >= 0 && errorRate <= 1) {
        config.responses.errorRate = errorRate;
      }
    }

    // Invoice configuration overrides
    if (process.env.DEFAULT_PAGE_SIZE) {
      config.invoices.defaultPageSize = parseInt(process.env.DEFAULT_PAGE_SIZE, 10);
    }
    if (process.env.MAX_PAGE_SIZE) {
      config.invoices.maxPageSize = parseInt(process.env.MAX_PAGE_SIZE, 10);
    }
  }

  private getDefaultMockDataConfig(): MockDataConfig {
    return {
      tokens: {
        defaultExpiration: 7200, // 2 hours
        refreshExpiration: 2592000, // 30 days
        validClients: [
          {
            client_id: "test_client_id",
            client_secret: "test_client_secret"
          }
        ]
      },
      invoices: {
        defaultPageSize: 10,
        maxPageSize: 100,
        scenarios: ["default"]
      },
      merchants: {
        scenarios: ["default"]
      },
      responses: {
        delayMs: 100,
        errorRate: 0.02
      }
    };
  }

  private getDefaultConfiguration(): AppConfig {
    return {
      server: {
        port: 3000,
        nodeEnv: 'development',
        corsOrigin: '*',
        logLevel: 'info',
        mockDataPath: path.resolve(process.cwd(), 'src/server/data')
      },
      mockData: this.getDefaultMockDataConfig()
    };
  }

  public getConfig(): AppConfig {
    return this.config;
  }

  public getServerConfig(): ServerConfig {
    return this.config.server;
  }

  public getMockDataConfig(): MockDataConfig {
    return this.config.mockData;
  }

  public reloadConfiguration(): void {
    console.log('Reloading configuration...');
    this.config = this.loadConfiguration();
    console.log('Configuration reloaded successfully');
  }

  public validateConfiguration(): boolean {
    try {
      const { server, mockData } = this.config;

      // Validate server configuration
      if (!server.port || server.port < 1 || server.port > 65535) {
        throw new Error('Invalid port number');
      }

      if (!server.mockDataPath || !fs.existsSync(server.mockDataPath)) {
        throw new Error(`Mock data path does not exist: ${server.mockDataPath}`);
      }

      // Validate mock data configuration
      if (mockData.tokens.defaultExpiration <= 0) {
        throw new Error('Token expiration must be positive');
      }

      if (mockData.responses.errorRate < 0 || mockData.responses.errorRate > 1) {
        throw new Error('Error rate must be between 0 and 1');
      }

      if (mockData.invoices.defaultPageSize <= 0 || mockData.invoices.maxPageSize <= 0) {
        throw new Error('Page sizes must be positive');
      }

      if (mockData.invoices.defaultPageSize > mockData.invoices.maxPageSize) {
        throw new Error('Default page size cannot exceed max page size');
      }

      return true;
    } catch (error) {
      console.error('Configuration validation failed:', error);
      return false;
    }
  }

  public getEnvironmentInfo(): Record<string, any> {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      configPath: this.configPath,
      environment: this.config.server.nodeEnv,
      port: this.config.server.port
    };
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();
export default configManager;