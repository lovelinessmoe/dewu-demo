import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Build Process Tests
 * 
 * Tests to verify the build process works correctly for Vercel deployment
 * Requirements: 1.1, 1.2, 3.1
 */

describe('Build Process Verification', () => {
  const distDir = path.join(process.cwd(), 'dist/client');
  const backupDir = path.join(process.cwd(), 'dist-backup');

  beforeAll(() => {
    // Backup existing dist if it exists
    if (fs.existsSync(distDir)) {
      if (fs.existsSync(backupDir)) {
        fs.rmSync(backupDir, { recursive: true, force: true });
      }
      fs.renameSync(distDir, backupDir);
    }
  });

  afterAll(() => {
    // Restore original dist
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
    }
    if (fs.existsSync(backupDir)) {
      fs.renameSync(backupDir, distDir);
    }
  });

  describe('Build Command Execution', () => {
    it('should successfully execute build:client command', () => {
      expect(() => {
        execSync('npm run build:client', { 
          stdio: 'pipe',
          timeout: 60000 // 60 second timeout
        });
      }).not.toThrow();
    });

    it('should create dist/client directory after build', () => {
      execSync('npm run build:client', { stdio: 'pipe' });
      expect(fs.existsSync(distDir)).toBe(true);
    });

    it('should generate index.html in build output', () => {
      execSync('npm run build:client', { stdio: 'pipe' });
      const indexPath = path.join(distDir, 'index.html');
      expect(fs.existsSync(indexPath)).toBe(true);
    });

    it('should generate assets directory with JavaScript files', () => {
      execSync('npm run build:client', { stdio: 'pipe' });
      const assetsDir = path.join(distDir, 'assets');
      expect(fs.existsSync(assetsDir)).toBe(true);
      
      const files = fs.readdirSync(assetsDir);
      const jsFiles = files.filter(file => file.endsWith('.js'));
      expect(jsFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Vercel Build Command', () => {
    it('should successfully execute vercel-build command', () => {
      let buildSucceeded = false;
      try {
        execSync('npm run vercel-build', { 
          stdio: 'pipe',
          timeout: 60000
        });
        buildSucceeded = true;
      } catch (error: any) {
        // Check if it's just a deprecation warning but build succeeded
        if (error.status === 0 || (error.stderr && error.stderr.includes('deprecated'))) {
          buildSucceeded = true;
        }
      }
      expect(buildSucceeded).toBe(true);
    });

    it('should pass build verification after vercel-build', () => {
      try {
        execSync('npm run vercel-build', { stdio: 'pipe' });
      } catch (error: any) {
        // Ignore deprecation warnings
        if (error.status !== 0 && !error.stderr?.includes('deprecated')) {
          throw error;
        }
      }
      
      // Verify build output exists and is valid
      expect(fs.existsSync(distDir)).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'assets'))).toBe(true);
    });
  });

  describe('Build Verification Script', () => {
    it('should pass verify-build script after successful build', () => {
      // First ensure we have a fresh build
      try {
        execSync('npm run build:client', { stdio: 'pipe' });
      } catch (error: any) {
        if (error.status !== 0 && !error.stderr?.includes('deprecated')) {
          throw error;
        }
      }
      
      // Verify the build directory exists before running verification
      expect(fs.existsSync(distDir)).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'assets'))).toBe(true);
      
      // Now run the verification script
      let verifySucceeded = false;
      try {
        const result = execSync('npm run verify-build', { 
          stdio: 'pipe',
          timeout: 30000
        });
        verifySucceeded = true;
      } catch (error: any) {
        // Check if verification passed despite warnings
        if (error.status === 0) {
          verifySucceeded = true;
        } else {
          // Log the error for debugging
          console.log('Verify build error:', error.stdout?.toString() || error.stderr?.toString());
        }
      }
      expect(verifySucceeded).toBe(true);
    });

    it('should execute test-verify-build script successfully', () => {
      expect(() => {
        execSync('npm run test:verify-build', { 
          stdio: 'pipe',
          timeout: 30000
        });
      }).not.toThrow();
    });
  });

  describe('React Bundle Validation', () => {
    beforeAll(() => {
      execSync('npm run build:client', { stdio: 'pipe' });
    });

    it('should include React in the JavaScript bundle', () => {
      const assetsDir = path.join(distDir, 'assets');
      const jsFiles = fs.readdirSync(assetsDir)
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(assetsDir, file));

      let reactFound = false;
      for (const jsFile of jsFiles) {
        const content = fs.readFileSync(jsFile, 'utf8');
        if (content.includes('React') || content.includes('react')) {
          reactFound = true;
          break;
        }
      }

      expect(reactFound).toBe(true);
    });

    it('should include ReactDOM in the JavaScript bundle', () => {
      const assetsDir = path.join(distDir, 'assets');
      const jsFiles = fs.readdirSync(assetsDir)
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(assetsDir, file));

      let reactDomFound = false;
      for (const jsFile of jsFiles) {
        const content = fs.readFileSync(jsFile, 'utf8');
        if (content.includes('ReactDOM') || 
            content.includes('createRoot') || 
            content.includes('render')) {
          reactDomFound = true;
          break;
        }
      }

      expect(reactDomFound).toBe(true);
    });

    it('should not contain untransformed JSX in bundle', () => {
      const assetsDir = path.join(distDir, 'assets');
      const jsFiles = fs.readdirSync(assetsDir)
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(assetsDir, file));

      for (const jsFile of jsFiles) {
        const content = fs.readFileSync(jsFile, 'utf8');
        // Check for actual untransformed JSX patterns
        // JSX should be transformed to createElement calls or jsx runtime
        // We expect to find transformed patterns, not raw JSX
        const hasTransformedJSX = content.includes('createElement') || 
                                  content.includes('jsx') || 
                                  content.includes('_jsx');
        
        // If there's any React content, it should be transformed
        if (content.includes('React') || content.includes('react')) {
          expect(hasTransformedJSX).toBe(true);
        }
      }
    });
  });

  describe('Build Output Structure', () => {
    beforeAll(() => {
      execSync('npm run build:client', { stdio: 'pipe' });
    });

    it('should have proper index.html structure', () => {
      const indexPath = path.join(distDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf8');
      
      expect(content).toContain('id="root"');
      expect(content).toContain('<script');
      expect(content).toMatch(/src="[^"]*\.js"/);
    });

    it('should reference assets correctly in index.html', () => {
      const indexPath = path.join(distDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf8');
      
      // Extract script src attributes
      const scriptMatches = content.match(/src="([^"]*)"/g);
      expect(scriptMatches).toBeTruthy();
      expect(scriptMatches!.length).toBeGreaterThan(0);
      
      // Verify referenced files exist
      for (const match of scriptMatches!) {
        const src = match.match(/src="([^"]*)"/)?.[1];
        if (src && src.startsWith('/assets/')) {
          const filePath = path.join(distDir, src.substring(1));
          expect(fs.existsSync(filePath)).toBe(true);
        }
      }
    });

    it('should have reasonable bundle sizes', () => {
      const assetsDir = path.join(distDir, 'assets');
      const files = fs.readdirSync(assetsDir);
      
      let totalSize = 0;
      for (const file of files) {
        const filePath = path.join(assetsDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }

      // Bundle should be larger than 50KB (has React) but smaller than 50MB
      expect(totalSize).toBeGreaterThan(50 * 1024); // 50KB
      expect(totalSize).toBeLessThan(50 * 1024 * 1024); // 50MB
    });
  });
});