# 故障排除指南

本文档记录了 Dewu Mock API 项目中遇到的常见问题及其解决方案。

## 已解决的问题

### 1. Vite 版本兼容性问题

**问题描述**:
```
TypeError: crypto.hash is not a function
```

**原因**: Vite 7.x 需要 Node.js 20+ 版本，但项目运行在 Node.js 18.x 上。

**解决方案**:
降级相关依赖到兼容 Node.js 18 的版本：

```json
{
  "vite": "^5.4.10",
  "@vitejs/plugin-react": "^4.3.3",
  "@vitest/coverage-v8": "^1.6.0",
  "@vitest/ui": "^1.6.0",
  "vitest": "^1.6.0"
}
```

### 2. TypeScript ESM 模块问题

**问题描述**:
```
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts"
```

**原因**: ts-node 在 ESM 模式下的配置问题。

**解决方案**:

1. **更新 nodemon.json**:
```json
{
  "watch": ["src/server"],
  "ext": "ts,js",
  "ignore": ["src/client", "dist", "node_modules"],
  "exec": "node --loader ts-node/esm --experimental-specifier-resolution=node src/server/app.ts",
  "env": {
    "TS_NODE_PROJECT": "./tsconfig.node.json"
  }
}
```

2. **创建 tsconfig.node.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ES2022",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["node"],
    "allowImportingTsExtensions": false,
    "noEmit": false
  },
  "include": ["src/server/**/*"],
  "exclude": ["node_modules", "dist", "src/client"],
  "ts-node": {
    "esm": true,
    "experimentalSpecifierResolution": "node"
  }
}
```

### 3. React Router 版本兼容性

**问题描述**:
```
npm WARN EBADENGINE Unsupported engine {
  package: 'react-router-dom@7.9.4',
  required: { node: '>=20.0.0' },
  current: { node: 'v18.20.2', npm: '10.5.0' }
}
```

**解决方案**:
降级到兼容版本：
```json
{
  "react-router-dom": "^6.28.0"
}
```

## 修复脚本

创建了自动修复脚本 `scripts/fix-dependencies.sh`：

```bash
#!/bin/bash
# 清理依赖和缓存
rm -rf node_modules package-lock.json dist .vite

# 重新安装依赖
npm install

# 验证构建
npm run build:server
```

## 验证修复

### 1. 检查服务器启动
```bash
# 构建服务器
npm run build:server

# 启动服务器
node dist/server/app.js
```

预期输出：
```
🚀 Dewu Mock API Server started successfully
📍 Server running on port 3000
🌍 Environment: development
🔗 Health check: http://localhost:3000/api/health
```

### 2. 检查客户端构建
```bash
npm run build:client
```

预期输出：
```
vite v5.4.21 building for production...
✓ 106 modules transformed.
✓ built in 1.53s
```

### 3. 健康检查
```bash
curl http://localhost:3000/api/health
```

预期响应：
```json
{
  "status": "OK",
  "message": "Dewu Mock API Server is running",
  "timestamp": "2024-10-22T07:30:00.000Z",
  "environment": "development"
}
```

## 常见问题排查

### 问题：端口被占用
```bash
# 查找占用端口的进程
lsof -i :3000

# 终止进程
kill -9 <PID>
```

### 问题：依赖安装失败
```bash
# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

### 问题：TypeScript 编译错误
```bash
# 清理 TypeScript 缓存
rm -rf dist

# 重新构建
npm run build:server
```

### 问题：Vite 构建失败
```bash
# 清理 Vite 缓存
rm -rf .vite

# 重新构建
npm run build:client
```

## 环境要求

### 推荐环境
- **Node.js**: 18.x 或更高版本
- **npm**: 8.x 或更高版本
- **操作系统**: macOS, Linux, Windows

### 依赖版本
- **Vite**: 5.4.x (兼容 Node.js 18)
- **TypeScript**: 5.9.x
- **React**: 19.x
- **Express**: 5.x

## 开发工作流

### 1. 开发模式
```bash
# 启动开发服务器（前端 + 后端）
npm run dev

# 仅启动后端
npm run dev:server

# 仅启动前端
npm run dev:client
```

### 2. 生产构建
```bash
# 完整构建
npm run build

# 启动生产服务器
npm run start:production
```

### 3. 测试
```bash
# 运行测试
npm test

# 运行测试（监听模式）
npm run test:watch
```

## 性能优化建议

### 1. 开发环境
- 使用 `npm run dev` 启动热重载
- 配置合适的 `CONFIG_PROFILE=development`
- 设置较小的 `RESPONSE_DELAY` 值

### 2. 生产环境
- 使用 `npm run build` 构建优化版本
- 配置 `CONFIG_PROFILE=production`
- 启用 gzip 压缩
- 使用反向代理（如 Nginx）

## 监控和日志

### 1. 应用日志
```bash
# 查看实时日志
tail -f logs/app.log

# 使用 PM2 查看日志
pm2 logs dewu-mock-api
```

### 2. 系统监控
```bash
# 检查内存使用
ps aux | grep node

# 检查端口状态
netstat -tulpn | grep :3000
```

## 联系支持

如果遇到本文档未涵盖的问题：

1. 检查 GitHub Issues
2. 查看项目 README.md
3. 检查 API_CURL_GUIDE.md 中的示例
4. 运行 `npm run test` 确保基本功能正常