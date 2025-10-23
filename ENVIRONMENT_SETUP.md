# 环境变量配置指南

本项目使用环境变量来配置各种设置，支持本地开发和生产部署。

## 文件说明

### `.env.example`
- 环境变量模板文件
- 包含所有可用的配置选项和说明
- **会被提交到 Git**，用作参考

### `.env.local`
- 本地开发环境变量文件
- 包含实际的配置值
- **不会被提交到 Git**（已在 .gitignore 中排除）

### `.env`
- 通用环境变量文件
- **不会被提交到 Git**（已在 .gitignore 中排除）

## 设置步骤

### 1. 本地开发设置

```bash
# 复制模板文件
cp .env.example .env.local

# 编辑 .env.local 文件，填入实际值
nano .env.local
```

### 2. 必需的环境变量

```bash
# Supabase 配置（必需）
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. 可选的环境变量

```bash
# 服务器配置
PORT=3000                    # 服务器端口
NODE_ENV=development         # 环境类型
CORS_ORIGIN=*               # CORS 允许的源

# 响应配置
RESPONSE_DELAY=100          # 模拟响应延迟（毫秒）
ERROR_RATE=0.02             # 模拟错误率（0.0-1.0）

# 分页配置
DEFAULT_PAGE_SIZE=10        # 默认每页数量
MAX_PAGE_SIZE=20           # 最大每页数量

# 令牌配置
TOKEN_EXPIRATION=7200       # 访问令牌过期时间（秒）
REFRESH_TOKEN_EXPIRATION=2592000  # 刷新令牌过期时间（秒）

# 日志配置
LOG_LEVEL=info             # 日志级别
```

## 部署配置

### Vercel 部署

1. 在 Vercel 项目设置中添加环境变量：
   - 进入项目 → Settings → Environment Variables
   - 添加必需的变量：
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `NODE_ENV=production`

2. 可选变量（根据需要添加）：
   - `RESPONSE_DELAY`
   - `ERROR_RATE`
   - `MAX_PAGE_SIZE`

### 其他平台部署

根据平台文档设置环境变量，确保包含：
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NODE_ENV=production`

## 环境变量优先级

1. 系统环境变量（最高优先级）
2. `.env.local` 文件
3. `.env` 文件
4. 代码中的默认值（最低优先级）

## 安全注意事项

### ✅ 安全做法
- 使用 `.env.local` 存储敏感信息
- 定期轮换 API 密钥
- 在生产环境中使用强密码
- 限制 CORS 源到特定域名

### ❌ 避免的做法
- 不要将 `.env.local` 提交到 Git
- 不要在代码中硬编码敏感信息
- 不要在日志中输出敏感信息
- 不要使用弱密码或默认密钥

## 故障排除

### 环境变量未生效
1. 检查文件名是否正确（`.env.local`）
2. 确保变量名拼写正确
3. 重启开发服务器
4. 检查是否有语法错误

### Supabase 连接失败
1. 验证 `SUPABASE_URL` 格式正确
2. 检查 `SUPABASE_ANON_KEY` 是否有效
3. 确认 Supabase 项目状态正常
4. 检查网络连接

### 配置验证

可以通过访问 `/health` 端点查看当前配置状态：

```bash
curl http://localhost:3000/health
```

响应中会包含环境信息（不包含敏感数据）。

## 示例配置

### 开发环境 (.env.local)
```bash
SUPABASE_URL=https://abc123.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=development
PORT=3000
CORS_ORIGIN=*
RESPONSE_DELAY=100
ERROR_RATE=0.02
```

### 生产环境 (Vercel)
```bash
SUPABASE_URL=https://abc123.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
RESPONSE_DELAY=50
ERROR_RATE=0.01
```

---

如有问题，请检查 [Supabase 设置指南](./SUPABASE_SETUP.md) 或提交 Issue。