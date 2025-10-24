import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest configuration specifically for deployment tests
 * 
 * This configuration is optimized for testing build processes,
 * Vercel deployment integration, and cross-browser compatibility
 */

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/test/build-process.test.ts',
      'src/test/vercel-deployment.test.ts', 
      'src/test/cross-browser-compatibility.test.ts'
    ],
    exclude: [
      'node_modules',
      'dist',
      'src/test/system-validation.test.ts', // Exclude other tests
      'src/test/error-check.test.ts',
      'src/**/*.sorting.test.ts'
    ],
    testTimeout: 120000, // 2 minutes for build tests
    hookTimeout: 30000,  // 30 seconds for setup/teardown
    teardownTimeout: 30000,
    // Run tests sequentially to avoid build conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    // Retry failed tests once (builds can be flaky)
    retry: 1,
    // Detailed reporting for CI/CD
    reporter: ['verbose', 'json'],
    outputFile: {
      json: './deployment-test-results.json'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/client': path.resolve(__dirname, './src/client'),
      '@/server': path.resolve(__dirname, './src/server'),
      '@/shared': path.resolve(__dirname, './src/shared'),
    },
  },
  // Ensure we can access file system for build verification
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'test'),
  }
});