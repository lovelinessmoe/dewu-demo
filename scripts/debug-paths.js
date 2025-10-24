#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

console.log('=== Path Debugging Information ===');
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('');

console.log('=== Checking for index.html ===');
const possiblePaths = [
  'index.html',
  'src/client/index.html',
  path.resolve(process.cwd(), 'index.html'),
  path.resolve(process.cwd(), 'src/client/index.html'),
  path.resolve(__dirname, '../index.html'),
  path.resolve(__dirname, '../src/client/index.html'),
];

possiblePaths.forEach(p => {
  const exists = fs.existsSync(p);
  console.log(`${exists ? '✅' : '❌'} ${p}`);
});

console.log('');
console.log('=== Directory Structure ===');
try {
  const srcExists = fs.existsSync('src');
  console.log(`src/ exists: ${srcExists}`);
  
  if (srcExists) {
    const clientExists = fs.existsSync('src/client');
    console.log(`src/client/ exists: ${clientExists}`);
    
    if (clientExists) {
      const files = fs.readdirSync('src/client');
      console.log('Files in src/client/:', files.join(', '));
    }
  }
} catch (error) {
  console.error('Error checking directory structure:', error.message);
}
