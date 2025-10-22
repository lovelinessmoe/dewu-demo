// Simple test to verify mock data generation works
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Mock Data Files...\n');

// Test 1: Check if data files exist and are valid JSON
const dataPath = path.join(__dirname, '../data');

console.log('1. Testing Data Files:');

// Test invoices.json
try {
  const invoicesPath = path.join(dataPath, 'invoices.json');
  const invoicesData = JSON.parse(fs.readFileSync(invoicesPath, 'utf8'));
  console.log('✅ invoices.json:', {
    exists: true,
    itemCount: invoicesData.length,
    hasRequiredFields: invoicesData.length > 0 && 
      invoicesData[0].hasOwnProperty('order_no') &&
      invoicesData[0].hasOwnProperty('invoice_title') &&
      invoicesData[0].hasOwnProperty('seller_post')
  });
} catch (error) {
  console.log('❌ invoices.json:', error.message);
}

// Test merchants.json
try {
  const merchantsPath = path.join(dataPath, 'merchants.json');
  const merchantsData = JSON.parse(fs.readFileSync(merchantsPath, 'utf8'));
  console.log('✅ merchants.json:', {
    exists: true,
    itemCount: merchantsData.length,
    hasRequiredFields: merchantsData.length > 0 && 
      merchantsData[0].hasOwnProperty('merchant_id') &&
      merchantsData[0].hasOwnProperty('name')
  });
} catch (error) {
  console.log('❌ merchants.json:', error.message);
}

// Test config.json
try {
  const configPath = path.join(dataPath, 'config.json');
  const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log('✅ config.json:', {
    exists: true,
    hasTokens: !!configData.tokens,
    hasInvoices: !!configData.invoices,
    hasMerchants: !!configData.merchants,
    validClientsCount: configData.tokens?.validClients?.length || 0
  });
} catch (error) {
  console.log('❌ config.json:', error.message);
}

// Test scenario files
console.log('\n2. Testing Scenario Files:');

try {
  const scenariosPath = path.join(dataPath, 'scenarios');
  const files = fs.readdirSync(scenariosPath);
  console.log('✅ Scenario files found:', files.length);
  
  files.forEach(file => {
    if (file.endsWith('.json')) {
      try {
        const filePath = path.join(scenariosPath, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`  ✅ ${file}: ${Array.isArray(data) ? data.length : 'object'} items`);
      } catch (error) {
        console.log(`  ❌ ${file}: ${error.message}`);
      }
    }
  });
} catch (error) {
  console.log('❌ Scenarios directory:', error.message);
}

console.log('\n🎉 Mock Data Files Test Complete!');