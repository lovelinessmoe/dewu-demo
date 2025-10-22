1. 用code换access_token
请求方式：POST请求
请求协议：https协议
请求接口：https://open.dewu.com/api/v1/h5/passport/v1/oauth2/token
请求header：Content-Type:application/json

 
| 入参                      |                         |                                                              |                                    |
| :------------------------ | :---------------------- | :----------------------------------------------------------- | :--------------------------------- |
| 参数名称                  | 是否必传                | 参数值                                                       | 参数说明                           |
| client_id                 | yes                     | 跟获取code时应用appKey一致                                   | 应用ID                             |
| client_secret             | yes                     | 应用appKey对应secret秘钥                                     | 创建应用时生成，看在应用详情页查看 |
| authorization_code        | yes                     | 授权码code                                                   | 上一步返回的授权码code             |
| 反参                      |                         |                                                              |                                    |
| 参数值                    | 参数说明                | 备注                                                         |                                    |
| code                      | 200为成功，其他皆为异常 | 成功标识                                                     |                                    |
| msg                       |                         |                                                              |                                    |
| data                      | 返回数据                |                                                              |                                    |
| -access_token             | access_token            |                                                              |                                    |
| -access_token_expires_in  |                         | 有效期（秒） access_token时效24小时，access_token过期使用refresh_token刷新 |                                    |
| -refresh_token            | refresh_token           | 在有效期内可以用刷新令牌重新刷新access_token                 |                                    |
| -refresh_token_expires_in |                         | 有效期（秒） refresh_token时效半年，refresh_token过期需要商家到服务市场重新点击授权 |                                    |
| -scope                    |                         | 这里没有实际作用                                             |                                    |
| -open_id                  |                         | open_id表示得物唯一商家（对外标识），该应用下多次授权都是同一个openId |                                    |



入参示例
```
POST /api/v1/h5/passport/v1/oauth2/token HTTP/1.1
Host: open.poizon.com
Content-Type: application/json
{
   "client_id": "eb2253e144bbc91946ef8f8cc9d2f",
   "client_secret": "9f9d2690492796acc8692cddbcab1d86321ab65f469d911fee74802fce7e",
   "authorization_code": "Mqngyl19fU"
}
```
返参示例
```
{
    "code": 200,
    "msg": "success",
    "data": {
        "scope": [
            "all"
        ],
        "open_id": "GvAzWrxfFjIPrJ23",
        "access_token": "eZiyEQtzqtsU6PnmaxjqgCeRS4tW6KbacMbKBQFp1lVGGIoC5nJUoKZyMLDmdY",
        "access_token_expires_in": 31536000,
        "refresh_token": "rhsO0MhPdHg7obr5104L8EEmhIHUQ4g1x8KHlZvuJwFi03nRzWgMDxMTfIIwlR",
        "refresh_token_expires_in": 31536000
    },
    "status": 200
}
```

2. 令牌刷新
请求方式：POST请求

请求协议：https协议

请求接口：https://open.dewu.com/api/v1/h5/passport/v1/oauth2/refresh_token

请求header：Content-Type:application/json

| 参数名称      | 是否必传 | 参数值 | 参数说明                                      |
| :------------ | :------- | :----- | :-------------------------------------------- |
| client_id     | yes      |        | 应用appKey,在dop开放平台，应用详情可查看      |
| client_secret | yes      |        | 应用secret,创建应用时生成，看在应用详情页查看 |
| refresh_token | yes      |        | 授权返回的refresh_token                       |

入参示例：

入参示例
```
{ "client_id": "eb2c253e144bbc91946ef8f8cc9d2f", "client_secret": "9f9db3a690492796acc8692cddbcab1d86321ab65f469d911fee74802fce7e", "refresh_token": "rhsO0MhPdHobrxc5104L8EEmhIHUQ4g1x8KHlZvuJwFi03nRzWgMDxMTfIIwlR" }
```

返参示例：

返参示例
```
{ "code": 200, "msg": "success", "data": { "scope": [ "all" ], "open_id": "GvAzWrxfFjIPrJ23", "access_token": "tNb6TDY67oLZ2gjKfiZ7VoChm7iN21GxARAiGN4JswZHPP0qjLla3TNZmCLoqB", "access_token_expires_in": 31536000, "refresh_token": "rhsO0MhPdHg7obrxc5108EEmhIHUQ4g1x8KHlZvuJwFi03nRzWgMDxMTfIIwlR", "refresh_token_expires_in": 31535741 }, "status": 200 }
```


3. 开票申请列表拉取
POST https://openapi.dewu.com/dop/api/v1/invoice/list
要求可以有前端配置返回的数据，可以找地方保存数据
开票申请列表【开票管理】

开票申请列表。注意：开票数据只能查询一年内的数据

POST

/dop/api/v1/invoice/list



需要授权

免费

更新时间：2022-07-13 20:58:21

API工具

公共参数

请求头参数

| 参数名称     | 位置   | 类型             |
| :----------- | :----- | :--------------- |
| Content-Type | header | application/json |

请求地址

| 环境     | 类型                                                     |
| :------- | :------------------------------------------------------- |
| 正式环境 | https://openapi.dewu.com/dop/api/v1/invoice/list         |
| 沙箱环境 | https://openapi-sandbox.dewu.com/dop/api/v1/invoice/list |

请求公共参数

| 参数名称     | 参数类型 | 是否必填 | 参数示例          | 参数描述           |
| :----------- | :------- | :------- | :---------------- | :----------------- |
| app_key      | String   | 必填     | your_app_key      | 应用标识           |
| access_token | String   | ISV必填  | your_access_token | 请求令牌           |
| timestamp    | Long     | 必填     | 1648888088814     | 当前时间戳（毫秒） |
| sign         | String   | 必填     | the_sign_string   | 签名               |

请求参数

| 参数名称           | 参数类型 | 是否必填 | 参数示例            | 参数描述                                                     |
| :----------------- | :------- | :------- | :------------------ | :----------------------------------------------------------- |
| page_no            | Integer  | 必填     | 1                   | 页数                                                         |
| spu_id             | Long     | 非必填   | 1                   | 商品spuId                                                    |
| status             | Integer  | 非必填   | 0                   | 开票状态：（0：卖家待处理，1：运营审核中，2：运营审核通过，3：运营已驳回，4：买家已取消，5：卖家已驳回，6：待买家处理），默认查询卖家待处理的数据 |
| order_no           | String   | 非必填   | 1100113245          | 订单号                                                       |
| page_size          | Integer  | 必填     | 20                  | 一页条数，最大值为20                                         |
| apply_start_time   | String   | 非必填   | 2022-06-05 23:54:48 | 申请时间开始时间，时间格式：yyyy-MM-dd HH:mm:ss，默认查询一年数据 |
| apply_end_time     | String   | 非必填   | 2022-06-05 23:54:48 | 申请时间结束时间，时间格式：yyyy-MM-dd HH:mm:ss，默认查询一年数据 |
| invoice_title_type | Integer  | 非必填   | 1                   | 发票抬头类型： 1：个人或事业单位 ，2 ：企业                  |

返回参数

| 参数名称 | 参数类型 | 参数示例 | 参数描述     |
| :------- | :------- | :------- | :----------- |
| trace_id | String   | 200      | 链路跟踪     |
| msg      | String   | 200      | 异常信息     |
| code     | Long     | 200      | 返回码       |
| data     | object   | 200      | 返回结果实体 |

请求示例

CURL

JAVA



```
curl -X POST 'https://openapi.dewu.com/dop/api/v1/invoice/list' \ -H 'Content-Type:application/json' \ -d '{"timestamp":1648888088814,"page_size":20,"invoice_title_type":1,"apply_start_time":"2022-06-05 23:54:48","order_no":"1100113245","status":0,"access_token":"your_access_token","sign":"the_sign_string","apply_end_time":"2022-06-05 23:54:48","page_no":1,"app_key":"your_app_key","spu_id":1}' 
```

响应示例

copy

```
{  "trace_id": "200",  "msg": "200",  "code": 200,  "data": {    "page_no": 1,    "page_size": 20,    "total_results": 100,    "list": [      {        "invoice_title": "得物",        "seller_reject_reason": "查询不到公司税号",        "verify_time": "2022-06-05 23:54:48",        "category_type": 1,        "order_time": "2022-06-05 23:54:48",        "invoice_image_url": "发票图片url路径",        "bank_name": "中国银行",        "invoice_type": 1,        "company_address": "湖南省长沙市天心区赤岭路45号长沙理工大学金盆岭校区",        "article_number": "iPhone 12-黑色",        "bidding_price": 25900,        "spu_id": 1,        "invoice_title_type": 1,        "spu_title": "【现货发售】Apple iPhone 12 黑色 全网通双卡双待5G手机",        "bank_account": "开户银行",        "status": 0,        "upload_time": "2022-06-05 23:54:48",        "apply_time": "2022-06-05 23:54:48",        "company_phone": "注册电话",        "handle_flag": 1,        "amount": 25900,        "seller_post": {          "express_no": "SF1301946631496",          "take_end_time": "2021-05-21 11:00:00",          "sender_name": "张三",          "take_start_time": "2021-05-21 10:00:00",          "logistics_name": "顺丰速运",          "sender_full_address": "上海市普陀区交通局**号"        },        "sku_id": 1,        "reject_time": "2021-05-21 11:00:00",        "order_no": "11001232435",        "properties": "官方标配          128GB",        "tax_number": "税号",        "reject_reason": "驳回原因",        "seller_post_appointment": false      }    ]  } }
```

API相关权限包

| 拥有此接口的权限包 | 可获得/可申请该权限包的应用类型 |
| :----------------- | :------------------------------ |
| 商家基础能力       | 网站应用                        |

4. 开票处理
POST https://openapi.dewu.com/dop/api/v1/invoice/handle
开票处理【开票管理】

注意：仅状态为待卖家处理的开票申请可处理

POST

/dop/api/v1/invoice/handle



需要授权

免费

更新时间：2022-07-13 19:39:14

API工具

公共参数

请求头参数

| 参数名称     | 位置   | 类型             |
| :----------- | :----- | :--------------- |
| Content-Type | header | application/json |

请求地址

| 环境     | 类型                                                       |
| :------- | :--------------------------------------------------------- |
| 正式环境 | https://openapi.dewu.com/dop/api/v1/invoice/handle         |
| 沙箱环境 | https://openapi-sandbox.dewu.com/dop/api/v1/invoice/handle |

请求公共参数

| 参数名称     | 参数类型 | 是否必填 | 参数示例          | 参数描述           |
| :----------- | :------- | :------- | :---------------- | :----------------- |
| app_key      | String   | 必填     | your_app_key      | 应用标识           |
| access_token | String   | ISV必填  | your_access_token | 请求令牌           |
| timestamp    | Long     | 必填     | 1648888088814     | 当前时间戳（毫秒） |
| sign         | String   | 必填     | the_sign_string   | 签名               |

请求参数

| 参数名称         | 参数类型 | 是否必填 | 参数示例     | 参数描述                                                     |
| :--------------- | :------- | :------- | :----------- | :----------------------------------------------------------- |
| order_no         | String   | 必填     | 110011234354 | 订单号                                                       |
| image_key        | String   | 非必填   | 图片key      | 发票上传的文件key，如果operation_type为1（同意），则此项必填 |
| category_type    | Integer  | 必填     | 1            | 发票类别：1：电子发票，2：纸质发票                           |
| reject_operation | Integer  | 非必填   | 103          | 拒绝原因：103：请提供真实姓名，否则无法开具个人抬头发票，104：税号与开票公司名称不匹配，请核实，105：因疫情暂无法开具或邮寄，请过段时间再申请。如果operation_type选择2（拒绝），此项必填 |
| operation_type   | Integer  | 必填     | 1            | 操作类型：1：同意，2：拒绝                                   |

返回参数

| 参数名称 | 参数类型 | 参数示例 | 参数描述     |
| :------- | :------- | :------- | :----------- |
| trace_id | String   | 200      | 链路跟踪     |
| msg      | String   | 200      | 异常信息     |
| code     | Long     | 200      | 返回码       |
| data     | object   | 200      | 返回结果实体 |

请求示例

CURL

JAVA



copy

```
curl -X POST 'https://openapi.dewu.com/dop/api/v1/invoice/handle' \ -H 'Content-Type:application/json' \ -d '{"timestamp":1648888088814,"category_type":1,"reject_operation":103,"order_no":"110011234354","access_token":"your_access_token","sign":"the_sign_string","image_key":"图片key","app_key":"your_app_key","operation_type":1}' 
```

响应示例

copy

```
{  "trace_id": "200",  "msg": "200",  "code": 200,  "data": {} }
```

API相关权限包

| 拥有此接口的权限包 | 可获得/可申请该权限包的应用类型 |
| :----------------- | :------------------------------ |
| 商家基础能力       | 网站应用                        |

5. 查询商户基础信息
POST https://openapi.dewu.com/dop/api/v1/common/merchant/base/info
查询商户基础信息

查询商户基础信息

POST

/dop/api/v1/common/merchant/base/info



需要授权

免费

更新时间：2024-09-18 16:31:32

API工具

公共参数

请求头参数

| 参数名称     | 位置   | 类型             |
| :----------- | :----- | :--------------- |
| Content-Type | header | application/json |

请求地址

| 环境     | 类型                                                         |
| :------- | :----------------------------------------------------------- |
| 正式环境 | https://openapi.dewu.com/dop/api/v1/common/merchant/base/info |
| 沙箱环境 | https://openapi-sandbox.dewu.com/dop/api/v1/common/merchant/base/info |

请求公共参数

| 参数名称     | 参数类型 | 是否必填 | 参数示例          | 参数描述           |
| :----------- | :------- | :------- | :---------------- | :----------------- |
| app_key      | String   | 必填     | your_app_key      | 应用标识           |
| access_token | String   | ISV必填  | your_access_token | 请求令牌           |
| timestamp    | Long     | 必填     | 1648888088814     | 当前时间戳（毫秒） |
| sign         | String   | 必填     | the_sign_string   | 签名               |

请求参数

| 参数名称 | 参数类型 | 是否必填 | 参数示例 | 参数描述 |
| :------- | :------- | :------- | :------- | :------- |
| No Data  |          |          |          |          |

返回参数

| 参数名称 | 参数类型 | 参数示例 | 参数描述         |
| :------- | :------- | :------- | :--------------- |
| domain   | string   | -        | -                |
| code     | number   | -        | -                |
| msg      | string   | -        | -                |
| data     | object   | -        | MerchantResponse |
| errors   | array    | -        | Error            |

请求示例

CURL

JAVA



copy

```
curl -X POST 'https://openapi.dewu.com/dop/api/v1/common/merchant/base/info' \ -H 'Content-Type:application/json' \ -d '{"timestamp":1648888088814,"access_token":"your_access_token","sign":"the_sign_string","app_key":"your_app_key"}' 
```

响应示例

copy

```
{  "domain": "",  "code": "",  "msg": "",  "data": {    "merchant_id": "",    "type_id": ""  },  "errors": [    {      "name": "",      "message": ""    }  ] }
```

API相关权限包

| 拥有此接口的权限包 | 可获得/可申请该权限包的应用类型 |
| :----------------- | :------------------------------ |
| 商家基础能力       | 网站应用                        |