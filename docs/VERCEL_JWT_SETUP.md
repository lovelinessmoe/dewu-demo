# Vercel JWT 配置指南

## 概述

项目已成功迁移到无状态 JWT Token 管理系统。这个指南将帮助你在 Vercel 上正确配置 JWT 密钥。

## 为什么需要 JWT Secret？

JWT Secret 用于签名和验证 token，确保 token 的安全性和完整性。在生产环境中，必须使用强随机密钥。

## 生成 JWT Secret

### 方法 1：使用 Node.js（推荐）

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

这将生成一个 64 字符的十六进制字符串，例如：
```
f8e7d6c5b4a3928170695847362514089abcdef1234567890fedcba987654321
```

### 方法 2：使用 OpenSSL

```bash
openssl rand -hex 32
```

### 方法 3：在线生成器

访问 https://generate-secret.vercel.app/32 生成一个安全的密钥

## 在 Vercel 中配置环境变量

### 步骤 1：登录 Vercel Dashboard

1. 访问 https://vercel.com/dashboard
2. 选择你的项目

### 步骤 2：添加环境变量

1. 点击 "Settings" 标签
2. 在左侧菜单中选择 "Environment Variables"
3. 添加以下环境变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `JWT_SECRET` | 你生成的密钥 | Production, Preview, Development |
| `JWT_ACCESS_TOKEN_EXPIRY` | `1h` | Production, Preview, Development |
| `JWT_REFRESH_TOKEN_EXPIRY` | `30d` | Production, Preview, Development |

### 步骤 3：重新部署

添加环境变量后，Vercel 会自动触发重新部署。如果没有，手动触发一次部署。

## 环境变量说明

### JWT_SECRET（必需）

- **用途**: 用于签名和验证 JWT token
- **格式**: 至少 32 字符的随机字符串
- **示例**: `f8e7d6c5b4a3928170695847362514089abcdef1234567890fedcba987654321`
- **安全性**: 
  - ⚠️ 不要在代码中硬编码
  - ⚠️ 不要提交到 Git
  - ⚠️ 定期轮换（建议每 90 天）
  - ✅ 使用强随机生成器
  - ✅ 至少 32 字符长度

### JWT_ACCESS_TOKEN_EXPIRY（可选）

- **用途**: Access Token 的有效期
- **默认值**: `1h`（1 小时）
- **格式**: 
  - `60` - 60 秒
  - `5m` - 5 分钟
  - `1h` - 1 小时
  - `7d` - 7 天
- **推荐值**: `1h`（短期 token，更安全）

### JWT_REFRESH_TOKEN_EXPIRY（可选）

- **用途**: Refresh Token 的有效期
- **默认值**: `30d`（30 天）
- **格式**: 同上
- **推荐值**: `30d`（长期 token，用于刷新）

## 验证配置

### 方法 1：通过 Vercel 日志

部署后，检查 Vercel 函数日志，应该看到：

```
[Core] Initializing business logic (Supabase-only mode)...
[Config] Token Management: JWT (Stateless)
```

如果看到警告：
```
[JWT] WARNING: Using default JWT secret. Set JWT_SECRET environment variable in production!
```

说明 JWT_SECRET 未正确配置。

### 方法 2：测试 API

使用 curl 测试 token 生成：

```bash
curl -X POST https://your-app.vercel.app/api/v1/h5/passport/v1/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "test_client",
    "client_secret": "test_secret",
    "authorization_code": "test_code"
  }'
```

成功响应示例：
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "scope": ["all"],
    "open_id": "abc123xyz",
    "access_token": "ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1...",
    "access_token_expires_in": 3600,
    "refresh_token": "ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1...",
    "refresh_token_expires_in": 2592000
  },
  "status": 200
}
```

## Token 格式说明

### 外观

Token 看起来像随机字符串：
```
ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnZjR1Z1WDJsa0lqb2lkR1Z6ZEY5MWMyVnlYekV5TXpRMUlpd2ljMk52Y0dVaU9sc2lZV3hzSWwwc0luUjVjR1VpT2lKaFkyTmxjM01pTENKcFlYUWlPakUzTmpFeU56YzBNVGNzSW1WNGNDSTZNVGMyTVRJNE1UQXhOeXdpYVhOeklqb2laR1YzZFMxdGIyTnJMV0Z3YVNJc0luTjFZaUk2SW5SbGMzUmZkWE5sY2w4eE1qTTBOU0o5LkkyVlJhbXFQQXQtaVlxMlRUYUs4aTd0QUp3ellXb3haV3paRjdzSXEyYzA
```

### 实际上

这是一个"伪装"的 JWT token：
- 内部使用标准 JWT 格式
- 外部看起来像随机 Base64 字符串
- 完全无状态，不需要服务器存储
- 包含所有必要的用户信息和过期时间

### 优势

1. **向后兼容**: 外观与旧的随机 token 相似
2. **无状态**: 不需要数据库或 Redis
3. **Serverless 友好**: 完美适配 Vercel
4. **安全**: 使用标准 JWT 签名算法
5. **可扩展**: 支持分布式部署

## 安全最佳实践

### 1. JWT Secret 管理

- ✅ 使用环境变量存储
- ✅ 每个环境使用不同的密钥
- ✅ 定期轮换密钥
- ❌ 不要硬编码在代码中
- ❌ 不要提交到版本控制

### 2. Token 过期时间

- Access Token: 短期（1 小时）
- Refresh Token: 长期（30 天）
- 根据安全需求调整

### 3. HTTPS Only

- 生产环境必须使用 HTTPS
- Vercel 自动提供 HTTPS

### 4. Token 刷新

- 实现自动刷新机制
- Access Token 过期前自动续期
- 使用 Refresh Token 获取新的 Access Token

## 故障排查

### 问题 1: Token 验证失败

**症状**: 
```json
{
  "code": 1002,
  "msg": "Invalid access token",
  "status": 401
}
```

**可能原因**:
1. JWT_SECRET 未配置或配置错误
2. Token 在不同环境间使用（开发环境的 token 在生产环境使用）
3. JWT_SECRET 被更改

**解决方案**:
1. 检查 Vercel 环境变量配置
2. 确保所有环境使用正确的 JWT_SECRET
3. 重新生成 token

### 问题 2: Token 过期太快

**症状**: Token 很快就失效

**解决方案**:
调整 `JWT_ACCESS_TOKEN_EXPIRY` 环境变量

### 问题 3: 警告信息

**症状**:
```
[JWT] WARNING: Using default JWT secret
```

**解决方案**:
在 Vercel 中添加 `JWT_SECRET` 环境变量

## 迁移说明

### 从旧系统迁移

如果你之前使用的是内存存储的 token 系统：

1. **无需数据迁移**: 旧 token 会自然过期
2. **用户需要重新登录**: 一次性操作
3. **新 token 自动使用 JWT**: 透明切换

### 回滚计划

如果需要回滚到旧系统：

1. 恢复旧的代码版本
2. 用户需要重新登录
3. 注意：旧系统不支持 Serverless

## 监控和日志

### 关键日志

成功初始化：
```
[Config] Token Management: JWT (Stateless)
```

Token 生成：
```
[OAuth2] Generated JWT token for open_id: xxx
```

Token 刷新：
```
[OAuth2] Refreshed JWT token for open_id: xxx
```

### 监控指标

- Token 生成成功率
- Token 验证失败率
- Token 过期率
- API 响应时间

## 总结

✅ JWT Secret 已配置
✅ Token 系统无状态运行
✅ Vercel Serverless 完全兼容
✅ 安全性得到保障
✅ 性能优化完成

如有问题，请查看：
- [Token 实现指南](./TOKEN_IMPLEMENTATION_GUIDE.md)
- [Vercel 文档](https://vercel.com/docs/environment-variables)
- [JWT 最佳实践](https://jwt.io/introduction)
