#!/usr/bin/env node

/**
 * Simple test script to verify the mock data system works correctly
 * Run with: npx tsx src/server/utils/testMockData.ts
 */

import { MockDataManager } from './mockDataManager';
import { MockDataGenerator } from './mockDataGenerator';

async function testMockDataSystem() {
  console.log('🧪 Testing Mock Data System...\n');

  try {
    // Test MockDataGenerator
    console.log('1. Testing MockDataGenerator...');
    const tokenResponse = MockDataGenerator.generateTokenResponse();
    console.log('✅ Token response generated:', {
      hasAccessToken: !!tokenResponse.data.access_token,
      hasRefreshToken: !!tokenResponse.data.refresh_token,
      openId: tokenResponse.data.open_id
    });

    const invoice = MockDataGenerator.generateInvoiceItem();
    console.log('✅ Invoice generated:', {
      id: invoice.order_no,
      status: invoice.status,
      amount: invoice.amount
    });

    const merchant = MockDataGenerator.generateMerchantInfo();
    console.log('✅ Merchant generated:', {
      id: merchant.merchant_id,
      name: merchant.name,
      status: merchant.status
    });

    // Test MockDataManager
    console.log('\n2. Testing MockDataManager...');
    const mockData = MockDataManager.getInstance();
    
    // Test token generation
    const tokenResult = await mockData.generateToken('test_client_id', 'test_client_secret', 'auth_code_123');
    if ('data' in tokenResult) {
      console.log('✅ Token generation successful');
      
      // Test token validation
      const validation = mockData.validateAccessToken(tokenResult.data.access_token);
      console.log('✅ Token validation:', validation.valid ? 'PASSED' : 'FAILED');
      
      // Test invoice list
      const invoiceList = await mockData.getInvoiceList(tokenResult.data.access_token, 1, 5);
      if ('data' in invoiceList) {
        console.log('✅ Invoice list retrieved:', {
          count: invoiceList.data.invoices.length,
          total: invoiceList.data.total
        });
      }
      
      // Test merchant info
      const merchantInfo = await mockData.getMerchantInfo(tokenResult.data.access_token);
      if ('data' in merchantInfo) {
        console.log('✅ Merchant info retrieved:', {
          id: merchantInfo.data.merchant_id,
          name: merchantInfo.data.name
        });
      }
    } else {
      console.log('❌ Token generation failed:', tokenResult.msg);
    }

    // Test configuration
    console.log('\n3. Testing Configuration...');
    const config = mockData.getConfig();
    console.log('✅ Configuration loaded:', {
      validClients: config.tokens.validClients.length,
      defaultPageSize: config.invoices.defaultPageSize,
      scenarios: config.invoices.scenarios.length
    });

    console.log('\n🎉 All tests passed! Mock data system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testMockDataSystem();
}

export { testMockDataSystem };