import { MockDataConfig } from './index';

export interface ConfigProfile {
  name: string;
  description: string;
  config: Partial<MockDataConfig>;
}

export const configProfiles: Record<string, ConfigProfile> = {
  development: {
    name: 'Development',
    description: 'Configuration optimized for development with detailed logging and fast responses',
    config: {
      responses: {
        delayMs: 50,
        errorRate: 0.05 // 5% error rate for testing error handling
      },
      tokens: {
        defaultExpiration: 3600, // 1 hour for faster testing
        refreshExpiration: 86400, // 1 day
        validClients: [
          {
            client_id: "dev_client_id",
            client_secret: "dev_client_secret"
          },
          {
            client_id: "test_client_id",
            client_secret: "test_client_secret"
          }
        ]
      },
      invoices: {
        defaultPageSize: 5, // Smaller pages for easier testing
        maxPageSize: 50,
        scenarios: ["default", "high_volume", "empty"]
      },
      merchants: {
        scenarios: ["default", "inactive_merchants"]
      }
    }
  },

  testing: {
    name: 'Testing',
    description: 'Configuration for automated testing with predictable behavior',
    config: {
      responses: {
        delayMs: 0, // No delay for faster tests
        errorRate: 0 // No random errors during tests
      },
      tokens: {
        defaultExpiration: 300, // 5 minutes for test scenarios
        refreshExpiration: 600, // 10 minutes
        validClients: [
          {
            client_id: "test_client_id",
            client_secret: "test_client_secret"
          }
        ]
      },
      invoices: {
        defaultPageSize: 3, // Small pages for testing pagination
        maxPageSize: 10,
        scenarios: ["default", "empty"]
      },
      merchants: {
        scenarios: ["default"]
      }
    }
  },

  production: {
    name: 'Production',
    description: 'Production-ready configuration with realistic timing and minimal errors',
    config: {
      responses: {
        delayMs: 200, // Realistic API response time
        errorRate: 0.01 // 1% error rate to simulate real-world conditions
      },
      tokens: {
        defaultExpiration: 7200, // 2 hours
        refreshExpiration: 2592000, // 30 days
        validClients: [
          {
            client_id: "prod_client_id",
            client_secret: "prod_client_secret"
          }
        ]
      },
      invoices: {
        defaultPageSize: 20,
        maxPageSize: 100,
        scenarios: ["default", "high_volume"]
      },
      merchants: {
        scenarios: ["default"]
      }
    }
  },

  demo: {
    name: 'Demo',
    description: 'Configuration for demonstrations with varied scenarios and moderate delays',
    config: {
      responses: {
        delayMs: 150,
        errorRate: 0.03 // 3% error rate to show error handling
      },
      tokens: {
        defaultExpiration: 1800, // 30 minutes
        refreshExpiration: 86400, // 1 day
        validClients: [
          {
            client_id: "demo_client_id",
            client_secret: "demo_client_secret"
          },
          {
            client_id: "showcase_client_id",
            client_secret: "showcase_client_secret"
          }
        ]
      },
      invoices: {
        defaultPageSize: 10,
        maxPageSize: 50,
        scenarios: ["default", "high_volume", "empty"]
      },
      merchants: {
        scenarios: ["default", "inactive_merchants"]
      }
    }
  },

  stress: {
    name: 'Stress Testing',
    description: 'Configuration for stress testing with high error rates and varied delays',
    config: {
      responses: {
        delayMs: 500, // Higher delay to simulate load
        errorRate: 0.15 // 15% error rate for stress testing
      },
      tokens: {
        defaultExpiration: 60, // 1 minute for rapid token cycling
        refreshExpiration: 300, // 5 minutes
        validClients: [
          {
            client_id: "stress_client_id",
            client_secret: "stress_client_secret"
          }
        ]
      },
      invoices: {
        defaultPageSize: 50,
        maxPageSize: 200,
        scenarios: ["default", "high_volume"]
      },
      merchants: {
        scenarios: ["default", "inactive_merchants"]
      }
    }
  }
};

export function getProfileConfig(profileName: string): ConfigProfile | null {
  return configProfiles[profileName] || null;
}

export function listAvailableProfiles(): string[] {
  return Object.keys(configProfiles);
}

export function mergeProfileWithBase(baseConfig: MockDataConfig, profile: ConfigProfile): MockDataConfig {
  return {
    tokens: { ...baseConfig.tokens, ...profile.config.tokens },
    invoices: { ...baseConfig.invoices, ...profile.config.invoices },
    merchants: { ...baseConfig.merchants, ...profile.config.merchants },
    responses: { ...baseConfig.responses, ...profile.config.responses }
  };
}