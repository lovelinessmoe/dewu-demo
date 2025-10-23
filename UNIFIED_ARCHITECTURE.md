# 统一架构说明

## 概述

现在 Dewu Mock API 使用统一的核心业务逻辑，确保 standalone API 和普通 `npm run dev` 使用完全相同的代码逻辑。

## 架构组件

### 1. 核心业务逻辑 (`src/shared/core/index.js`)

这是统一的核心模块，包含：

- **BusinessLogic 类**：主要的业务逻辑控制器（单例模式）
- **TokenManager 类**：Token 管理和验证
- **SupabaseService 类**：数据库服务（支持 Supabase 和 fallback）
- **配置管理**：统一的环境配置
- **Mock 数据**：统一的测试数据

### 2. API 入口点

#### Standalone API (`api/standalone.js`)
- 用于 Vercel 部署
- 直接使用核心业务逻辑
- 包含完整的 Express 应用设置

#### TypeScript API (`api/index.js`)
- 用于本地开发和传统部署
- 使用核心业务逻辑
- 通过编译后的 TypeScript 控制器

#### TypeScript 源码 (`src/server/`)
- TypeScript 控制器现在是核心逻辑的薄包装层
- 保持类型安全和详细的验证
- 使用统一的业务逻辑进行实际处理

## 关键特性

### 单例模式
- `BusinessLogic` 类使用单例模式
- 确保所有 API 入口点共享相同的状态
- Token 存储在所有环境中保持一致

### 统一的数据处理
- 所有 API 使用相同的 Supabase 服务
- 统一的 fallback 机制
- 一致的错误处理和响应格式

### 环境兼容性
- 支持 JavaScript (Node.js) 和 TypeScript 环境
- 自动处理模块导入差异
- 保持向后兼容性

## 使用方式

### 本地开发
```bash
npm run dev
```
使用 TypeScript 版本，支持热重载和类型检查。

### Standalone 测试
```bash
node api/standalone.js
```
直接运行 standalone 版本，模拟 Vercel 环境。

### Vercel 部署
Vercel 自动使用 `api/standalone.js` 作为 serverless 函数。

## API 端点

所有版本支持相同的 API 端点：

- `POST /api/v1/h5/passport/v1/oauth2/token` - 生成 Token
- `POST /api/v1/h5/passport/v1/oauth2/refresh_token` - 刷新 Token
- `POST /dop/api/v1/invoice/list` - 获取发票列表
- `POST /dop/api/v1/invoice/handle` - 处理发票
- `POST /dop/api/v1/common/merchant/base/info` - 获取商户信息

## 测试流程

1. **获取 Token**：
```bash
curl -X POST http://localhost:3000/api/v1/h5/passport/v1/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "test_client_id_12345",
    "client_secret": "test_client_secret_abcdefghijklmnop",
    "authorization_code": "test_auth_code_123456789"
  }'
```

2. **使用 Token 调用 API**：
```bash
curl -X POST http://localhost:3000/dop/api/v1/invoice/list \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "YOUR_ACCESS_TOKEN",
    "page_no": 1,
    "page_size": 10
  }'
```

## 优势

1. **代码复用**：消除了重复的业务逻辑
2. **一致性**：所有环境行为完全一致
3. **维护性**：只需要在一个地方修改业务逻辑
4. **测试性**：可以在不同环境中测试相同的逻辑
5. **部署灵活性**：支持多种部署方式

## 文件结构

```
src/
├── shared/
│   └── core/
│       ├── index.js          # 核心业务逻辑
│       └── index.d.ts        # TypeScript 类型定义
├── server/
│   ├── controllers/          # TypeScript 控制器（薄包装层）
│   ├── middleware/           # 中间件（使用核心逻辑）
│   └── app.ts               # TypeScript 应用入口
api/
├── standalone.js            # Vercel standalone API
└── index.js                # 编译后的 TypeScript API
```

这种架构确保了无论在哪种环境下运行，API 的行为都是完全一致的。