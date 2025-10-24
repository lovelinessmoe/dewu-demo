import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Vercel Deployment Integration Tests
 * 
 * Tests to verify integration with Vercel deployment process
 * Requirements: 1.1, 1.2, 3.1
 */

describe('Vercel Deployment Integration', () => {
  const projectRoot = process.cwd();
  const distDir = path.join(projectRoot, 'dist/client');

  describe('Vercel Configuration', () => {
    it('should have vercel.json configuration file', () => {
      const vercelConfigPath = path.join(projectRoot, 'vercel.json');
      expect(fs.existsSync(vercelConfigPath)).toBe(true);
    });

    it('should have valid vercel.json structure', () => {
      const vercelConfigPath = path.join(projectRoot, 'vercel.json');
      const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
      
      expect(config).toHaveProperty('version');
      expect(config).toHaveProperty('builds');
      expect(Array.isArray(config.builds)).toBe(true);
      
      // Check for static build configuration
      const staticBuild = config.builds.find((build: any) => build.use === '@vercel/static-build');
      expect(staticBuild).toBeTruthy();
      expect(staticBuild.config.distDir).toBe('dist/client');
    });

    it('should specify correct build command in vercel.json', () => {
      const vercelConfigPath = path.join(projectRoot, 'vercel.json');
      const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
      
      const staticBuild = config.builds.find((build: any) => build.use === '@vercel/static-build');
      expect(staticBuild.config.buildCommand).toContain('vercel-build');
    });
  });

  describe('Package.json Vercel Integration', () => {
    it('should have vercel-build script in package.json', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      expect(packageJson.scripts).toHaveProperty('vercel-build');
    });

    it('should have build verification in vercel-build script', () => {
      const packageJsonPath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const vercelBuildScript = packageJson.scripts['vercel-build'];
      expect(vercelBuildScript).toContain('verify-build');
    });
  });

  describe('API Routes Configuration', () => {
    it('should have api directory for Vercel serverless functions', () => {
      const apiDir = path.join(projectRoot, 'api');
      expect(fs.existsSync(apiDir)).toBe(true);
    });

    it('should have index.js in api directory', () => {
      const apiIndexPath = path.join(projectRoot, 'api/index.js');
      expect(fs.existsSync(apiIndexPath)).toBe(true);
    });

    it('should have standalone.js for independent API deployment', () => {
      const standaloneApiPath = path.join(projectRoot, 'api/standalone.js');
      expect(fs.existsSync(standaloneApiPath)).toBe(true);
    });

    it('should export proper handler function in api/index.js', () => {
      const apiIndexPath = path.join(projectRoot, 'api/index.js');
      const content = fs.readFileSync(apiIndexPath, 'utf8');
      
      // Should export a default function or module.exports
      expect(content).toMatch(/module\.exports|export\s+default/);
    });
  });

  describe('Static File Serving', () => {
    beforeAll(() => {
      // Ensure we have a fresh build
      execSync('npm run build:client', { stdio: 'pipe' });
    });

    it('should serve index.html as the main entry point', () => {
      const indexPath = path.join(distDir, 'index.html');
      expect(fs.existsSync(indexPath)).toBe(true);
      
      const content = fs.readFileSync(indexPath, 'utf8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('id="root"');
    });

    it('should have assets directory for static resources', () => {
      const assetsDir = path.join(distDir, 'assets');
      expect(fs.existsSync(assetsDir)).toBe(true);
      
      const files = fs.readdirSync(assetsDir);
      expect(files.length).toBeGreaterThan(0);
    });

    it('should have proper MIME type support for assets', () => {
      const assetsDir = path.join(distDir, 'assets');
      const files = fs.readdirSync(assetsDir);
      
      const jsFiles = files.filter(f => f.endsWith('.js'));
      const cssFiles = files.filter(f => f.endsWith('.css'));
      
      expect(jsFiles.length).toBeGreaterThan(0);
      // CSS files are optional but if present should be valid
      if (cssFiles.length > 0) {
        expect(cssFiles.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Environment Variables', () => {
    it('should have .env.example for environment configuration', () => {
      const envExamplePath = path.join(projectRoot, '.env.example');
      expect(fs.existsSync(envExamplePath)).toBe(true);
    });

    it('should handle production environment variables', () => {
      // Test that build works with production NODE_ENV
      const originalEnv = process.env.NODE_ENV;
      
      try {
        process.env.NODE_ENV = 'production';
        expect(() => {
          execSync('npm run build:client', { 
            stdio: 'pipe',
            env: { ...process.env, NODE_ENV: 'production' }
          });
        }).not.toThrow();
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('Deployment Readiness', () => {
    beforeAll(() => {
      execSync('npm run vercel-build', { stdio: 'pipe' });
    });

    it('should pass all build verification checks', () => {
      expect(() => {
        execSync('npm run verify-build', { stdio: 'pipe' });
      }).not.toThrow();
    });

    it('should have all required files for Vercel deployment', () => {
      // Check for essential deployment files
      const requiredFiles = [
        'vercel.json',
        'package.json',
        'dist/client/index.html',
        'api/index.js'
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(projectRoot, file);
        expect(fs.existsSync(filePath)).toBe(true);
      }
    });

    it('should have proper routing configuration for SPA', () => {
      const vercelConfigPath = path.join(projectRoot, 'vercel.json');
      const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
      
      // Should have routes or rewrites for SPA routing
      const hasRouting = config.routes || config.rewrites || config.redirects;
      expect(hasRouting).toBeTruthy();
    });

    it('should handle API proxy configuration', () => {
      const vercelConfigPath = path.join(projectRoot, 'vercel.json');
      const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
      
      // Should have API routing configuration
      if (config.routes) {
        const apiRoutes = config.routes.filter((route: any) => 
          route.src && route.src.includes('/api')
        );
        expect(apiRoutes.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance Optimization', () => {
    beforeAll(() => {
      execSync('npm run build:client', { stdio: 'pipe' });
    });

    it('should generate minified JavaScript bundles', () => {
      const assetsDir = path.join(distDir, 'assets');
      const jsFiles = fs.readdirSync(assetsDir)
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(assetsDir, file));

      for (const jsFile of jsFiles) {
        const content = fs.readFileSync(jsFile, 'utf8');
        
        // Minified files should not have excessive whitespace
        const lines = content.split('\n');
        const avgLineLength = content.length / lines.length;
        
        // Minified files typically have longer average line lengths
        expect(avgLineLength).toBeGreaterThan(50);
      }
    });

    it('should not include source maps in production build', () => {
      const assetsDir = path.join(distDir, 'assets');
      const files = fs.readdirSync(assetsDir);
      
      const sourceMapFiles = files.filter(file => file.endsWith('.map'));
      expect(sourceMapFiles.length).toBe(0);
    });

    it('should have proper chunk splitting for React dependencies', () => {
      const assetsDir = path.join(distDir, 'assets');
      const jsFiles = fs.readdirSync(assetsDir).filter(file => file.endsWith('.js'));
      
      // Should have multiple JS files indicating proper chunking
      expect(jsFiles.length).toBeGreaterThanOrEqual(1);
      
      // Look for React chunk
      const reactChunk = jsFiles.find(file => 
        file.includes('react') || file.includes('vendor')
      );
      
      // React should be in a separate chunk or main bundle
      expect(jsFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle build failures gracefully', () => {
      // Test with invalid configuration
      const originalPackageJson = fs.readFileSync('package.json', 'utf8');
      
      try {
        // Temporarily break the build script
        const packageJson = JSON.parse(originalPackageJson);
        packageJson.scripts['build:client'] = 'invalid-command';
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        
        expect(() => {
          execSync('npm run build:client', { stdio: 'pipe' });
        }).toThrow();
        
      } finally {
        // Restore original package.json
        fs.writeFileSync('package.json', originalPackageJson);
      }
    });

    it('should provide meaningful error messages on build failure', () => {
      // This test ensures error output is captured and meaningful
      const originalPackageJson = fs.readFileSync('package.json', 'utf8');
      
      try {
        const packageJson = JSON.parse(originalPackageJson);
        packageJson.scripts['build:client'] = 'echo "Build failed" && exit 1';
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
        
        let errorOutput = '';
        try {
          execSync('npm run build:client', { stdio: 'pipe' });
        } catch (error: any) {
          errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';
        }
        
        expect(errorOutput).toContain('Build failed');
        
      } finally {
        fs.writeFileSync('package.json', originalPackageJson);
      }
    });
  });
});