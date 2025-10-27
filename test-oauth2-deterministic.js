/**
 * 测试 OAuth2 API 的确定性 token 生成
 * 通过实际的 HTTP 请求验证
 */

const http = require('http');

// 测试配置
const API_HOST = 'localhost';
const API_PORT = 3000;

// 辅助函数：发送 HTTP POST 请求
function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ statusCode: res.statusCode, body: response });
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

// 主测试函数
async function runTests() {
  console.log('=== OAuth2 确定性 Token 生成 API 测试 ===\n');
  console.log(`测试服务器: http://${API_HOST}:${API_PORT}\n`);

  try {
    // 测试 1: 相同的 authorization_code 生成相同的 open_id
    console.log('测试 1: 相同的 authorization_code 应该生成相同的 open_id');
    const tokenRequest = {
      client_id: 'test_client_001',
      client_secret: 'test_secret_001',
      authorization_code: 'FIXED_AUTH_CODE_12345'
    };

    const response1 = await makeRequest('/api/v1/h5/passport/v1/oauth2/token', tokenRequest);
    const response2 = await makeRequest('/api/v1/h5/passport/v1/oauth2/token', tokenRequest);

    console.log('第一次请求 open_id:', response1.body.data.open_id);
    console.log('第二次请求 open_id:', response2.body.data.open_id);
    console.log('是否相同:', response1.body.data.open_id === response2.body.data.open_id ? '✓ 通过' : '✗ 失败');
    console.log();

    // 测试 2: 不同的 authorization_code 生成不同的 open_id
    console.log('测试 2: 不同的 authorization_code 应该生成不同的 open_id');
    const tokenRequest2 = {
      client_id: 'test_client_001',
      client_secret: 'test_secret_001',
      authorization_code: 'DIFFERENT_AUTH_CODE_67890'
    };

    const response3 = await makeRequest('/api/v1/h5/passport/v1/oauth2/token', tokenRequest2);
    console.log('第一个 auth_code 的 open_id:', response1.body.data.open_id);
    console.log('第二个 auth_code 的 open_id:', response3.body.data.open_id);
    console.log('是否不同:', response1.body.data.open_id !== response3.body.data.open_id ? '✓ 通过' : '✗ 失败');
    console.log();

    // 测试 3: 验证 access_token 也是确定性的
    console.log('测试 3: 验证 access_token 的一致性');
    console.log('注意: access_token 包含时间戳，所以会不同，但 open_id 应该相同');
    console.log('第一次 access_token 前20字符:', response1.body.data.access_token.substring(0, 20));
    console.log('第二次 access_token 前20字符:', response2.body.data.access_token.substring(0, 20));
    console.log('open_id 相同:', response1.body.data.open_id === response2.body.data.open_id ? '✓ 通过' : '✗ 失败');
    console.log();

    // 测试 4: 使用 refresh_token 刷新，验证 open_id 保持不变
    console.log('测试 4: 使用 refresh_token 刷新后，open_id 应该保持不变');
    const refreshRequest = {
      client_id: 'test_client_001',
      client_secret: 'test_secret_001',
      refresh_token: response1.body.data.refresh_token
    };

    const response4 = await makeRequest('/api/v1/h5/passport/v1/oauth2/refresh_token', refreshRequest);
    console.log('原始 open_id:', response1.body.data.open_id);
    console.log('刷新后 open_id:', response4.body.data.open_id);
    console.log('是否相同:', response1.body.data.open_id === response4.body.data.open_id ? '✓ 通过' : '✗ 失败');
    console.log();

    // 测试 5: 验证 open_id 格式
    console.log('测试 5: 验证 open_id 格式（16个十六进制字符）');
    const openIdPattern = /^[0-9a-f]{16}$/;
    console.log('open_id:', response1.body.data.open_id);
    console.log('长度:', response1.body.data.open_id.length);
    console.log('格式正确:', openIdPattern.test(response1.body.data.open_id) ? '✓ 通过' : '✗ 失败');
    console.log();

    console.log('=== 所有测试完成 ===');
    
  } catch (error) {
    console.error('测试失败:', error.message);
    console.error('请确保服务器正在运行: npm run dev');
    process.exit(1);
  }
}

// 运行测试
runTests();
