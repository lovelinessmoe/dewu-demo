import fs from 'fs';
import path from 'path';

export interface EnvironmentConfig {
  [key: string]: string | undefined;
}

class EnvironmentManager {
  private static instance: EnvironmentManager;
  private envConfig: EnvironmentConfig = {};
  private envFilePath: string;

  private constructor() {
    this.envFilePath = this.findEnvFile();
    this.loadEnvironmentFile();
  }

  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }

  private findEnvFile(): string {
    const possiblePaths = [
      path.resolve(process.cwd(), '.env'),
      path.resolve(process.cwd(), '.env.local'),
      path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`),
      path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}.local`)
    ];

    for (const envPath of possiblePaths) {
      if (fs.existsSync(envPath)) {
        return envPath;
      }
    }

    return path.resolve(process.cwd(), '.env');
  }

  private loadEnvironmentFile(): void {
    try {
      if (fs.existsSync(this.envFilePath)) {
        const envContent = fs.readFileSync(this.envFilePath, 'utf-8');
        this.parseEnvironmentContent(envContent);
        console.log(`Environment file loaded: ${this.envFilePath}`);
      } else {
        console.log('No environment file found, using system environment variables only');
      }
    } catch (error) {
      console.warn('Failed to load environment file:', error);
    }
  }

  private parseEnvironmentContent(content: string): void {
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex === -1) {
        continue;
      }

      const key = trimmedLine.substring(0, equalIndex).trim();
      let value = trimmedLine.substring(equalIndex + 1).trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // Only set if not already in process.env (process.env takes precedence)
      if (!process.env[key]) {
        process.env[key] = value;
      }
      
      this.envConfig[key] = value;
    }
  }

  public getEnvironmentVariable(key: string, defaultValue?: string): string | undefined {
    return process.env[key] || this.envConfig[key] || defaultValue;
  }

  public getAllEnvironmentVariables(): EnvironmentConfig {
    return { ...this.envConfig, ...process.env };
  }

  public createSampleEnvFile(): void {
    const sampleEnvPath = path.resolve(process.cwd(), '.env.example');
    const sampleContent = `# Dewu Mock API Environment Configuration

# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
LOG_LEVEL=info

# Mock Data Configuration
MOCK_DATA_PATH=./src/server/data
CONFIG_PATH=./src/server/data/config.json

# Profile Configuration
CONFIG_PROFILE=development

# Token Configuration Overrides
TOKEN_EXPIRATION=7200
REFRESH_TOKEN_EXPIRATION=2592000

# Response Configuration Overrides
RESPONSE_DELAY=100
ERROR_RATE=0.02

# Pagination Configuration Overrides
DEFAULT_PAGE_SIZE=10
MAX_PAGE_SIZE=100

# Static Files (for production)
STATIC_PATH=./dist/client

# Development Configuration
DEV_CLIENT_ID=dev_client_id
DEV_CLIENT_SECRET=dev_client_secret

# Production Configuration
PROD_CLIENT_ID=prod_client_id
PROD_CLIENT_SECRET=prod_client_secret
`;

    try {
      fs.writeFileSync(sampleEnvPath, sampleContent);
      console.log(`Sample environment file created: ${sampleEnvPath}`);
    } catch (error) {
      console.error('Failed to create sample environment file:', error);
    }
  }

  public validateRequiredVariables(requiredVars: string[]): boolean {
    const missing: string[] = [];
    
    for (const varName of requiredVars) {
      if (!this.getEnvironmentVariable(varName)) {
        missing.push(varName);
      }
    }

    if (missing.length > 0) {
      console.error('Missing required environment variables:', missing);
      return false;
    }

    return true;
  }

  public getConfigurationSummary(): Record<string, any> {
    const relevantVars = [
      'NODE_ENV',
      'PORT',
      'CORS_ORIGIN',
      'LOG_LEVEL',
      'MOCK_DATA_PATH',
      'CONFIG_PROFILE',
      'TOKEN_EXPIRATION',
      'RESPONSE_DELAY',
      'ERROR_RATE'
    ];

    const summary: Record<string, any> = {};
    
    for (const varName of relevantVars) {
      const value = this.getEnvironmentVariable(varName);
      if (value !== undefined) {
        summary[varName] = value;
      }
    }

    return summary;
  }

  public reloadEnvironment(): void {
    console.log('Reloading environment configuration...');
    this.envConfig = {};
    this.loadEnvironmentFile();
    console.log('Environment configuration reloaded');
  }
}

// Export singleton instance
export const environmentManager = EnvironmentManager.getInstance();
export default environmentManager;