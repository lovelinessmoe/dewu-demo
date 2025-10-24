import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'automatic',
    jsxImportSource: 'react',
    // Ensure React is properly configured for production builds
    babel: {
      plugins: [],
      presets: []
    }
  })],
  // Use relative path for root - Vite will resolve it correctly
  root: 'src/client',
  publicDir: 'public',
  build: {
    // Use absolute path for output directory
    outDir: path.resolve(__dirname, 'dist/client'),
    emptyOutDir: true,
    // Ensure React is included in the bundle and not externalized
    rollupOptions: {
      // Let Vite automatically find index.html in the root directory
      // Prevent React from being externalized in production
      external: [],
      output: {
        // Ensure proper chunking for React dependencies
        manualChunks: {
          react: ['react', 'react-dom']
        }
      }
    },
    // Optimize build for production deployment
    minify: true,
    sourcemap: false,
    // Ensure all dependencies are bundled
    commonjsOptions: {
      include: [/node_modules/]
    }
  },
  // Define global variables for production builds
  define: {
    // Ensure React is available globally if needed
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    // Prevent React from being undefined in production
    global: 'globalThis'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/client': path.resolve(__dirname, './src/client'),
      '@/shared': path.resolve(__dirname, './src/shared'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/dop': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})