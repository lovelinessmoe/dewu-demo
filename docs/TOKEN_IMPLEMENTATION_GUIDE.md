# Token 实现方案指南

## 当前实现分析

### 现状：有状态 Token（内存存储）

```javascript
// 当前实现 - 有状态
class TokenManager {
  constructor() {
    this.tokenStore = new Map();  // ❌ 内存存储
  }
}
```

**问题：**
- ❌ 服务器重启后 Token 丢失
- ❌ 不支持多服务器实例（分布式）
- ❌ Vercel Serverless 环境不兼容
- ❌ 无法横向扩展

---

## 推荐方案：无状态 JWT Token

### 方案 1：JWT（推荐用于 Vercel）

#### 优点
- ✅ 完全无状态，不需要存储
- ✅ 支持分布式部署
- ✅ Vercel Serverless 友好
- ✅ 自包含所有必要信息
- ✅ 可以设置过期时间

#### 实现步骤

1. **安装依赖**
```bash
npm install jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

2. **环境变量配置**
```env
# .env
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=3600  # 1 hour
REFRESH_TOKEN_EXPIRES_IN=2592000  # 30 days
```

3. **JWT Token Manager 实现**

```javascript
const jwt = require('jsonwebtoken');

class JWTTokenManager {
  constructor(config) {
    this.secret = config.jwtSecret || process.env.JWT_SECRET || 'default-secret-change-me';
    this.accessTokenExpiry = config.accessTokenExpiry || '1h';
    this.refreshTokenExpiry = config.refreshTokenExpiry || '30d';
  }

  /**
   * 生成 Access Token（无状态）
   */
  generateAccessToken(payload) {
    return jwt.sign(
      {
        open_id: payload.open_id,
        scope: payload.scope || ['all'],
        type: 'access'
      },
      this.secret,
      {
        expiresIn: this.accessTokenExpiry,
        issuer: 'dewu-mock-api',
        subject: payload.open_id
      }
    );
  }

  /**
   * 生成 Refresh Token（无状态）
   */
  generateRefreshToken(payload) {
    return jwt.sign(
      {
        open_id: payload.open_id,
        type: 'refresh'
      },
      this.secret,
      {
        expiresIn: this.refreshTokenExpiry,
        issuer: 'dewu-mock-api',
        subject: payload.open_id
      }
    );
  }

  /**
   * 验证 Token（无状态）
   */
  validateToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret);
      
      // 检查 token 类型
      if (decoded.type !== 'access') {
        return {
          valid: false,
          error: 'Invalid token type'
        };
      }

      return {
        valid: true,
        tokenData: {
          open_id: decoded.open_id,
          scope: decoded.scope,
          expires_at: decoded.exp * 1000  // 转换为毫秒
        }
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          error: 'Access token has expired'
        };
      }
      if (error.name === 'JsonWebTokenError') {
        return {
          valid: false,
          error: 'Invalid access token'
        };
      }
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * 验证 Refresh Token
   */
  validateRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret);
      
      if (decoded.type !== 'refresh') {
        return {
          valid: false,
          error: 'Invalid token type'
        };
      }

      return {
        valid: true,
        tokenData: {
          open_id: decoded.open_id
        }
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          error: 'Refresh token has expired'
        };
      }
      return {
        valid: false,
        error: 'Invalid refresh token'
      };
    }
  }

  /**
   * 生成完整的 Token 响应
   */
  generateTokenResponse(open_id) {
    const accessToken = this.generateAccessToken({ open_id, scope: ['all'] });
    const refreshToken = this.generateRefreshToken({ open_id });

    // 解码以获取过期时间
    const accessDecoded = jwt.decode(accessToken);
    const refreshDecoded = jwt.decode(refreshToken);

    return {
      code: 200,
      msg: 'success',
      data: {
        scope: ['all'],
        open_id: open_id,
        access_token: accessToken,
        access_token_expires_in: accessDecoded.exp - Math.floor(Date.now() / 1000),
        refresh_token: refreshToken,
        refresh_token_expires_in: refreshDecoded.exp - Math.floor(Date.now() / 1000)
      },
      status: 200
    };
  }
}

module.exports = { JWTTokenManager };
```

4. **更新 BusinessLogic 使用 JWT**

```javascript
const { JWTTokenManager } = require('./jwt-token-manager');

class BusinessLogic {
  constructor() {
    // ...
    this.tokenManager = new JWTTokenManager({
      jwtSecret: process.env.JWT_SECRET,
      accessTokenExpiry: '1h',
      refreshTokenExpiry: '30d'
    });
  }

  generateToken(requestData) {
    const { client_id, client_secret, authorization_code } = requestData;

    if (!client_id || !client_secret || !authorization_code) {
      return {
        success: false,
        error: {
          code: 1001,
          msg: 'Missing required parameters',
          status: 400
        }
      };
    }

    // 基于 authorization_code 生成确定性的 open_id
    // 使用 SHA256 哈希算法确保相同的 authorization_code 总是生成相同的 open_id
    const open_id = this._generateDeterministicOpenId(authorization_code, client_id);
    
    // 生成 JWT token 响应（无状态）
    const tokenResponse = this.tokenManager.generateTokenResponse(open_id);

    return { success: true, data: tokenResponse };
  }

  /**
   * 生成确定性的 open_id（基于 authorization_code 和 client_id）
   * 使用 SHA256 哈希算法确保相同输入总是产生相同输出
   */
  _generateDeterministicOpenId(authorization_code, client_id) {
    const crypto = require('crypto');
    
    // 使用 SHA256 哈希算法生成确定性的 open_id
    const hash = crypto
      .createHash('sha256')
      .update(`${authorization_code}:${client_id}`)
      .digest('hex');
    
    // 取前16个字符作为 open_id（保持与原格式一致）
    return hash.substring(0, 16);
  }

  refreshToken(requestData) {
    const { client_id, client_secret, refresh_token } = requestData;

    if (!client_id || !client_secret || !refresh_token) {
      return {
        success: false,
        error: {
          code: 1001,
          msg: 'Missing required parameters',
          status: 400
        }
      };
    }

    // 验证 refresh token
    const validation = this.tokenManager.validateRefreshToken(refresh_token);
    
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: 1003,
          msg: validation.error,
          status: 401
        }
      };
    }

    // 使用原来的 open_id 生成新的 token
    const tokenResponse = this.tokenManager.generateTokenResponse(
      validation.tokenData.open_id
    );

    return { success: true, data: tokenResponse };
  }

  authenticateToken(access_token) {
    if (!access_token) {
      return {
        success: false,
        error: {
          code: 1002,
          msg: 'Access token is required',
          status: 401
        }
      };
    }

    // JWT 验证（无状态）
    const validation = this.tokenManager.validateToken(access_token);
    
    if (!validation.valid) {
      return {
        success: false,
        error: {
          code: validation.error === 'Access token has expired' ? 1003 : 1002,
          msg: validation.error,
          status: validation.error === 'Access token has expired' ? 403 : 401
        }
      };
    }

    return { success: true, tokenData: validation.tokenData };
  }
}
```

---

## 方案 2：Redis + Token（适合需要撤销功能）

如果需要主动撤销 Token 的能力，可以使用 Redis：

### 优点
- ✅ 支持分布式
- ✅ 可以主动撤销 Token
- ✅ 支持黑名单机制
- ✅ 持久化存储

### 缺点
- ❌ 需要额外的 Redis 服务
- ❌ Vercel 需要配置外部 Redis（如 Upstash）
- ❌ 增加系统复杂度

### 实现（使用 Upstash Redis）

```bash
npm install @upstash/redis
```

```javascript
const { Redis } = require('@upstash/redis');

class RedisTokenManager {
  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  async createToken(access_token, open_id, scope = ['all']) {
    const expiresIn = 3600; // 1 hour
    const tokenData = {
      access_token,
      refresh_token: `refresh_${access_token}`,
      open_id,
      scope,
      expires_at: Date.now() + expiresIn * 1000
    };

    // 存储到 Redis，设置过期时间
    await this.redis.setex(
      `token:${access_token}`,
      expiresIn,
      JSON.stringify(tokenData)
    );

    return tokenData;
  }

  async validateToken(access_token) {
    const data = await this.redis.get(`token:${access_token}`);
    
    if (!data) {
      return {
        valid: false,
        error: 'Invalid or expired access token'
      };
    }

    return {
      valid: true,
      tokenData: JSON.parse(data)
    };
  }

  async revokeToken(access_token) {
    await this.redis.del(`token:${access_token}`);
  }
}
```

---

## 方案对比

| 特性 | 当前实现（内存） | JWT（推荐） | Redis |
|------|----------------|------------|-------|
| 无状态 | ❌ | ✅ | ❌ |
| Vercel 兼容 | ❌ | ✅ | ⚠️ 需配置 |
| 分布式支持 | ❌ | ✅ | ✅ |
| Token 撤销 | ✅ | ❌ | ✅ |
| 实现复杂度 | 低 | 中 | 高 |
| 额外依赖 | 无 | jsonwebtoken | Redis 服务 |
| 性能 | 高 | 高 | 中 |
| 成本 | 免费 | 免费 | 需付费服务 |

---

## 推荐实施步骤

### 对于你的项目（Vercel 部署）

1. **立即实施：JWT 方案**
   - 完全无状态
   - 不需要额外服务
   - Vercel Serverless 完美兼容

2. **未来考虑：Redis 方案**
   - 如果需要 Token 撤销功能
   - 如果需要更细粒度的权限控制
   - 如果需要实时的 Token 黑名单

---

## 确定性 open_id 生成

### 为什么需要确定性生成？

在 OAuth2 流程中，`authorization_code` 是授权服务器颁发的临时授权码，用于换取 `access_token`。为了保证系统的一致性和可预测性，相同的 `authorization_code` 应该总是映射到相同的 `open_id`。

### 实现原理

使用 **SHA256 哈希算法** 基于 `authorization_code` 和 `client_id` 生成确定性的 `open_id`：

```javascript
_generateDeterministicOpenId(authorization_code, client_id) {
  const crypto = require('crypto');
  
  // 使用 SHA256 哈希算法
  const hash = crypto
    .createHash('sha256')
    .update(`${authorization_code}:${client_id}`)
    .digest('hex');
  
  // 取前16个字符作为 open_id
  return hash.substring(0, 16);
}
```

### 特性

1. **确定性**：相同的输入总是产生相同的输出
   - `authorization_code` + `client_id` → 固定的 `open_id`

2. **唯一性**：不同的输入产生不同的输出
   - 不同的 `authorization_code` → 不同的 `open_id`
   - 相同的 `authorization_code` 但不同的 `client_id` → 不同的 `open_id`

3. **安全性**：使用加密哈希算法
   - 无法从 `open_id` 反推 `authorization_code`
   - SHA256 提供足够的碰撞抵抗性

### 测试验证

```javascript
// 测试 1: 相同输入产生相同输出
const result1 = generateToken({
  client_id: 'client_123',
  client_secret: 'secret',
  authorization_code: 'AUTH_CODE_ABC'
});

const result2 = generateToken({
  client_id: 'client_123',
  client_secret: 'secret',
  authorization_code: 'AUTH_CODE_ABC'
});

console.log(result1.data.open_id === result2.data.open_id); // true

// 测试 2: 不同 authorization_code 产生不同 open_id
const result3 = generateToken({
  client_id: 'client_123',
  client_secret: 'secret',
  authorization_code: 'AUTH_CODE_XYZ'
});

console.log(result1.data.open_id !== result3.data.open_id); // true
```

### 优势

1. **可预测性**：便于调试和测试
2. **幂等性**：多次调用产生相同结果
3. **无状态**：不需要存储 authorization_code 到 open_id 的映射关系
4. **分布式友好**：多个服务器实例产生一致的结果

---

## 安全建议

1. **JWT Secret 管理**
   - 使用强随机字符串（至少 32 字符）
   - 存储在环境变量中
   - 定期轮换（建议每 90 天）

2. **Token 过期时间**
   - Access Token: 1 小时（短期）
   - Refresh Token: 30 天（长期）

3. **HTTPS Only**
   - 生产环境必须使用 HTTPS
   - 防止 Token 被中间人攻击

4. **Token 刷新机制**
   - 实现 Refresh Token 自动刷新
   - Access Token 过期前自动续期

---

## 迁移计划

### 第一阶段：实现 JWT
1. 安装 jsonwebtoken
2. 创建 JWTTokenManager
3. 更新 BusinessLogic
4. 测试所有 API 端点

### 第二阶段：部署验证
1. 本地测试
2. Vercel 预览部署测试
3. 生产环境部署

### 第三阶段：监控优化
1. 监控 Token 验证性能
2. 收集用户反馈
3. 根据需要调整过期时间

---

## 总结

**当前状态：** 有状态 Token（内存存储）- 不适合 Vercel

**推荐方案：** JWT 无状态 Token - 完美适配 Vercel Serverless

**实施优先级：** 高 - 这是 Vercel 部署的关键问题
