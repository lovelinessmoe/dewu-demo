# Build Scripts

This directory contains various build and verification scripts for the project.

## Build Verification Script

### Overview

The `verify-build.js` script ensures that React applications are properly built and ready for deployment to Vercel. It addresses the common "React is not defined" error by verifying:

1. **React Inclusion**: Confirms React is properly included in the production bundle
2. **JSX Transformation**: Validates that JSX has been correctly transformed 
3. **Bundle Analysis**: Checks for missing dependencies and bundle integrity
4. **Build Structure**: Verifies the expected build output structure

### Usage

```bash
# Run build verification on existing build
npm run verify-build

# Build and verify in one command
npm run build:verify

# Test the verification script itself
npm run test:verify-build
```

### Integration with Vercel

The verification script is automatically integrated into the Vercel build process via the `vercel-build` script in `package.json`. This ensures that builds are validated before deployment.

### What It Checks

#### 1. Build Structure
- Verifies `dist/client` directory exists
- Checks for required files (`index.html`, `assets/`)

#### 2. React Bundle Verification
- Confirms React is present in JavaScript bundles
- Validates ReactDOM patterns are included
- Checks for proper React runtime availability

#### 3. JSX Transformation
- Ensures JSX has been transformed to JavaScript
- Detects untransformed JSX elements (which would cause runtime errors)
- Validates createElement or jsx runtime calls are present

#### 4. Dependency Analysis
- Verifies all required dependencies (react, react-dom) are bundled
- Checks for missing critical dependencies

#### 5. Bundle Size Analysis
- Reports bundle sizes for JavaScript and CSS
- Warns about unusually large or small bundles
- Helps identify potential bundling issues

#### 6. HTML Structure
- Validates `index.html` has proper React app structure
- Checks for root div element (`id="root"`)
- Ensures JavaScript assets are properly referenced

### Output

The script provides detailed logging with timestamps and status indicators:

- ✅ Success messages for passed checks
- ⚠️ Warning messages for potential issues
- ❌ Error messages for failed checks

### Exit Codes

- `0`: All checks passed, build is ready for deployment
- `1`: One or more checks failed, build needs attention

### Requirements Addressed

This script addresses the following requirements from the Vercel React deployment fix specification:

- **Requirement 3.2**: Consistent behavior between development and production environments
- **Requirement 3.3**: Proper documentation and handling of environment-specific configurations

### Testing

The verification script includes comprehensive tests that validate its behavior across different scenarios:

- Valid builds (should pass)
- Missing React dependencies (should fail)
- Missing index.html (should fail)  
- Untransformed JSX (should fail)

Run tests with:
```bash
npm run test:verify-build
```

### Troubleshooting

If the verification fails:

1. **React not found**: Check Vite configuration and ensure React plugin is properly configured
2. **JSX transformation issues**: Verify `jsxRuntime: 'automatic'` is set in Vite config
3. **Missing dependencies**: Ensure React and ReactDOM are properly installed and bundled
4. **Build structure issues**: Check that the build process completes successfully

### Files

- `verify-build.js`: Main verification script
- `test-verify-build.js`: Test suite for the verification script
- `README.md`: This documentation file