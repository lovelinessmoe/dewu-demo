# Supabase 设置指南

本项目使用 Supabase 作为数据库来存储和管理发票数据，支持实时筛选和持久化存储。

## 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 创建新账户或登录
3. 点击 "New Project"
4. 选择组织并填写项目信息：
   - Name: `dewu-mock-api`
   - Database Password: 设置一个强密码
   - Region: 选择离你最近的区域
5. 等待项目创建完成（约2分钟）

## 2. 设置数据库表

1. 在 Supabase 项目面板中，点击左侧的 "SQL Editor"
2. 点击 "New Query"
3. 复制 `supabase-setup.sql` 文件中的所有内容
4. 粘贴到 SQL 编辑器中
5. 点击 "Run" 执行 SQL

这将创建：
- `invoices` 表及其索引
- 行级安全策略 (RLS)
- 自动更新时间戳的触发器
- 示例数据

## 3. 获取 API 密钥

1. 在项目面板中，点击左侧的 "Settings"
2. 点击 "API"
3. 复制以下信息：
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 4. 配置环境变量

### 本地开发
创建 `.env.local` 文件：
```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Vercel 部署
1. 在 Vercel 项目设置中，点击 "Environment Variables"
2. 添加以下变量：
   - `SUPABASE_URL`: 你的项目 URL
   - `SUPABASE_ANON_KEY`: 你的匿名密钥

## 5. 验证设置

部署后，访问你的 API 根路径，页面底部会显示数据库连接状态：
- ✅ Connected: Supabase 连接成功
- ⚠️ Fallback Mode: 使用本地模拟数据

## 6. 数据库结构

### invoices 表字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | BIGSERIAL | 主键 |
| invoice_title | TEXT | 发票抬头 |
| seller_reject_reason | TEXT | 卖家拒绝原因 |
| verify_time | TEXT | 审核时间 |
| category_type | INTEGER | 发票类别 (1=电子, 2=纸质) |
| order_time | TEXT | 订单时间 |
| invoice_image_url | TEXT | 发票图片URL |
| bank_name | TEXT | 银行名称 |
| invoice_type | INTEGER | 发票类型 |
| company_address | TEXT | 公司地址 |
| article_number | TEXT | 商品编号 |
| bidding_price | INTEGER | 竞价价格 |
| spu_id | INTEGER | 商品SPU ID |
| invoice_title_type | INTEGER | 抬头类型 (1=个人, 2=企业) |
| spu_title | TEXT | 商品标题 |
| bank_account | TEXT | 银行账号 |
| status | INTEGER | 状态 (0=待处理, 2=通过, 3=驳回, 5=卖家驳回) |
| upload_time | TEXT | 上传时间 |
| apply_time | TEXT | 申请时间 |
| company_phone | TEXT | 公司电话 |
| handle_flag | INTEGER | 处理标志 |
| amount | INTEGER | 金额 |
| seller_post | JSONB | 卖家邮寄信息 |
| sku_id | INTEGER | SKU ID |
| reject_time | TEXT | 拒绝时间 |
| order_no | TEXT | 订单号 (唯一) |
| properties | TEXT | 商品属性 |
| tax_number | TEXT | 税号 |
| reject_reason | TEXT | 拒绝原因 |
| seller_post_appointment | BOOLEAN | 卖家预约邮寄 |

### 索引

为了提高查询性能，创建了以下索引：
- `idx_invoices_spu_id`: SPU ID 索引
- `idx_invoices_status`: 状态索引
- `idx_invoices_order_no`: 订单号索引
- `idx_invoices_invoice_title_type`: 抬头类型索引
- `idx_invoices_apply_time`: 申请时间索引

## 7. API 功能

### 支持的筛选参数

- `spu_id`: 按商品 SPU ID 筛选
- `status`: 按状态筛选
- `order_no`: 按订单号筛选
- `invoice_title_type`: 按抬头类型筛选
- `apply_start_time`: 按申请开始时间筛选
- `apply_end_time`: 按申请结束时间筛选

### 分页支持

- `page_no`: 页码 (从1开始)
- `page_size`: 每页数量 (最大20)

### 状态更新

发票处理接口 (`/dop/api/v1/invoice/handle`) 可以：
- 批准发票 (operation_type=1): 状态改为2
- 拒绝发票 (operation_type=2): 状态改为5

## 8. 故障排除

### 连接问题
- 检查 Supabase URL 和 API 密钥是否正确
- 确保项目没有暂停（免费计划有使用限制）
- 检查网络连接

### 权限问题
- 确保 RLS 策略已正确设置
- 检查 API 密钥权限

### 数据问题
- 使用 Supabase 面板的 "Table Editor" 查看数据
- 检查 SQL 执行日志

## 9. 监控和维护

### Supabase 面板功能
- **Table Editor**: 直接编辑数据
- **SQL Editor**: 执行自定义查询
- **API Logs**: 查看 API 调用日志
- **Database**: 监控数据库性能

### 备份
Supabase 自动备份数据，也可以手动导出：
1. 进入 "Settings" > "Database"
2. 点击 "Database backups"
3. 创建手动备份或下载现有备份

## 10. 升级到生产环境

对于生产使用，建议：
1. 升级到 Supabase Pro 计划
2. 设置更严格的 RLS 策略
3. 启用数据库备份
4. 配置监控和告警
5. 使用环境变量管理敏感信息

---

如有问题，请参考 [Supabase 官方文档](https://supabase.com/docs) 或提交 Issue。