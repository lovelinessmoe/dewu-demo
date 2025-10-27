/**
 * 测试确定性 open_id 生成
 * 验证相同的 authorization_code 总是生成相同的 open_id
 */

const { BusinessLogic } = require('./src/shared/core/index.js');

console.log('=== 测试确定性 open_id 生成 ===\n');

const businessLogic = new BusinessLogic();

// 测试用例 1: 相同的 authorization_code 应该生成相同的 open_id
console.log('测试 1: 相同的 authorization_code 应该生成相同的 open_id');
const testData1 = {
  client_id: 'test_client_123',
  client_secret: 'test_secret_456',
  authorization_code: 'AUTH_CODE_ABC123'
};

const result1a = businessLogic.generateToken(testData1);
const result1b = businessLogic.generateToken(testData1);

console.log('第一次调用 open_id:', result1a.data.data.open_id);
console.log('第二次调用 open_id:', result1b.data.data.open_id);
console.log('是否相同:', result1a.data.data.open_id === result1b.data.data.open_id ? '✓ 通过' : '✗ 失败');
console.log();

// 测试用例 2: 不同的 authorization_code 应该生成不同的 open_id
console.log('测试 2: 不同的 authorization_code 应该生成不同的 open_id');
const testData2 = {
  client_id: 'test_client_123',
  client_secret: 'test_secret_456',
  authorization_code: 'AUTH_CODE_XYZ789'
};

const result2 = businessLogic.generateToken(testData2);
console.log('第一个 auth_code 的 open_id:', result1a.data.data.open_id);
console.log('第二个 auth_code 的 open_id:', result2.data.data.open_id);
console.log('是否不同:', result1a.data.data.open_id !== result2.data.data.open_id ? '✓ 通过' : '✗ 失败');
console.log();

// 测试用例 3: 相同的 authorization_code 但不同的 client_id 应该生成不同的 open_id
console.log('测试 3: 相同的 authorization_code 但不同的 client_id 应该生成不同的 open_id');
const testData3 = {
  client_id: 'different_client_999',
  client_secret: 'test_secret_456',
  authorization_code: 'AUTH_CODE_ABC123'
};

const result3 = businessLogic.generateToken(testData3);
console.log('client_id=test_client_123 的 open_id:', result1a.data.data.open_id);
console.log('client_id=different_client_999 的 open_id:', result3.data.data.open_id);
console.log('是否不同:', result1a.data.data.open_id !== result3.data.data.open_id ? '✓ 通过' : '✗ 失败');
console.log();

// 测试用例 4: 验证 open_id 格式（应该是16个字符的十六进制字符串）
console.log('测试 4: 验证 open_id 格式');
const openIdPattern = /^[0-9a-f]{16}$/;
console.log('open_id:', result1a.data.data.open_id);
console.log('长度:', result1a.data.data.open_id.length);
console.log('格式正确:', openIdPattern.test(result1a.data.data.open_id) ? '✓ 通过' : '✗ 失败');
console.log();

// 测试用例 5: 多次调用验证一致性
console.log('测试 5: 多次调用验证一致性（10次）');
const testData5 = {
  client_id: 'consistency_test',
  client_secret: 'secret',
  authorization_code: 'CONSISTENT_CODE'
};

const openIds = [];
for (let i = 0; i < 10; i++) {
  const result = businessLogic.generateToken(testData5);
  openIds.push(result.data.data.open_id);
}

const allSame = openIds.every(id => id === openIds[0]);
console.log('生成的 open_id:', openIds[0]);
console.log('10次调用是否都相同:', allSame ? '✓ 通过' : '✗ 失败');
console.log();

console.log('=== 测试完成 ===');
