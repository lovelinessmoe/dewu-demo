# Dewu Mock API - CURL 使用指南

本文档提供了 Dewu Mock API 所有接口的 curl 调用示例和详细说明，完全兼容得物开放平台的 API 规范。

## 目录
- [服务器信息](#服务器信息)
- [认证流程](#认证流程)
- [OAuth2 接口](#oauth2-接口)
- [发票管理接口](#发票管理接口)
- [商户信息接口](#商户信息接口)
- [系统接口](#系统接口)
- [签名验证](#签名验证)
- [错误处理](#错误处理)
- [完整示例流程](#完整示例流程)

## 服务器信息

**默认服务器地址**: `{{DeWuURL}}`

**可用的客户端凭据**:
- 测试环境: `test_client_id` / `test_client_secret`
- 演示环境: `demo_client_id` / `demo_client_secret`  
- 开发环境: `dev_client_id` / `dev_client_secret`

**默认应用密钥 (app_secret)**:
- 测试环境: `test_app_secret`
- 演示环境: `demo_app_secret`
- 开发环境: `dev_app_secret`

## 认证流程

Dewu Mock API 使用 OAuth2 认证流程：
1. 使用客户端凭据获取访问令牌
2. 在后续请求中使用访问令牌
3. 令牌过期时使用刷新令牌获取新的访问令牌

---

## OAuth2 接口

### 1. 获取访问令牌

**接口**: `POST /api/v1/h5/passport/v1/oauth2/token`

**描述**: 使用客户端凭据和授权码获取访问令牌

**请求示例**:
```bash
curl -X POST {{DeWuURL}}/api/v1/h5/passport/v1/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "test_client_id",
    "client_secret": "test_client_secret",
    "authorization_code": "test_auth_code_123"
  }'
```

**成功响应示例**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "scope": ["all"],
    "open_id": "GvAzWrxfFjIPrJ23",
    "access_token": "eZiyEQtzqtsU6PnmaxjqgCeRS4tW6KbacMbKBQFp1lVGGIoC5nJUoKZyMLDmdY",
    "access_token_expires_in": 86400,
    "refresh_token": "rhsO0MhPdHg7obr5104L8EEmhIHUQ4g1x8KHlZvuJwFi03nRzWgMDxMTfIIwlR",
    "refresh_token_expires_in": 15552000
  },
  "status": 200
}
```

**错误响应示例**:
```json
{
  "code": 401,
  "msg": "Invalid client credentials",
  "data": null,
  "status": 401
}
```

### 2. 刷新访问令牌

**接口**: `POST /api/v1/h5/passport/v1/oauth2/refresh_token`

**描述**: 使用刷新令牌获取新的访问令牌

**请求示例**:
```bash
curl -X POST {{DeWuURL}}/api/v1/h5/passport/v1/oauth2/refresh_token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "test_client_id",
    "client_secret": "test_client_secret",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

**成功响应示例**:
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "scope": ["all"],
    "open_id": "GvAzWrxfFjIPrJ23",
    "access_token": "tNb6TDY67oLZ2gjKfiZ7VoChm7iN21GxARAiGN4JswZHPP0qjLla3TNZmCLoqB",
    "access_token_expires_in": 86400,
    "refresh_token": "rhsO0MhPdHg7obrxc5108EEmhIHUQ4g1x8KHlZvuJwFi03nRzWgMDxMTfIIwlR",
    "refresh_token_expires_in": 15552000
  },
  "status": 200
}
```

---

## 发票管理接口

### 3. 获取发票列表

**接口**: `POST /dop/api/v1/invoice/list`

**描述**: 获取开票申请列表，支持分页和多种筛选条件。注意：开票数据只能查询一年内的数据

**请求参数**:
- `access_token` (必需): 访问令牌
- `page_no` (必需): 页数
- `page_size` (必需): 一页条数，最大值为 20
- `spu_id` (可选): 商品 spuId
- `status` (可选): 开票状态（0：卖家待处理，1：运营审核中，2：运营审核通过，3：运营已驳回，4：买家已取消，5：卖家已驳回，6：待买家处理）
- `order_no` (可选): 订单号
- `apply_start_time` (可选): 申请时间开始时间，格式：yyyy-MM-dd HH:mm:ss
- `apply_end_time` (可选): 申请时间结束时间，格式：yyyy-MM-dd HH:mm:ss
- `invoice_title_type` (可选): 发票抬头类型（1：个人或事业单位，2：企业）

**基础请求示例**:
```bash
curl -X POST {{DeWuURL}}/dop/api/v1/invoice/list \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "eZiyEQtzqtsU6PnmaxjqgCeRS4tW6KbacMbKBQFp1lVGGIoC5nJUoKZyMLDmdY",
    "page_no": 1,
    "page_size": 10
  }'
```

**带筛选条件的请求示例**:
```bash
curl -X POST {{DeWuURL}}/dop/api/v1/invoice/list \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "eZiyEQtzqtsU6PnmaxjqgCeRS4tW6KbacMbKBQFp1lVGGIoC5nJUoKZyMLDmdY",
    "page_no": 1,
    "page_size": 20,
    "status": 0,
    "spu_id": 1,
    "order_no": "1100113245",
    "apply_start_time": "2024-06-05 23:54:48",
    "apply_end_time": "2024-10-22 23:54:48",
    "invoice_title_type": 1
  }'
```

**成功响应示例**:
```json
{
  "trace_id": "req_1698765432_abc123456",
  "code": 200,
  "msg": "success",
  "data": {
    "page_no": 1,
    "page_size": 20,
    "total_results": 100,
    "list": [
      {
        "invoice_title": "得物",
        "seller_reject_reason": "查询不到公司税号",
        "verify_time": "2024-06-05 23:54:48",
        "category_type": 1,
        "order_time": "2024-06-05 23:54:48",
        "invoice_image_url": "发票图片url路径",
        "bank_name": "中国银行",
        "invoice_type": 1,
        "company_address": "湖南省长沙市天心区赤岭路45号长沙理工大学金盆岭校区",
        "article_number": "iPhone 12-黑色",
        "bidding_price": 25900,
        "spu_id": 1,
        "invoice_title_type": 1,
        "spu_title": "【现货发售】Apple iPhone 12 黑色 全网通双卡双待5G手机",
        "bank_account": "开户银行",
        "status": 0,
        "upload_time": "2024-06-05 23:54:48",
        "apply_time": "2024-06-05 23:54:48",
        "company_phone": "注册电话",
        "handle_flag": 1,
        "amount": 25900,
        "seller_post": {
          "express_no": "SF1301946631496",
          "take_end_time": "2021-05-21 11:00:00",
          "sender_name": "张三",
          "take_start_time": "2021-05-21 10:00:00",
          "logistics_name": "顺丰速运",
          "sender_full_address": "上海市普陀区交通局**号"
        },
        "sku_id": 1,
        "reject_time": "2021-05-21 11:00:00",
        "order_no": "11001232435",
        "properties": "官方标配 128GB",
        "tax_number": "税号",
        "reject_reason": "驳回原因",
        "seller_post_appointment": false
      }
    ]
  }
}
```

### 4. 处理发票

**接口**: `POST /dop/api/v1/invoice/handle`

**描述**: 开票处理。注意：仅状态为待卖家处理的开票申请可处理

**请求参数**:
- `access_token` (必需): 访问令牌
- `order_no` (必需): 订单号
- `operation_type` (必需): 操作类型（1：同意，2：拒绝）
- `category_type` (必需): 发票类别（1：电子发票，2：纸质发票）
- `image_key` (可选): 发票上传的文件key，如果operation_type为1（同意），则此项必填
- `reject_operation` (可选): 拒绝原因（103：请提供真实姓名，否则无法开具个人抬头发票，104：税号与开票公司名称不匹配，请核实，105：因疫情暂无法开具或邮寄，请过段时间再申请）。如果operation_type选择2（拒绝），此项必填

**同意开票示例**:
```bash
curl -X POST {{DeWuURL}}/dop/api/v1/invoice/handle \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "eZiyEQtzqtsU6PnmaxjqgCeRS4tW6KbacMbKBQFp1lVGGIoC5nJUoKZyMLDmdY",
    "order_no": "110011234354",
    "operation_type": 1,
    "category_type": 1,
    "image_key": "invoice_image_key_123"
  }'
```

**拒绝开票示例**:
```bash
curl -X POST {{DeWuURL}}/dop/api/v1/invoice/handle \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "eZiyEQtzqtsU6PnmaxjqgCeRS4tW6KbacMbKBQFp1lVGGIoC5nJUoKZyMLDmdY",
    "order_no": "110011234354",
    "operation_type": 2,
    "category_type": 1,
    "reject_operation": 103
  }'
```

**成功响应示例**:
```json
{
  "trace_id": "req_1698765432_abc123456",
  "code": 200,
  "msg": "success",
  "data": {}
}
```

---

## 商户信息接口

### 5. 获取商户基础信息

**接口**: `POST /dop/api/v1/common/merchant/base/info`

**描述**: 查询商户基础信息

**请求参数**:
- `access_token` (必需): 访问令牌

**请求示例**:
```bash
curl -X POST {{DeWuURL}}/dop/api/v1/common/merchant/base/info \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "eZiyEQtzqtsU6PnmaxjqgCeRS4tW6KbacMbKBQFp1lVGGIoC5nJUoKZyMLDmdY"
  }'
```

**成功响应示例**:
```json
{
  "domain": "",
  "code": 200,
  "msg": "success",
  "data": {
    "merchant_id": "merchant_test_001",
    "type_id": "1"
  },
  "errors": []
}
```

---

## 系统接口

### 6. 健康检查

**接口**: `GET /health`

**描述**: 检查服务器运行状态

**请求示例**:
```bash
curl -X GET {{DeWuURL}}/health
```

**响应示例**:
```json
{
  "status": "healthy",
  "timestamp": "2024-10-22T07:30:00.000Z",
  "uptime": 3600.123,
  "environment": "development",
  "version": "1.0.0",
  "requestId": "req_1698765432_abc123456"
}
```

### 7. API 状态信息

**接口**: `GET /api/status`

**描述**: 获取 API 状态和端点信息

**请求示例**:
```bash
curl -X GET {{DeWuURL}}/api/status
```

**响应示例**:
```json
{
  "api": "Dewu Mock API",
  "version": "1.0.0",
  "status": "operational",
  "endpoints": {
    "oauth2": "/api/v1/h5/passport/v1/oauth2/*",
    "invoices": "/dop/api/v1/invoice/*",
    "merchant": "/dop/api/v1/common/merchant/*"
  },
  "environment": {
    "nodeVersion": "v18.17.0",
    "platform": "darwin",
    "arch": "x64",
    "uptime": 3600.123,
    "memoryUsage": {
      "rss": 45678912,
      "heapTotal": 23456789,
      "heapUsed": 12345678,
      "external": 1234567,
      "arrayBuffers": 123456
    },
    "configPath": "/path/to/config.json",
    "environment": "development",
    "port": 3000
  },
  "requestId": "req_1698765432_abc123456"
}
```

---

## 签名验证

得物 API 使用签名验证来确保请求的安全性。所有需要认证的接口都需要包含签名参数。

### 签名算法

1. **参数排序**: 将所有请求参数（除了 sign 参数）按照参数名的字典序升序排列
2. **拼接字符串**: 将排序后的参数按照 `key=value&key=value` 的格式拼接
3. **添加密钥**: 在拼接字符串的开头和结尾都添加 app_secret
4. **计算 MD5**: 对最终字符串计算 MD5 哈希值，并转换为大写

### 签名示例

假设请求参数为：
```json
{
  "app_key": "test_client_id",
  "access_token": "eZiyEQtzqtsU6PnmaxjqgCeRS4tW6KbacMbKBQFp1lVGGIoC5nJUoKZyMLDmdY",
  "timestamp": 1698765432000,
  "page_no": 1,
  "page_size": 10
}
```

app_secret 为：`test_app_secret`

**步骤 1**: 参数排序
```
access_token=eZiyEQtzqtsU6PnmaxjqgCeRS4tW6KbacMbKBQFp1lVGGIoC5nJUoKZyMLDmdY
app_key=test_client_id
page_no=1
page_size=10
timestamp=1698765432000
```

**步骤 2**: 拼接字符串
```
access_token=eZiyEQtzqtsU6PnmaxjqgCeRS4tW6KbacMbKBQFp1lVGGIoC5nJUoKZyMLDmdY&app_key=test_client_id&page_no=1&page_size=10&timestamp=1698765432000
```

**步骤 3**: 添加密钥
```
test_app_secretaccess_token=eZiyEQtzqtsU6PnmaxjqgCeRS4tW6KbacMbKBQFp1lVGGIoC5nJUoKZyMLDmdY&app_key=test_client_id&page_no=1&page_size=10&timestamp=1698765432000test_app_secret
```

**步骤 4**: 计算 MD5 并转大写
```bash
echo -n "test_app_secretaccess_token=eZiyEQtzqtsU6PnmaxjqgCeRS4tW6KbacMbKBQFp1lVGGIoC5nJUoKZyMLDmdY&app_key=test_client_id&page_no=1&page_size=10&timestamp=1698765432000test_app_secret" | md5sum | tr 'a-z' 'A-Z'
```

### 签名生成脚本

**Bash 脚本示例**:
```bash
#!/bin/bash

# 签名生成函数
generate_sign() {
    local app_secret="$1"
    local params="$2"
    
    # 计算签名
    local sign_string="${app_secret}${params}${app_secret}"
    local sign=$(echo -n "$sign_string" | md5sum | cut -d' ' -f1 | tr 'a-z' 'A-Z')
    echo "$sign"
}

# 使用示例
APP_SECRET="test_app_secret"
PARAMS="access_token=eZiyEQtzqtsU6PnmaxjqgCeRS4tW6KbacMbKBQFp1lVGGIoC5nJUoKZyMLDmdY&app_key=test_client_id&page_no=1&page_size=10&timestamp=1698765432000"

SIGN=$(generate_sign "$APP_SECRET" "$PARAMS")
echo "Generated signature: $SIGN"
```

**Python 脚本示例**:
```python
import hashlib
import urllib.parse

def generate_sign(app_secret, params_dict):
    # 排序参数
    sorted_params = sorted(params_dict.items())
    
    # 拼接参数字符串
    param_string = '&'.join([f"{k}={v}" for k, v in sorted_params])
    
    # 添加密钥
    sign_string = f"{app_secret}{param_string}{app_secret}"
    
    # 计算 MD5 并转大写
    sign = hashlib.md5(sign_string.encode('utf-8')).hexdigest().upper()
    
    return sign

# 使用示例
app_secret = "test_app_secret"
params = {
    "app_key": "test_client_id",
    "access_token": "eZiyEQtzqtsU6PnmaxjqgCeRS4tW6KbacMbKBQFp1lVGGIoC5nJUoKZyMLDmdY",
    "timestamp": 1698765432000,
    "page_no": 1,
    "page_size": 10
}

sign = generate_sign(app_secret, params)
print(f"Generated signature: {sign}")
```

---

## 错误处理

### 常见错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查请求参数格式和必需字段 |
| 401 | 认证失败 | 检查客户端凭据或访问令牌 |
| 404 | 资源不存在 | 检查请求的URL和资源ID |
| 500 | 服务器内部错误 | 检查服务器日志或联系管理员 |

### 错误响应格式

```json
{
  "code": 401,
  "msg": "Invalid or expired access token",
  "data": null,
  "status": 401
}
```

### 令牌相关错误

**无效客户端凭据**:
```bash
# 错误的客户端ID或密钥
curl -X POST {{DeWuURL}}/api/v1/h5/passport/v1/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "invalid_client",
    "client_secret": "invalid_secret",
    "authorization_code": "test_auth_code"
  }'
```

**无效访问令牌**:
```bash
# 使用过期或无效的令牌
curl -X POST {{DeWuURL}}/dop/api/v1/invoice/list \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "invalid_token"
  }'
```

---

## 完整示例流程

以下是一个完整的API调用流程示例，包含签名生成：

### 步骤 1: 获取访问令牌

```bash
# 保存响应到变量
TOKEN_RESPONSE=$(curl -s -X POST {{DeWuURL}}/api/v1/h5/passport/v1/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "test_client_id",
    "client_secret": "test_client_secret",
    "authorization_code": "test_auth_code_123"
  }')

# 提取访问令牌
ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.data.access_token')
echo "Access Token: $ACCESS_TOKEN"
```

### 步骤 2: 生成签名并获取商户信息

```bash
# 设置参数
APP_KEY="test_client_id"
APP_SECRET="test_app_secret"
TIMESTAMP=$(date +%s)000

# 生成签名的函数
generate_sign() {
    local app_secret="$1"
    local params="$2"
    local sign_string="${app_secret}${params}${app_secret}"
    echo -n "$sign_string" | md5sum | cut -d' ' -f1 | tr 'a-z' 'A-Z'
}

# 构建参数字符串（按字典序排序）
PARAMS="access_token=${ACCESS_TOKEN}&app_key=${APP_KEY}&timestamp=${TIMESTAMP}"
SIGN=$(generate_sign "$APP_SECRET" "$PARAMS")

# 调用商户信息接口
curl -X POST {{DeWuURL}}/dop/api/v1/common/merchant/base/info \
  -H "Content-Type: application/json" \
  -d "{
    \"app_key\": \"$APP_KEY\",
    \"access_token\": \"$ACCESS_TOKEN\",
    \"timestamp\": $TIMESTAMP,
    \"sign\": \"$SIGN\"
  }"
```

### 步骤 3: 获取发票列表

```bash
# 构建发票列表请求的参数字符串
PAGE_NO=1
PAGE_SIZE=10
PARAMS="access_token=${ACCESS_TOKEN}&app_key=${APP_KEY}&page_no=${PAGE_NO}&page_size=${PAGE_SIZE}&timestamp=${TIMESTAMP}"
SIGN=$(generate_sign "$APP_SECRET" "$PARAMS")

# 获取发票列表
INVOICE_RESPONSE=$(curl -s -X POST {{DeWuURL}}/dop/api/v1/invoice/list \
  -H "Content-Type: application/json" \
  -d "{
    \"app_key\": \"$APP_KEY\",
    \"access_token\": \"$ACCESS_TOKEN\",
    \"timestamp\": $TIMESTAMP,
    \"sign\": \"$SIGN\",
    \"page_no\": $PAGE_NO,
    \"page_size\": $PAGE_SIZE
  }")

echo "Invoice List Response:"
echo $INVOICE_RESPONSE | jq '.'
```

### 步骤 4: 处理发票

```bash
# 假设从上一步获取到订单号
ORDER_NO=$(echo $INVOICE_RESPONSE | jq -r '.data.list[0].order_no')

if [ "$ORDER_NO" != "null" ] && [ "$ORDER_NO" != "" ]; then
  # 构建发票处理请求的参数字符串
  OPERATION_TYPE=1
  CATEGORY_TYPE=1
  IMAGE_KEY="invoice_image_key_123"
  
  PARAMS="access_token=${ACCESS_TOKEN}&app_key=${APP_KEY}&category_type=${CATEGORY_TYPE}&image_key=${IMAGE_KEY}&operation_type=${OPERATION_TYPE}&order_no=${ORDER_NO}&timestamp=${TIMESTAMP}"
  SIGN=$(generate_sign "$APP_SECRET" "$PARAMS")
  
  # 处理发票（同意开票）
  curl -X POST {{DeWuURL}}/dop/api/v1/invoice/handle \
    -H "Content-Type: application/json" \
    -d "{
      \"app_key\": \"$APP_KEY\",
      \"access_token\": \"$ACCESS_TOKEN\",
      \"timestamp\": $TIMESTAMP,
      \"sign\": \"$SIGN\",
      \"order_no\": \"$ORDER_NO\",
      \"operation_type\": $OPERATION_TYPE,
      \"category_type\": $CATEGORY_TYPE,
      \"image_key\": \"$IMAGE_KEY\"
    }"
else
  echo "没有找到可处理的发票"
fi
```

### 自动化脚本示例

```bash
#!/bin/bash

# Dewu Mock API 完整测试脚本
BASE_URL="{{DeWuURL}}"
APP_KEY="test_client_id"
APP_SECRET="test_app_secret"

echo "=== Dewu Mock API 完整测试 ==="

# 签名生成函数
generate_sign() {
    local app_secret="$1"
    local params="$2"
    local sign_string="${app_secret}${params}${app_secret}"
    echo -n "$sign_string" | md5sum | cut -d' ' -f1 | tr 'a-z' 'A-Z'
}

# 1. 健康检查
echo "1. 检查服务器状态..."
curl -s "$BASE_URL/health" | jq '.'

# 2. 获取 API 状态
echo -e "\n2. 获取 API 状态..."
curl -s "$BASE_URL/api/status" | jq '.'

# 3. 获取访问令牌
echo -e "\n3. 获取访问令牌..."
TOKEN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/h5/passport/v1/oauth2/token" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "test_client_id",
    "client_secret": "test_client_secret",
    "authorization_code": "test_auth_code_123"
  }')

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.data.access_token')
echo "访问令牌: $ACCESS_TOKEN"

if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "获取访问令牌失败，退出测试"
  exit 1
fi

# 4. 获取商户信息
echo -e "\n4. 获取商户信息..."
TIMESTAMP=$(date +%s)000
PARAMS="access_token=${ACCESS_TOKEN}&app_key=${APP_KEY}&timestamp=${TIMESTAMP}"
SIGN=$(generate_sign "$APP_SECRET" "$PARAMS")

curl -s -X POST "$BASE_URL/dop/api/v1/common/merchant/base/info" \
  -H "Content-Type: application/json" \
  -d "{
    \"app_key\": \"$APP_KEY\",
    \"access_token\": \"$ACCESS_TOKEN\",
    \"timestamp\": $TIMESTAMP,
    \"sign\": \"$SIGN\"
  }" | jq '.'

# 5. 获取发票列表
echo -e "\n5. 获取发票列表..."
PAGE_NO=1
PAGE_SIZE=5
TIMESTAMP=$(date +%s)000
PARAMS="access_token=${ACCESS_TOKEN}&app_key=${APP_KEY}&page_no=${PAGE_NO}&page_size=${PAGE_SIZE}&timestamp=${TIMESTAMP}"
SIGN=$(generate_sign "$APP_SECRET" "$PARAMS")

INVOICE_RESPONSE=$(curl -s -X POST "$BASE_URL/dop/api/v1/invoice/list" \
  -H "Content-Type: application/json" \
  -d "{
    \"app_key\": \"$APP_KEY\",
    \"access_token\": \"$ACCESS_TOKEN\",
    \"timestamp\": $TIMESTAMP,
    \"sign\": \"$SIGN\",
    \"page_no\": $PAGE_NO,
    \"page_size\": $PAGE_SIZE
  }")

echo $INVOICE_RESPONSE | jq '.'

# 6. 处理第一个发票
echo -e "\n6. 处理发票..."
FIRST_ORDER_NO=$(echo $INVOICE_RESPONSE | jq -r '.data.list[0].order_no')
if [ "$FIRST_ORDER_NO" != "null" ] && [ "$FIRST_ORDER_NO" != "" ]; then
  OPERATION_TYPE=1
  CATEGORY_TYPE=1
  IMAGE_KEY="test_invoice_image_key"
  TIMESTAMP=$(date +%s)000
  
  PARAMS="access_token=${ACCESS_TOKEN}&app_key=${APP_KEY}&category_type=${CATEGORY_TYPE}&image_key=${IMAGE_KEY}&operation_type=${OPERATION_TYPE}&order_no=${FIRST_ORDER_NO}&timestamp=${TIMESTAMP}"
  SIGN=$(generate_sign "$APP_SECRET" "$PARAMS")
  
  curl -s -X POST "$BASE_URL/dop/api/v1/invoice/handle" \
    -H "Content-Type: application/json" \
    -d "{
      \"app_key\": \"$APP_KEY\",
      \"access_token\": \"$ACCESS_TOKEN\",
      \"timestamp\": $TIMESTAMP,
      \"sign\": \"$SIGN\",
      \"order_no\": \"$FIRST_ORDER_NO\",
      \"operation_type\": $OPERATION_TYPE,
      \"category_type\": $CATEGORY_TYPE,
      \"image_key\": \"$IMAGE_KEY\"
    }" | jq '.'
else
  echo "没有找到可处理的发票"
fi

# 7. 测试令牌刷新
echo -e "\n7. 测试令牌刷新..."
REFRESH_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.data.refresh_token')
if [ "$REFRESH_TOKEN" != "null" ] && [ "$REFRESH_TOKEN" != "" ]; then
  curl -s -X POST "$BASE_URL/api/v1/h5/passport/v1/oauth2/refresh_token" \
    -H "Content-Type: application/json" \
    -d "{
      \"client_id\": \"test_client_id\",
      \"client_secret\": \"test_client_secret\",
      \"refresh_token\": \"$REFRESH_TOKEN\"
    }" | jq '.'
else
  echo "没有获取到刷新令牌"
fi

echo -e "\n=== 测试完成 ==="
```

## 环境变量配置

可以通过环境变量自定义服务器行为：

```bash
# 设置配置文件
export CONFIG_PROFILE=development

# 设置响应延迟（毫秒）
export RESPONSE_DELAY=50

# 设置错误率（0.0-1.0）
export ERROR_RATE=0.05

# 启动服务器
npm run dev
```

## 调试技巧

### 1. 使用 jq 格式化 JSON 响应

```bash
curl -s {{DeWuURL}}/api/health | jq '.'
```

### 2. 保存响应到文件

```bash
curl -X POST {{DeWuURL}}/dop/api/v1/invoice/list \
  -H "Content-Type: application/json" \
  -d '{"access_token": "your_token"}' \
  -o invoice_response.json
```

### 3. 显示详细的请求信息

```bash
curl -v -X POST {{DeWuURL}}/api/v1/h5/passport/v1/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{"client_id": "test_client_id", "client_secret": "test_client_secret", "authorization_code": "test_code"}'
```

### 4. 测试错误情况

```bash
# 测试无效令牌
curl -X POST {{DeWuURL}}/dop/api/v1/invoice/list \
  -H "Content-Type: application/json" \
  -d '{"access_token": "invalid_token"}'

# 测试缺少参数
curl -X POST {{DeWuURL}}/api/v1/h5/passport/v1/oauth2/token \
  -H "Content-Type: application/json" \
  -d '{"client_id": "test_client_id"}'
```

---

## 注意事项

1. **令牌有效期**: 访问令牌默认有效期为 24 小时（86400 秒）
2. **刷新令牌**: 刷新令牌默认有效期为 180 天（15552000 秒）
3. **分页限制**: 发票列表每页最大数量为 20 条记录
4. **签名验证**: 所有需要认证的接口都必须包含正确的签名
5. **时间戳**: 时间戳参数必须是毫秒级的 Unix 时间戳
6. **参数排序**: 签名计算时参数必须按字典序排序
7. **数据范围**: 开票数据只能查询一年内的数据
8. **处理限制**: 仅状态为待卖家处理的开票申请可处理
9. **错误率**: 系统会模拟 2% 的随机错误用于测试
10. **响应延迟**: 系统会模拟 100ms 的网络延迟

## 常见问题

### Q: 签名验证失败怎么办？
A: 检查以下几点：
- 参数是否按字典序排序
- app_secret 是否正确
- 时间戳是否为毫秒级
- MD5 计算结果是否转为大写

### Q: 访问令牌过期怎么办？
A: 使用 refresh_token 调用令牌刷新接口获取新的访问令牌

### Q: 发票列表为空怎么办？
A: 检查查询条件，确保时间范围在一年内，或者调整筛选条件

### Q: 发票处理失败怎么办？
A: 确保发票状态为"待卖家处理"（status=0），并且提供正确的参数

## 联系支持

如果遇到问题，请：
1. 检查服务器是否正常运行：`curl {{DeWuURL}}/api/health`
2. 查看服务器日志获取详细错误信息
3. 参考本文档的错误处理部分
4. 检查请求参数格式是否正确