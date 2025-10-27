# 更新日志 - 确定性 open_id 生成

## 日期：2024-10-27

## 变更摘要

将 OAuth2 Token 生成流程中的 `open_id` 从**随机生成**改为**确定性生成**。

## 技术细节

### 修改的文件

1. **src/shared/core/index.js**
   - 修改 `generateToken()` 方法
   - 新增 `_generateDeterministicOpenId()` 方法

### 实现方式

使用 SHA256 哈希算法基于 `authorization_code` 和 `client_id` 生成确定性的 `open_id`：

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

## 行为变化

### 之前
```javascript
// 每次调用都生成不同的 open_id
generateToken({ authorization_code: "ABC123", ... })
// → open_id: "a1b2c3d4e5f6g7h8" (随机)

generateToken({ authorization_code: "ABC123", ... })
// → open_id: "x9y8z7w6v5u4t3s2" (不同的随机值)
```

### 现在
```javascript
// 相同的 authorization_code 总是生成相同的 open_id
generateToken({ authorization_code: "ABC123", client_id: "client1", ... })
// → open_id: "6feded276f76553e" (确定性)

generateToken({ authorization_code: "ABC123", client_id: "client1", ... })
// → open_id: "6feded276f76553e" (相同)

generateToken({ authorization_code: "XYZ789", client_id: "client1", ... })
// → open_id: "c1569ebb62f31462" (不同的 auth_code → 不同的 open_id)
```

## 优势

1. **可预测性** - 便于调试和测试
2. **幂等性** - 多次调用产生相同结果
3. **无状态** - 不需要存储映射关系
4. **分布式友好** - 多个服务器实例产生一致结果

## 测试验证

所有测试通过 ✓

```bash
# 运行单元测试
node test-deterministic-openid.js

测试结果：
✓ 相同的 authorization_code 生成相同的 open_id
✓ 不同的 authorization_code 生成不同的 open_id
✓ 相同的 authorization_code 但不同的 client_id 生成不同的 open_id
✓ open_id 格式验证（16个十六进制字符）
✓ 多次调用一致性验证（10次）
```

## 兼容性

- ✅ 向后兼容：API 接口和响应格式保持不变
- ✅ 现有客户端无需修改
- ✅ JWT Token 机制不受影响

## 安全性

- ✅ 单向性：无法从 open_id 反推 authorization_code
- ✅ 碰撞抵抗：SHA256 提供足够的安全性
- ✅ 客户端隔离：不同 client_id 产生不同的 open_id

## 相关文档

- `DETERMINISTIC_OPENID_README.md` - 功能说明和使用指南
- `docs/TOKEN_IMPLEMENTATION_GUIDE.md` - 技术实现详解
- `test-deterministic-openid.js` - 单元测试
- `test-oauth2-deterministic.js` - API 测试

## 影响范围

- ✅ 仅影响 OAuth2 Token 生成流程
- ✅ 不影响现有的 Token 验证逻辑
- ✅ 不影响 Invoice 等其他业务功能

## 部署建议

1. 本地测试通过后即可部署
2. 无需数据迁移
3. 无需客户端更新
4. 建议在测试环境验证后再部署到生产环境
