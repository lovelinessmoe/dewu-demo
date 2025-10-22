#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting server build...');

// Check if source directories exist
const srcServer = path.join(process.cwd(), 'src/server');
const srcShared = path.join(process.cwd(), 'src/shared');

console.log('Checking directories:');
console.log('- src/server exists:', fs.existsSync(srcServer));
console.log('- src/shared exists:', fs.existsSync(srcShared));

if (fs.existsSync(srcShared)) {
  const sharedFiles = fs.readdirSync(srcShared, { recursive: true });
  console.log('- src/shared files:', sharedFiles);
}

try {
  // Try to build with TypeScript
  console.log('Running TypeScript compiler...');
  execSync('npx tsc -p tsconfig.server.json', { stdio: 'inherit' });
  console.log('Server build completed successfully!');
} catch (error) {
  console.error('TypeScript build failed:', error.message);
  process.exit(1);
}