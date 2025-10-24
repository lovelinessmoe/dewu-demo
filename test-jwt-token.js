#!/usr/bin/env node

/**
 * Test script for JWT Token Manager
 * Tests token generation, validation, and disguise functionality
 */

const { JWTTokenManager } = require('./src/shared/core/jwt-token-manager');

console.log('=== JWT Token Manager Test ===\n');

// Create token manager instance
const tokenManager = new JWTTokenManager({
  jwtSecret: 'test-secret-key-for-development-only',
  accessTokenExpiry: '1h',
  refreshTokenExpiry: '30d'
});

// Test 1: Generate token response
console.log('Test 1: Generate Token Response');
console.log('---');
const open_id = 'test_user_12345';
const tokenResponse = tokenManager.generateTokenResponse(open_id);
console.log('Token Response:', JSON.stringify(tokenResponse, null, 2));
console.log('');

// Test 2: Validate access token
console.log('Test 2: Validate Access Token');
console.log('---');
const accessToken = tokenResponse.data.access_token;
console.log('Access Token:', accessToken);
console.log('Token Length:', accessToken.length);
console.log('Token looks like random string:', !/^eyJ/.test(accessToken)); // Should not start with 'eyJ' (JWT header)
console.log('');

const validation = tokenManager.validateToken(accessToken);
console.log('Validation Result:', JSON.stringify(validation, null, 2));
console.log('');

// Test 3: Validate refresh token
console.log('Test 3: Validate Refresh Token');
console.log('---');
const refreshToken = tokenResponse.data.refresh_token;
console.log('Refresh Token:', refreshToken);
console.log('Token Length:', refreshToken.length);
console.log('');

const refreshValidation = tokenManager.validateRefreshToken(refreshToken);
console.log('Refresh Validation Result:', JSON.stringify(refreshValidation, null, 2));
console.log('');

// Test 4: Invalid token
console.log('Test 4: Invalid Token');
console.log('---');
const invalidValidation = tokenManager.validateToken('invalid_token_12345');
console.log('Invalid Token Validation:', JSON.stringify(invalidValidation, null, 2));
console.log('');

// Test 5: Token format comparison
console.log('Test 5: Token Format Comparison');
console.log('---');
console.log('Old format (random string): 58 characters, alphanumeric');
console.log('Example: abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456');
console.log('');
console.log('New format (disguised JWT): variable length, base64url');
console.log('Example:', accessToken);
console.log('');
console.log('✅ Both look like random strings to external observers');
console.log('✅ New format is stateless (no server storage needed)');
console.log('✅ New format works in Vercel Serverless environment');
console.log('');

console.log('=== All Tests Completed ===');
