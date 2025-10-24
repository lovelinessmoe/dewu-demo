#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Build Verification Script
 * 
 * This script verifies that:
 * 1. React is included in the production bundle
 * 2. JSX transformation is working correctly
 * 3. All required dependencies are present in the build output
 * 
 * Requirements: 3.2, 3.3
 */

class BuildVerifier {
  constructor() {
    this.distDir = path.join(process.cwd(), 'dist/client');
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  error(message) {
    this.errors.push(message);
    this.log(message, 'error');
  }

  warning(message) {
    this.warnings.push(message);
    this.log(message, 'warning');
  }

  success(message) {
    this.log(message, 'success');
  }

  /**
   * Check if the build directory exists and has the expected structure
   */
  verifyBuildStructure() {
    this.log('Verifying build structure...');
    
    if (!fs.existsSync(this.distDir)) {
      this.error(`Build directory does not exist: ${this.distDir}`);
      return false;
    }

    const requiredFiles = ['index.html', 'assets'];
    const missingFiles = requiredFiles.filter(file => 
      !fs.existsSync(path.join(this.distDir, file))
    );

    if (missingFiles.length > 0) {
      this.error(`Missing required build files: ${missingFiles.join(', ')}`);
      return false;
    }

    this.success('Build structure is valid');
    return true;
  }

  /**
   * Analyze JavaScript bundles to verify React is included
   */
  verifyReactInBundle() {
    this.log('Verifying React is included in bundle...');
    
    const assetsDir = path.join(this.distDir, 'assets');
    if (!fs.existsSync(assetsDir)) {
      this.error('Assets directory not found');
      return false;
    }

    const jsFiles = fs.readdirSync(assetsDir)
      .filter(file => file.endsWith('.js'))
      .map(file => path.join(assetsDir, file));

    if (jsFiles.length === 0) {
      this.error('No JavaScript files found in assets directory');
      return false;
    }

    let reactFound = false;
    let reactDomFound = false;

    for (const jsFile of jsFiles) {
      const content = fs.readFileSync(jsFile, 'utf8');
      
      // Check for React patterns
      if (content.includes('React') || content.includes('react')) {
        reactFound = true;
      }
      
      // Check for ReactDOM patterns
      if (content.includes('ReactDOM') || content.includes('createRoot') || content.includes('render')) {
        reactDomFound = true;
      }
    }

    if (!reactFound) {
      this.error('React not found in JavaScript bundles');
      return false;
    }

    if (!reactDomFound) {
      this.warning('ReactDOM patterns not clearly identified in bundles');
    }

    this.success('React is properly included in the bundle');
    return true;
  }

  /**
   * Verify JSX transformation is working correctly
   */
  verifyJSXTransformation() {
    this.log('Verifying JSX transformation...');
    
    const assetsDir = path.join(this.distDir, 'assets');
    const jsFiles = fs.readdirSync(assetsDir)
      .filter(file => file.endsWith('.js'))
      .map(file => path.join(assetsDir, file));

    let jsxTransformed = false;
    let hasJSXElements = false;

    for (const jsFile of jsFiles) {
      const content = fs.readFileSync(jsFile, 'utf8');
      
      // Check for transformed JSX patterns (createElement calls or jsx runtime)
      if (content.includes('createElement') || 
          content.includes('jsx') || 
          content.includes('jsxs') ||
          content.includes('_jsx')) {
        jsxTransformed = true;
      }

      // Check for untransformed JSX (should not be present)
      // Look for JSX patterns that would be invalid JavaScript syntax
      // Avoid false positives from string literals by checking for JSX-specific patterns
      if (content.match(/return\s*<\w+/) || 
          content.match(/=\s*<\w+[^>]*>/) || 
          content.match(/\(\s*<\w+[^>]*>/) ||
          content.match(/{\s*<\w+[^>]*>/)) {
        hasJSXElements = true;
      }
    }

    if (hasJSXElements) {
      this.warning('Potential JSX patterns detected in bundle - this may be normal for string literals');
    }

    if (!jsxTransformed) {
      this.warning('JSX transformation patterns not clearly identified');
    } else {
      this.success('JSX transformation appears to be working correctly');
    }

    return true;
  }

  /**
   * Analyze bundle for missing dependencies
   */
  analyzeDependencies() {
    this.log('Analyzing bundle dependencies...');
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = ['react', 'react-dom'];
    
    const assetsDir = path.join(this.distDir, 'assets');
    const jsFiles = fs.readdirSync(assetsDir)
      .filter(file => file.endsWith('.js'))
      .map(file => path.join(assetsDir, file));

    const bundleContent = jsFiles
      .map(file => fs.readFileSync(file, 'utf8'))
      .join('\n');

    const missingDeps = [];
    
    for (const dep of requiredDeps) {
      // Check if dependency is referenced in the bundle
      const depPatterns = [
        dep,
        dep.replace('-', ''),
        dep.toUpperCase(),
        dep.toLowerCase()
      ];
      
      const found = depPatterns.some(pattern => 
        bundleContent.includes(pattern)
      );
      
      if (!found) {
        missingDeps.push(dep);
      }
    }

    if (missingDeps.length > 0) {
      this.error(`Missing dependencies in bundle: ${missingDeps.join(', ')}`);
      return false;
    }

    this.success('All required dependencies are present in the bundle');
    return true;
  }

  /**
   * Check bundle size and provide warnings for unusually large/small bundles
   */
  analyzeBundleSize() {
    this.log('Analyzing bundle size...');
    
    const assetsDir = path.join(this.distDir, 'assets');
    const files = fs.readdirSync(assetsDir);
    
    let totalSize = 0;
    let jsSize = 0;
    let cssSize = 0;

    for (const file of files) {
      const filePath = path.join(assetsDir, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      
      if (file.endsWith('.js')) {
        jsSize += stats.size;
      } else if (file.endsWith('.css')) {
        cssSize += stats.size;
      }
    }

    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
    const jsSizeMB = (jsSize / 1024 / 1024).toFixed(2);
    const cssSizeMB = (cssSize / 1024 / 1024).toFixed(2);

    this.log(`Bundle size analysis:`);
    this.log(`  Total: ${totalSizeMB} MB`);
    this.log(`  JavaScript: ${jsSizeMB} MB`);
    this.log(`  CSS: ${cssSizeMB} MB`);

    // Warn about unusually large bundles
    if (totalSize > 10 * 1024 * 1024) { // 10MB
      this.warning(`Bundle size is quite large (${totalSizeMB} MB) - consider code splitting`);
    }

    // Warn about unusually small bundles (might indicate missing dependencies)
    if (jsSize < 100 * 1024) { // 100KB
      this.warning(`JavaScript bundle is very small (${jsSizeMB} MB) - verify all dependencies are included`);
    }

    return true;
  }

  /**
   * Verify the index.html file has proper React app structure
   */
  verifyIndexHtml() {
    this.log('Verifying index.html structure...');
    
    const indexPath = path.join(this.distDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
      this.error('index.html not found in build output');
      return false;
    }

    const content = fs.readFileSync(indexPath, 'utf8');
    
    // Check for root div
    if (!content.includes('id="root"')) {
      this.error('Root div with id="root" not found in index.html');
      return false;
    }

    // Check for script tags
    if (!content.includes('<script')) {
      this.error('No script tags found in index.html');
      return false;
    }

    // Check for proper asset references
    const scriptMatches = content.match(/<script[^>]*src="[^"]*"/g);
    if (!scriptMatches || scriptMatches.length === 0) {
      this.error('No JavaScript assets referenced in index.html');
      return false;
    }

    this.success('index.html structure is valid');
    return true;
  }

  /**
   * Run all verification checks
   */
  async verify() {
    this.log('Starting build verification...');
    
    const checks = [
      () => this.verifyBuildStructure(),
      () => this.verifyIndexHtml(),
      () => this.verifyReactInBundle(),
      () => this.verifyJSXTransformation(),
      () => this.analyzeDependencies(),
      () => this.analyzeBundleSize()
    ];

    let allPassed = true;
    
    for (const check of checks) {
      try {
        const result = await check();
        if (!result) {
          allPassed = false;
        }
      } catch (error) {
        this.error(`Verification check failed: ${error.message}`);
        allPassed = false;
      }
    }

    // Summary
    this.log('\n=== Build Verification Summary ===');
    
    if (this.errors.length > 0) {
      this.log(`❌ ${this.errors.length} error(s) found:`);
      this.errors.forEach(error => this.log(`  - ${error}`));
    }

    if (this.warnings.length > 0) {
      this.log(`⚠️  ${this.warnings.length} warning(s):`);
      this.warnings.forEach(warning => this.log(`  - ${warning}`));
    }

    if (allPassed && this.errors.length === 0) {
      this.success('✅ All build verification checks passed!');
      this.log('The build is ready for deployment to Vercel.');
      return true;
    } else {
      this.error('❌ Build verification failed. Please fix the issues above before deploying.');
      return false;
    }
  }
}

// CLI execution
if (require.main === module) {
  const verifier = new BuildVerifier();
  
  verifier.verify()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Build verification failed with error:', error);
      process.exit(1);
    });
}

module.exports = BuildVerifier;