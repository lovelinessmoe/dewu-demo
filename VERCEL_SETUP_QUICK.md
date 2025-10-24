# Vercel 快速配置指南

## 🚀 立即配置（3 步完成）

### 步骤 1: 生成 JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

复制输出的字符串（例如：`f8e7d6c5b4a3928170695847362514089abcdef...`）

### 步骤 2: 在 Vercel 添加环境变量

1. 访问 https://vercel.com/dashboard
2. 选择你的项目
3. Settings → Environment Variables
4. 添加以下变量：

```
JWT_SECRET = [你在步骤1生成的密钥]
```

选择所有环境：Production, Preview, Development

### 步骤 3: 重新部署

Vercel 会自动重新部署，或手动触发一次部署。

## ✅ 验证配置

访问你的 API：

```bash
curl -X POST https://your-app.vercel.app/api/v1/h5/passport/v1/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{"client_id":"test","client_secret":"test","authorization_code":"test"}'
```

看到 `access_token` 就成功了！

## 📚 详细文档

- [完整 JWT 配置指南](./docs/VERCEL_JWT_SETUP.md)
- [Token 实现原理](./docs/TOKEN_IMPLEMENTATION_GUIDE.md)

## ⚠️ 重要提示

- JWT_SECRET 必须保密
- 不要提交到 Git
- 定期更换（建议每 90 天）
- 每个环境使用不同的密钥

## 🎉 完成！

你的项目现在使用无状态 JWT Token，完美适配 Vercel Serverless 环境！
