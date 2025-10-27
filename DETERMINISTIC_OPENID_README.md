# 确定性 open_id 生成功能

## 概述

在 OAuth2 Token 生成流程中，`open_id` 现在基于 `authorization_code` 和 `client_id` 通过 SHA256 哈希算法确定性生成，而不是随机生成。

## 主要改进

### 之前（随机生成）
```javascript
// ❌ 每次调用都生成不同的 open_id
const open_id = generateRandomString(16);
```

### 现在（确定性生成）
```javascript
// ✅ 相同的 authorization_code 总是生成相同的 open_id
const open_id = this._generateDeterministicOpenId(authorization_code, client_id);
```

## 实现原理

使用 SHA256 哈希算法：

```javascript
_generateDeterministicOpenId(authorization_code, client_id) {
  const crypto = require('crypto');
  
  const hash = crypto
    .createHash('sha256')
    .update(`${authorization_code}:${client_id}`)
    .digest('hex');
  
  return hash.substring(0, 16);
}
```

## 特性

1. **确定性**：相同的 `authorization_code` + `client_id` → 相同的 `open_id`
2. **唯一性**：不同的输入 → 不同的 `open_id`
3. **安全性**：无法从 `open_id` 反推原始数据
4. **无状态**：不需要存储映射关系

## 测试

### 单元测试

运行单元测试验证确定性生成：

```bash
node test-deterministic-openid.js
```

测试内容：
- ✓ 相同的 authorization_code 生成相同的 open_id
- ✓ 不同的 authorization_code 生成不同的 open_id
- ✓ 相同的 authorization_code 但不同的 client_id 生成不同的 open_id
- ✓ open_id 格式验证（16个十六进制字符）
- ✓ 多次调用一致性验证

### API 测试

启动服务器后运行 API 测试：

```bash
# 终端 1: 启动服务器
npm run dev

# 终端 2: 运行 API 测试
node test-oauth2-deterministic.js
```

测试内容：
- ✓ 相同请求生成相同的 open_id
- ✓ 不同 authorization_code 生成不同的 open_id
- ✓ refresh_token 刷新后 open_id 保持不变
- ✓ open_id 格式验证

## 使用示例

### 生成 Token

```bash
curl -X POST http://localhost:3000/api/v1/h5/passport/v1/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "test_client_123",
    "client_secret": "test_secret_456",
    "authorization_code": "FIXED_AUTH_CODE"
  }'
```

响应：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "scope": ["all"],
    "open_id": "6feded276f76553e",  // 确定性生成
    "access_token": "...",
    "access_token_expires_in": 3600,
    "refresh_token": "...",
    "refresh_token_expires_in": 2592000
  },
  "status": 200
}
```

### 验证确定性

使用相同的 `authorization_code` 再次请求，会得到相同的 `open_id`：

```bash
# 第二次请求（相同参数）
curl -X POST http://localhost:3000/api/v1/h5/passport/v1/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "test_client_123",
    "client_secret": "test_secret_456",
    "authorization_code": "FIXED_AUTH_CODE"
  }'

# open_id 仍然是: 6feded276f76553e
```

## 优势

### 1. 可预测性
- 便于调试和测试
- 可以预先知道某个 authorization_code 对应的 open_id

### 2. 幂等性
- 多次调用产生相同结果
- 避免重复授权产生多个用户身份

### 3. 无状态
- 不需要数据库存储 authorization_code → open_id 映射
- 完美适配 Serverless 环境（如 Vercel）

### 4. 分布式友好
- 多个服务器实例产生一致的结果
- 无需共享状态或同步

## 安全性

1. **单向性**：无法从 `open_id` 反推 `authorization_code`
2. **碰撞抵抗**：SHA256 提供足够的安全性
3. **客户端隔离**：不同 `client_id` 产生不同的 `open_id`

## 相关文件

- `src/shared/core/index.js` - 业务逻辑实现
- `docs/TOKEN_IMPLEMENTATION_GUIDE.md` - 详细技术文档
- `test-deterministic-openid.js` - 单元测试
- `test-oauth2-deterministic.js` - API 测试

## 注意事项

1. `authorization_code` 应该由授权服务器生成，具有足够的随机性
2. 相同的 `authorization_code` 应该只能使用一次（在实际 OAuth2 流程中）
3. 本实现适用于 Mock API，生产环境需要额外的安全措施

## 更新日志

- **2024-10-27**: 实现确定性 open_id 生成，替换随机生成方式
