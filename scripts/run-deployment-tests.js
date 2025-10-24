#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Deployment Test Runner
 * 
 * Runs all tests related to Vercel React deployment fix
 * Requirements: 1.1, 1.2, 3.1
 */

class DeploymentTestRunner {
  constructor() {
    this.testResults = {
      buildProcess: null,
      vercelDeployment: null,
      crossBrowser: null,
      buildVerification: null
    };
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runTest(testName, command, description) {
    this.log(`Starting ${description}...`);
    
    try {
      const startTime = Date.now();
      const output = execSync(command, { 
        stdio: 'pipe',
        timeout: 120000 // 2 minute timeout
      });
      const duration = Date.now() - startTime;
      
      this.testResults[testName] = {
        success: true,
        duration,
        output: output.toString()
      };
      
      this.log(`✅ ${description} passed (${duration}ms)`, 'success');
      return true;
      
    } catch (error) {
      const duration = Date.now() - this.startTime;
      this.testResults[testName] = {
        success: false,
        duration,
        error: error.message,
        output: error.stdout?.toString() || '',
        stderr: error.stderr?.toString() || ''
      };
      
      this.log(`❌ ${description} failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runBuildProcessTests() {
    return await this.runTest(
      'buildProcess',
      'npx vitest run src/test/build-process.test.ts',
      'Build Process Tests'
    );
  }

  async runVercelDeploymentTests() {
    return await this.runTest(
      'vercelDeployment', 
      'npx vitest run src/test/vercel-deployment.test.ts',
      'Vercel Deployment Integration Tests'
    );
  }

  async runCrossBrowserTests() {
    return await this.runTest(
      'crossBrowser',
      'npx vitest run src/test/cross-browser-compatibility.test.ts', 
      'Cross-Browser Compatibility Tests'
    );
  }

  async runBuildVerificationTests() {
    return await this.runTest(
      'buildVerification',
      'npm run test:verify-build',
      'Build Verification Script Tests'
    );
  }

  async checkPrerequisites() {
    this.log('Checking prerequisites...');
    
    const requiredFiles = [
      'package.json',
      'vercel.json',
      'vite.config.ts',
      'src/test/build-process.test.ts',
      'src/test/vercel-deployment.test.ts',
      'src/test/cross-browser-compatibility.test.ts',
      'scripts/verify-build.js',
      'scripts/test-verify-build.js'
    ];

    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length > 0) {
      this.log(`Missing required files: ${missingFiles.join(', ')}`, 'error');
      return false;
    }

    // Check if vitest is available
    try {
      execSync('npx vitest --version', { stdio: 'pipe' });
    } catch (error) {
      this.log('Vitest is not available. Please install it.', 'error');
      return false;
    }

    this.log('All prerequisites met', 'success');
    return true;
  }

  async runAllTests() {
    this.log('🚀 Starting comprehensive deployment tests...');
    
    if (!(await this.checkPrerequisites())) {
      this.log('Prerequisites check failed. Aborting tests.', 'error');
      return false;
    }

    const tests = [
      () => this.runBuildProcessTests(),
      () => this.runVercelDeploymentTests(), 
      () => this.runCrossBrowserTests(),
      () => this.runBuildVerificationTests()
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    for (const test of tests) {
      const result = await test();
      if (result) {
        passedTests++;
      }
    }

    await this.generateReport();
    
    const totalDuration = Date.now() - this.startTime;
    this.log(`\n=== Test Summary ===`);
    this.log(`Total Duration: ${totalDuration}ms`);
    this.log(`Passed: ${passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      this.log('🎉 All deployment tests passed!', 'success');
      this.log('The application is ready for Vercel deployment.', 'success');
      return true;
    } else {
      this.log(`❌ ${totalTests - passedTests} test(s) failed`, 'error');
      this.log('Please fix the failing tests before deploying.', 'error');
      return false;
    }
  }

  async generateReport() {
    const reportPath = path.join(process.cwd(), 'deployment-test-report.json');
    
    const report = {
      timestamp: new Date().toISOString(),
      totalDuration: Date.now() - this.startTime,
      results: this.testResults,
      summary: {
        total: Object.keys(this.testResults).length,
        passed: Object.values(this.testResults).filter(r => r?.success).length,
        failed: Object.values(this.testResults).filter(r => r && !r.success).length
      }
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`Test report generated: ${reportPath}`);
  }

  async runSpecificTest(testName) {
    this.log(`Running specific test: ${testName}`);
    
    if (!(await this.checkPrerequisites())) {
      return false;
    }

    switch (testName) {
      case 'build':
        return await this.runBuildProcessTests();
      case 'vercel':
        return await this.runVercelDeploymentTests();
      case 'browser':
        return await this.runCrossBrowserTests();
      case 'verify':
        return await this.runBuildVerificationTests();
      default:
        this.log(`Unknown test: ${testName}`, 'error');
        this.log('Available tests: build, vercel, browser, verify');
        return false;
    }
  }
}

// CLI execution
if (require.main === module) {
  const runner = new DeploymentTestRunner();
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Run specific test
    const testName = args[0];
    runner.runSpecificTest(testName)
      .then(success => process.exit(success ? 0 : 1))
      .catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
      });
  } else {
    // Run all tests
    runner.runAllTests()
      .then(success => process.exit(success ? 0 : 1))
      .catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
      });
  }
}

module.exports = DeploymentTestRunner;