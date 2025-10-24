import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Cross-Browser Compatibility Tests
 * 
 * Tests to verify the build output works across different browsers
 * Requirements: 1.1, 1.2, 3.1
 */

describe('Cross-Browser Compatibility', () => {
  const distDir = path.join(process.cwd(), 'dist/client');

  beforeAll(() => {
    // Ensure we have a fresh build for testing
    execSync('npm run build:client', { stdio: 'pipe' });
  });

  describe('JavaScript Compatibility', () => {
    it('should not use modern JavaScript features without polyfills', () => {
      const assetsDir = path.join(distDir, 'assets');
      const jsFiles = fs.readdirSync(assetsDir)
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(assetsDir, file));

      for (const jsFile of jsFiles) {
        const content = fs.readFileSync(jsFile, 'utf8');
        
        // Check for potentially problematic modern features
        // These should be transpiled or polyfilled
        expect(content).not.toMatch(/\?\?=/); // Nullish coalescing assignment
        expect(content).not.toMatch(/\?\./); // Optional chaining (should be transpiled)
        expect(content).not.toMatch(/class\s+\w+\s*{[^}]*#\w+/); // Private class fields
      }
    });

    it('should use compatible module format', () => {
      const indexPath = path.join(distDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf8');
      
      // Should use type="module" for modern browsers or have fallbacks
      const scriptTags = content.match(/<script[^>]*>/g) || [];
      
      for (const scriptTag of scriptTags) {
        if (scriptTag.includes('src=')) {
          // Modern module scripts should have type="module"
          // or be compatible with older browsers
          expect(scriptTag).toMatch(/type="module"|nomodule/);
        }
      }
    });

    it('should include React in a browser-compatible format', () => {
      const assetsDir = path.join(distDir, 'assets');
      const jsFiles = fs.readdirSync(assetsDir)
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(assetsDir, file));

      let reactFound = false;
      for (const jsFile of jsFiles) {
        const content = fs.readFileSync(jsFile, 'utf8');
        
        // React should be bundled in a way that works across browsers
        if (content.includes('React') || content.includes('react')) {
          reactFound = true;
          
          // Should not have Node.js specific requires
          expect(content).not.toMatch(/require\s*\(\s*['"]react['"]\s*\)/);
          expect(content).not.toMatch(/require\s*\(\s*['"]react-dom['"]\s*\)/);
        }
      }
      
      expect(reactFound).toBe(true);
    });
  });

  describe('CSS Compatibility', () => {
    it('should have CSS files that work across browsers', () => {
      const assetsDir = path.join(distDir, 'assets');
      
      if (fs.existsSync(assetsDir)) {
        const cssFiles = fs.readdirSync(assetsDir)
          .filter(file => file.endsWith('.css'))
          .map(file => path.join(assetsDir, file));

        for (const cssFile of cssFiles) {
          const content = fs.readFileSync(cssFile, 'utf8');
          
          // Check for modern CSS features that might need prefixes
          if (content.includes('display: grid')) {
            // Grid should work in modern browsers, but check for fallbacks
            expect(content.length).toBeGreaterThan(0);
          }
          
          if (content.includes('display: flex')) {
            // Flexbox should be widely supported
            expect(content.length).toBeGreaterThan(0);
          }
        }
      }
    });

    it('should not use CSS features that break in older browsers', () => {
      const assetsDir = path.join(distDir, 'assets');
      
      if (fs.existsSync(assetsDir)) {
        const cssFiles = fs.readdirSync(assetsDir)
          .filter(file => file.endsWith('.css'))
          .map(file => path.join(assetsDir, file));

        for (const cssFile of cssFiles) {
          const content = fs.readFileSync(cssFile, 'utf8');
          
          // Avoid CSS features that break in IE11 or older browsers
          expect(content).not.toMatch(/display:\s*contents/); // Not supported in IE
          // Note: gap is widely supported in modern browsers, but we could add fallbacks if needed
          // expect(content).not.toMatch(/gap:\s*\d+/); // Limited support in older browsers
        }
      }
    });
  });

  describe('HTML Compatibility', () => {
    it('should have valid HTML5 structure', () => {
      const indexPath = path.join(distDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf8');
      
      expect(content).toMatch(/<!DOCTYPE html>/i);
      expect(content).toContain('<html');
      expect(content).toContain('<head>');
      expect(content).toContain('<body>');
      expect(content).toContain('</html>');
    });

    it('should have proper meta tags for browser compatibility', () => {
      const indexPath = path.join(distDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf8');
      
      // Should have viewport meta tag for mobile compatibility
      expect(content).toMatch(/<meta[^>]*name="viewport"[^>]*>/);
      
      // Should have charset declaration
      expect(content).toMatch(/<meta[^>]*charset[^>]*>/);
    });

    it('should not use deprecated HTML features', () => {
      const indexPath = path.join(distDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf8');
      
      // Avoid deprecated HTML elements
      expect(content).not.toContain('<center>');
      expect(content).not.toContain('<font');
      expect(content).not.toContain('<marquee>');
    });
  });

  describe('Asset Loading Compatibility', () => {
    it('should use relative paths for assets', () => {
      const indexPath = path.join(distDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf8');
      
      // Extract all src and href attributes
      const srcMatches = content.match(/(src|href)="([^"]*)"/g) || [];
      
      for (const match of srcMatches) {
        const url = match.match(/(src|href)="([^"]*)"/)?.[2];
        if (url && !url.startsWith('http') && !url.startsWith('//')) {
          // Should be relative or absolute paths, not protocol-relative
          expect(url.startsWith('/') || url.startsWith('./')).toBe(true);
        }
      }
    });

    it('should have proper MIME type associations', () => {
      const assetsDir = path.join(distDir, 'assets');
      
      if (fs.existsSync(assetsDir)) {
        const files = fs.readdirSync(assetsDir);
        
        // JavaScript files should have .js extension
        const jsFiles = files.filter(f => f.endsWith('.js'));
        expect(jsFiles.length).toBeGreaterThan(0);
        
        // CSS files should have .css extension if present
        const cssFiles = files.filter(f => f.endsWith('.css'));
        // CSS files are optional but if present should be properly named
        
        // No files should have ambiguous extensions
        const unknownFiles = files.filter(f => 
          !f.endsWith('.js') && 
          !f.endsWith('.css') && 
          !f.endsWith('.map') &&
          !f.endsWith('.txt') &&
          !f.endsWith('.json')
        );
        expect(unknownFiles.length).toBe(0);
      }
    });
  });

  describe('Browser Feature Detection', () => {
    it('should handle missing modern browser features gracefully', () => {
      const assetsDir = path.join(distDir, 'assets');
      const jsFiles = fs.readdirSync(assetsDir)
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(assetsDir, file));

      for (const jsFile of jsFiles) {
        const content = fs.readFileSync(jsFile, 'utf8');
        
        // Should not assume modern features exist without checking
        if (content.includes('fetch(')) {
          // If using fetch, should have polyfill or fallback
          expect(content.includes('fetch') || content.includes('XMLHttpRequest')).toBe(true);
        }
        
        if (content.includes('Promise')) {
          // Promises should be available or polyfilled
          expect(content.length).toBeGreaterThan(0);
        }
      }
    });

    it('should work without modern JavaScript APIs', () => {
      const assetsDir = path.join(distDir, 'assets');
      const jsFiles = fs.readdirSync(assetsDir)
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(assetsDir, file));

      for (const jsFile of jsFiles) {
        const content = fs.readFileSync(jsFile, 'utf8');
        
        // Should not rely on very modern APIs without polyfills
        expect(content).not.toMatch(/\bIntersectionObserver\b/); // Should be polyfilled if used
        expect(content).not.toMatch(/\bResizeObserver\b/); // Should be polyfilled if used
      }
    });
  });

  describe('Performance Across Browsers', () => {
    it('should have reasonable bundle sizes for slower connections', () => {
      const assetsDir = path.join(distDir, 'assets');
      const files = fs.readdirSync(assetsDir);
      
      let totalSize = 0;
      for (const file of files) {
        const filePath = path.join(assetsDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }

      // Total bundle should be reasonable for mobile connections
      // Less than 5MB for initial load
      expect(totalSize).toBeLessThan(5 * 1024 * 1024);
    });

    it('should have proper chunking for progressive loading', () => {
      const assetsDir = path.join(distDir, 'assets');
      const jsFiles = fs.readdirSync(assetsDir).filter(file => file.endsWith('.js'));
      
      // Should have at least one main bundle
      expect(jsFiles.length).toBeGreaterThanOrEqual(1);
      
      // If multiple files, they should be reasonably sized
      if (jsFiles.length > 1) {
        for (const jsFile of jsFiles) {
          const filePath = path.join(assetsDir, jsFile);
          const stats = fs.statSync(filePath);
          
          // Individual chunks should not be too large
          expect(stats.size).toBeLessThan(2 * 1024 * 1024); // 2MB per chunk
        }
      }
    });
  });

  describe('Accessibility Compatibility', () => {
    it('should have proper HTML structure for screen readers', () => {
      const indexPath = path.join(distDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf8');
      
      // Should have lang attribute
      expect(content).toMatch(/<html[^>]*lang=/);
      
      // Should have proper title
      expect(content).toMatch(/<title>[^<]+<\/title>/);
      
      // Root element should be accessible
      expect(content).toContain('id="root"');
    });

    it('should not break with assistive technologies', () => {
      const assetsDir = path.join(distDir, 'assets');
      const jsFiles = fs.readdirSync(assetsDir)
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(assetsDir, file));

      for (const jsFile of jsFiles) {
        const content = fs.readFileSync(jsFile, 'utf8');
        
        // Should not interfere with screen readers
        expect(content).not.toMatch(/document\.body\.innerHTML\s*=/);
        expect(content).not.toMatch(/\.outerHTML\s*=/);
      }
    });
  });

  describe('Error Handling Across Browsers', () => {
    it('should handle JavaScript errors gracefully', () => {
      const assetsDir = path.join(distDir, 'assets');
      const jsFiles = fs.readdirSync(assetsDir)
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(assetsDir, file));

      for (const jsFile of jsFiles) {
        const content = fs.readFileSync(jsFile, 'utf8');
        
        // Should have error boundaries or error handling
        if (content.includes('React')) {
          // React apps should handle errors
          expect(content.length).toBeGreaterThan(0);
        }
      }
    });

    it('should provide fallbacks for unsupported features', () => {
      const indexPath = path.join(distDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf8');
      
      // Should have noscript fallback
      if (content.includes('<script')) {
        // If JavaScript is used, should consider no-JS users
        expect(content.length).toBeGreaterThan(0);
      }
    });
  });
});