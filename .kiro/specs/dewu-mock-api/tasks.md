# Implementation Plan

- [x] 1. Set up project structure and dependencies
  - Initialize React + Express TypeScript project with Vite
  - Install required dependencies (express, cors, axios, react, typescript)
  - Configure TypeScript for both frontend and backend
  - Set up project folder structure with src/server and src/client directories
  - _Requirements: 6.4_

- [x] 2. Create core data models and types
  - Define TypeScript interfaces for OAuth2 responses (TokenResponse)
  - Create detailed invoice interfaces (InvoiceItem, InvoiceListRequest/Response, InvoiceHandleRequest/Response)
  - Define merchant info interfaces (MerchantInfoRequest/Response)
  - Create common error response interfaces and status codes
  - Define request signature validation interfaces
  - _Requirements: 1.3, 2.3, 3.4, 4.4_

- [x] 3. Implement mock data management system
  - Create mock data generator utilities for tokens, invoices, and merchant info
  - Implement configurable mock data loader from JSON files
  - Create realistic sample data files matching dewu.md specification format
  - Generate mock invoice data with all required fields (seller_post, invoice details, etc.)
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 4. Build Express server foundation
  - Set up Express application with TypeScript
  - Configure middleware (CORS, JSON parsing, request logging)
  - Implement basic error handling middleware
  - Create server startup and configuration logic
  - _Requirements: 5.1_

- [x] 5. Implement authentication and signature middleware
  - Create access token validation middleware
  - Implement request signature validation (app_key, timestamp, sign)
  - Add token expiration checking logic
  - Handle authentication error responses (401, 403)
  - _Requirements: 2.4, 3.3, 4.2, 4.3_

- [x] 6. Create OAuth2 endpoints
- [x] 6.1 Implement token generation endpoint
  - Create POST /api/v1/h5/passport/v1/oauth2/token route
  - Validate request parameters (client_id, client_secret, authorization_code)
  - Generate mock access_token and refresh_token with proper format
  - Return response matching Dewu specification format
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 6.2 Implement token refresh endpoint
  - Create POST /api/v1/h5/passport/v1/oauth2/refresh_token route
  - Validate refresh_token and client credentials
  - Generate new access_token and update refresh_token
  - Handle expired refresh_token scenarios
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]* 6.3 Write unit tests for OAuth2 controllers
  - Test token generation with valid and invalid parameters
  - Test token refresh functionality and error cases
  - Test response format compliance
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 7. Create invoice management endpoints
- [x] 7.1 Implement invoice list endpoint
  - Create POST /dop/api/v1/invoice/list route with authentication and signature validation
  - Implement pagination with page_no, page_size parameters
  - Support filtering by spu_id, status, order_no, apply_start_time, apply_end_time, invoice_title_type
  - Generate mock invoice data with all required fields (invoice_title, seller_post, etc.)
  - Return response with trace_id, proper pagination info, and detailed invoice list
  - _Requirements: 3.1, 3.3_

- [x] 7.2 Implement invoice handle endpoint
  - Create POST /dop/api/v1/invoice/handle route with authentication and signature validation
  - Validate required parameters: order_no, operation_type, category_type
  - Handle conditional parameters: image_key (required for operation_type=1), reject_operation (required for operation_type=2)
  - Implement operation logic for approve (1) and reject (2) operations
  - Return response with trace_id and empty data object
  - _Requirements: 3.2, 3.4_

- [x] 7.3 Write unit tests for invoice controllers
  - Test invoice list retrieval with valid tokens
  - Test invoice handling with various parameters
  - Test authentication failure scenarios
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 8. Create merchant info endpoint
- [x] 8.1 Implement merchant base info endpoint
  - Create POST /dop/api/v1/common/merchant/base/info route with authentication and signature validation
  - Validate required parameters: app_key, access_token, timestamp, sign
  - Generate mock merchant response with merchant_id and type_id
  - Return response with domain, code, msg, data, and errors fields
  - Handle authentication and signature validation errors
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 8.2 Write unit tests for merchant controller
  - Test merchant info retrieval with valid authentication
  - Test error responses for invalid/expired tokens
  - Test response format compliance
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 9. Build React frontend foundation
- [x] 9.1 Set up React application structure
  - Create main App component with routing setup
  - Implement basic layout and navigation components
  - Set up CSS modules or styled-components for styling
  - Configure Vite build for frontend development
  - _Requirements: 5.1, 5.2_

- [x] 9.2 Create API documentation component
  - Build component to display available endpoints
  - Show request/response format for each endpoint
  - Include sample request and response examples
  - Make documentation interactive and searchable
  - _Requirements: 5.1, 5.2_

- [x] 10. Implement API testing interface
- [x] 10.1 Create endpoint testing forms
  - Build forms for each API endpoint with parameter inputs
  - Implement request builder with proper validation
  - Add authentication token input for protected endpoints
  - _Requirements: 5.3_

- [x] 10.2 Create response display component
  - Implement JSON response viewer with syntax highlighting
  - Show request/response headers and status codes
  - Add copy-to-clipboard functionality for responses
  - Display error messages clearly
  - _Requirements: 5.4_

- [ ]* 10.3 Write frontend component tests
  - Test form submission and validation
  - Test API call integration
  - Test response display functionality
  - _Requirements: 5.3, 5.4_

- [ ] 11. Integrate frontend and backend
- [x] 11.1 Set up API client in React
  - Create axios-based API client for frontend
  - Implement error handling for API calls
  - Add loading states and user feedback
  - Configure proxy for development environment
  - _Requirements: 5.3, 5.4_

- [x] 11.2 Connect testing interface to mock API
  - Wire up frontend forms to make actual API calls to backend
  - Display real responses from mock API endpoints
  - Handle authentication flow in the frontend
  - Test complete user workflow from frontend to backend
  - _Requirements: 5.3, 5.4_

- [x] 12. Add configuration and deployment setup
- [x] 12.1 Implement configuration system
  - Create environment variable configuration
  - Add support for different mock data profiles
  - Implement runtime configuration loading
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 12.2 Set up build and deployment
  - Configure production build process
  - Set up Express to serve static React files
  - Create Docker configuration for containerized deployment
  - Add startup scripts and documentation
  - _Requirements: 6.4_

- [ ]* 12.3 Write integration tests
  - Test complete API workflows end-to-end
  - Test frontend-backend integration
  - Test configuration loading and environment setup
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_