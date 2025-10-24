#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const BuildVerifier = require('./verify-build.js');

/**
 * Test script for the build verification functionality
 * Tests various scenarios to ensure the verification script works correctly
 */

class BuildVerifierTest {
  constructor() {
    this.testDir = path.join(process.cwd(), 'test-build-output');
    this.originalDistDir = path.join(process.cwd(), 'dist/client');
    this.backupDir = path.join(process.cwd(), 'dist-backup');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    console.log(`${prefix} [TEST] ${message}`);
  }

  async setupTestEnvironment() {
    this.log('Setting up test environment...');
    
    // Backup original dist if it exists
    if (fs.existsSync(this.originalDistDir)) {
      if (fs.existsSync(this.backupDir)) {
        fs.rmSync(this.backupDir, { recursive: true, force: true });
      }
      fs.renameSync(this.originalDistDir, this.backupDir);
    }
  }

  async restoreEnvironment() {
    this.log('Restoring original environment...');
    
    // Clean up test directory
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }

    // Clean up fake dist
    if (fs.existsSync(this.originalDistDir)) {
      fs.rmSync(this.originalDistDir, { recursive: true, force: true });
    }

    // Restore original dist if it was backed up
    if (fs.existsSync(this.backupDir)) {
      fs.renameSync(this.backupDir, this.originalDistDir);
    }
  }

  createMockBuild(scenario) {
    this.log(`Creating mock build for scenario: ${scenario}`);
    
    // Clean up existing dist
    if (fs.existsSync(this.originalDistDir)) {
      fs.rmSync(this.originalDistDir, { recursive: true, force: true });
    }

    fs.mkdirSync(this.originalDistDir, { recursive: true });
    fs.mkdirSync(path.join(this.originalDistDir, 'assets'), { recursive: true });

    switch (scenario) {
      case 'valid':
        this.createValidBuild();
        break;
      case 'missing-react':
        this.createBuildWithoutReact();
        break;
      case 'missing-index':
        this.createBuildWithoutIndex();
        break;
      case 'untransformed-jsx':
        this.createBuildWithUntransformedJSX();
        break;
      default:
        throw new Error(`Unknown scenario: ${scenario}`);
    }
  }

  createValidBuild() {
    // Create a valid index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test App</title>
    <link rel="stylesheet" href="/assets/index-test.css">
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/assets/index-test.js"></script>
    <script type="module" src="/assets/react-test.js"></script>
</body>
</html>`;

    // Create JavaScript bundle with React
    const jsBundle = `
// React bundle content with proper patterns
var React = {
  createElement: function() {},
  Component: function() {},
  useState: function() {},
  useEffect: function() {}
};

var ReactDOM = {
  createRoot: function() {},
  render: function() {}
};

// Include react-dom patterns that the verifier looks for
var reactdom = "react-dom";
var createRoot = ReactDOM.createRoot;
var render = ReactDOM.render;

// JSX transformed content
function App() {
  return React.createElement("div", null, "Hello World");
}

// Export for module system
export { React, ReactDOM, App };
`;

    const reactBundle = `
// React library code with proper dependency patterns
const react = "18.2.0";
const reactdom = "react-dom";
function createElement(type, props, ...children) {
  return { type, props, children };
}
function jsx(type, props) {
  return createElement(type, props);
}
// Include both react and react-dom references
var React = { createElement, jsx };
var ReactDOM = { createRoot: function() {}, render: function() {} };
export { createElement, jsx, react, reactdom, React, ReactDOM };
`;

    const cssBundle = `
body { margin: 0; padding: 0; }
.app { font-family: Arial, sans-serif; }
`;

    fs.writeFileSync(path.join(this.originalDistDir, 'index.html'), indexHtml);
    fs.writeFileSync(path.join(this.originalDistDir, 'assets', 'index-test.js'), jsBundle);
    fs.writeFileSync(path.join(this.originalDistDir, 'assets', 'react-test.js'), reactBundle);
    fs.writeFileSync(path.join(this.originalDistDir, 'assets', 'index-test.css'), cssBundle);
  }

  createBuildWithoutReact() {
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test App</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/assets/index-test.js"></script>
</body>
</html>`;

    // JavaScript bundle WITHOUT React
    const jsBundle = `
// No React content
function App() {
  return document.createElement("div");
}
export { App };
`;

    fs.writeFileSync(path.join(this.originalDistDir, 'index.html'), indexHtml);
    fs.writeFileSync(path.join(this.originalDistDir, 'assets', 'index-test.js'), jsBundle);
  }

  createBuildWithoutIndex() {
    // Only create assets, no index.html
    const jsBundle = `
var React = { createElement: function() {} };
export { React };
`;

    fs.writeFileSync(path.join(this.originalDistDir, 'assets', 'index-test.js'), jsBundle);
  }

  createBuildWithUntransformedJSX() {
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test App</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/assets/index-test.js"></script>
</body>
</html>`;

    // JavaScript bundle with untransformed JSX (should fail)
    const jsBundle = `
var React = { createElement: function() {} };

// This should not be in the final bundle - indicates JSX wasn't transformed
function App() {
  return <div className="app">Hello World</div>;
}

export { React, App };
`;

    fs.writeFileSync(path.join(this.originalDistDir, 'index.html'), indexHtml);
    fs.writeFileSync(path.join(this.originalDistDir, 'assets', 'index-test.js'), jsBundle);
  }

  async testScenario(scenario, expectedResult) {
    this.log(`Testing scenario: ${scenario} (expecting ${expectedResult ? 'success' : 'failure'})`);
    
    this.createMockBuild(scenario);
    
    const verifier = new BuildVerifier();
    const result = await verifier.verify();
    
    if (result === expectedResult) {
      this.log(`✅ Scenario '${scenario}' passed as expected`);
      return true;
    } else {
      this.log(`❌ Scenario '${scenario}' failed - expected ${expectedResult}, got ${result}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('Starting build verifier tests...');
    
    await this.setupTestEnvironment();
    
    const testCases = [
      { scenario: 'valid', expected: true },
      { scenario: 'missing-react', expected: false },
      { scenario: 'missing-index', expected: false },
      { scenario: 'untransformed-jsx', expected: false }
    ];

    let passedTests = 0;
    let totalTests = testCases.length;

    for (const testCase of testCases) {
      try {
        const passed = await this.testScenario(testCase.scenario, testCase.expected);
        if (passed) {
          passedTests++;
        }
      } catch (error) {
        this.log(`Test '${testCase.scenario}' threw an error: ${error.message}`, 'error');
      }
    }

    await this.restoreEnvironment();

    this.log(`\n=== Test Results ===`);
    this.log(`Passed: ${passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      this.log('🎉 All build verifier tests passed!');
      return true;
    } else {
      this.log('❌ Some build verifier tests failed', 'error');
      return false;
    }
  }
}

// CLI execution
if (require.main === module) {
  const tester = new BuildVerifierTest();
  
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Build verifier tests failed with error:', error);
      process.exit(1);
    });
}

module.exports = BuildVerifierTest;