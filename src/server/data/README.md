# Mock Data Management System

This directory contains configuration and sample data files for the Dewu Mock API system that provides realistic mock data matching the official Dewu API specification.

## Overview

The mock data management system provides:
- **Realistic Chinese business data** (company names, addresses, phone numbers)
- **Dewu API specification compliance** (exact field names and formats)
- **Configurable test scenarios** for different testing needs
- **Automatic data generation** with realistic patterns
- **Token management** with proper expiration handling

## Files Structure

```
src/server/data/
├── config.json              # Main configuration file
├── invoices.json            # Sample invoice data (Dewu format)
├── merchants.json           # Sample merchant data
├── scenarios/               # Different test scenarios
│   ├── high_volume_invoices.json  # Large dataset for performance testing
│   ├── inactive_merchants.json    # Inactive merchant scenarios
│   └── empty_invoices.json        # Empty dataset for edge cases
└── README.md               # This file
```

## Configuration (config.json)

### Token Configuration
- `defaultExpiration`: Access token lifetime (31536000 = 1 year, matching Dewu spec)
- `refreshExpiration`: Refresh token lifetime (31536000 = 1 year, matching Dewu spec)
- `validClients`: Array of valid client credentials for OAuth2 testing

### Invoice Configuration
- `defaultPageSize`: Default items per page (10)
- `maxPageSize`: Maximum allowed page size (100)
- `scenarios`: Available data scenarios for testing

### Response Configuration
- `delayMs`: Network latency simulation (100ms)
- `errorRate`: Random error probability for testing (0.02 = 2%)

## Data Format (Dewu Specification)

### Invoice Data Structure
Each invoice follows the exact Dewu API format:

```json
{
  "invoice_title": "得物科技有限公司",
  "seller_reject_reason": "",
  "verify_time": "2024-10-15 14:30:25",
  "category_type": 1,
  "order_time": "2024-10-10 09:15:30",
  "invoice_image_url": "https://example.com/invoice/img_001.jpg",
  "bank_name": "中国银行",
  "invoice_type": 1,
  "company_address": "上海市普陀区交通局888号",
  "article_number": "iPhone 14-黑色",
  "bidding_price": 25900,
  "spu_id": 12345,
  "invoice_title_type": 2,
  "spu_title": "【现货发售】Apple iPhone 14 黑色 全网通双卡双待5G手机",
  "bank_account": "开户银行账号123456789",
  "status": 0,
  "upload_time": "2024-10-12 16:20:15",
  "apply_time": "2024-10-11 10:45:20",
  "company_phone": "021-88888888",
  "handle_flag": 1,
  "amount": 25900,
  "seller_post": {
    "express_no": "SF1301946631496",
    "take_end_time": "2024-10-16 11:00:00",
    "sender_name": "张三",
    "take_start_time": "2024-10-16 10:00:00",
    "logistics_name": "顺丰速运",
    "sender_full_address": "上海市普陀区交通局888号"
  },
  "sku_id": 67890,
  "reject_time": "",
  "order_no": "11001232435",
  "properties": "官方标配 128GB",
  "tax_number": "91310000123456789X",
  "reject_reason": "",
  "seller_post_appointment": false
}
```

### Invoice Status Codes (Dewu Format)
- `0`: 卖家待处理 (Seller pending)
- `1`: 运营审核中 (Under operations review)
- `2`: 运营审核通过 (Operations approved)
- `3`: 运营已驳回 (Operations rejected)
- `4`: 买家已取消 (Buyer cancelled)
- `5`: 卖家已驳回 (Seller rejected)
- `6`: 待买家处理 (Buyer pending)

### OAuth2 Token Response (Dewu Format)
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "scope": ["all"],
    "open_id": "GvAzWrxfFjIPrJ23",
    "access_token": "eZiyEQtzqtsU6PnmaxjqgCeRS4tW6KbacMbKBQFp1lVGGIoC5nJUoKZyMLDmdY",
    "access_token_expires_in": 31536000,
    "refresh_token": "rhsO0MhPdHg7obr5104L8EEmhIHUQ4g1x8KHlZvuJwFi03nRzWgMDxMTfIIwlR",
    "refresh_token_expires_in": 31536000
  },
  "status": 200
}
```

### Merchant Info Response (Dewu Format)
```json
{
  "domain": "",
  "code": 200,
  "msg": "success",
  "data": {
    "merchant_id": "GvAzWrxfFjIPrJ23",
    "type_id": "AbCdEfGhIjKl"
  },
  "errors": []
}
```

## Test Scenarios

### Default Scenario (invoices.json)
Mixed invoice statuses with realistic Chinese business data for general testing.

### High Volume Scenario
Large datasets for performance and pagination testing.

### Empty Scenario
Empty datasets for edge case and error handling testing.

### Inactive Merchants
Merchants with inactive status for testing error conditions.

## Realistic Data Features

- **Chinese Company Names**: 得物科技有限公司, 上海潮流科技, etc.
- **Authentic Addresses**: Real Chinese city addresses with proper formatting
- **Valid Phone Numbers**: Chinese phone number formats (021-88888888)
- **Realistic Products**: Apple devices with Chinese product descriptions
- **Proper Tax Numbers**: Valid Chinese tax number format (91XXXXXXXXXXXXXXXXX)
- **Logistics Companies**: Real Chinese logistics companies (顺丰速运, 圆通快递)
- **Bank Names**: Major Chinese banks (中国银行, 工商银行)

## Usage in Code

### Basic Usage
```typescript
import { MockDataManager } from '../utils/mockDataManager.js';

const manager = MockDataManager.getInstance();

// Generate OAuth2 token
const tokenResponse = await manager.generateToken(
  'test_client_id', 
  'test_client_secret', 
  'auth_code'
);

// Get invoice list with pagination
const invoices = await manager.getInvoiceList(
  accessToken, 
  1,    // page number
  10,   // page size
  0     // status filter (optional)
);

// Handle invoice processing
const result = await manager.handleInvoice(
  accessToken,
  'order_no',
  1  // operation_type: 1=approve, 2=reject
);

// Get merchant info
const merchantInfo = await manager.getMerchantInfo(accessToken);
```

### Data Generation
```typescript
import { MockDataGenerator } from '../utils/mockDataGenerator.js';

// Generate single invoice item
const invoice = MockDataGenerator.generateInvoiceItem();

// Generate multiple invoices
const invoices = MockDataGenerator.generateInvoiceItems(50);

// Generate token response
const token = MockDataGenerator.generateTokenResponse();

// Generate merchant response
const merchant = MockDataGenerator.generateMerchantInfoResponse();
```

## Customization

1. **Add Custom Scenarios**: Create new JSON files in `scenarios/` directory
2. **Modify Configuration**: Edit `config.json` for different behaviors
3. **Update Sample Data**: Modify existing JSON files
4. **Generate New Data**: Use MockDataGenerator for programmatic creation

## Data Reloading

Reload data without restarting the server:

```typescript
const manager = MockDataManager.getInstance();
manager.reloadData();
```

This is useful during development when modifying JSON files.