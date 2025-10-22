# Requirements Document

## Introduction

This document outlines the requirements for creating a MOCK API application that simulates the Dewu (得物) platform interfaces. The application will be built using React and will provide mock endpoints that other applications can call to test integration with the Dewu platform without needing actual API credentials or making real API calls.

## Requirements

### Requirement 1

**User Story:** As a developer integrating with Dewu APIs, I want to use mock OAuth2 token endpoints, so that I can test authentication flows without using real credentials.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/v1/h5/passport/v1/oauth2/token` with valid client_id, client_secret, and authorization_code THEN the system SHALL return a mock access_token response with 200 status code
2. WHEN a POST request is made to `/api/v1/h5/passport/v1/oauth2/token` with invalid parameters THEN the system SHALL return an appropriate error response
3. WHEN the mock response is generated THEN the system SHALL include access_token, refresh_token, expires_in values, open_id, and scope fields matching the specification format
4. WHEN Content-Type header is not application/json THEN the system SHALL return a 400 error response

### Requirement 2

**User Story:** As a developer testing token refresh functionality, I want to use a mock refresh token endpoint, so that I can verify my token refresh logic works correctly.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/v1/h5/passport/v1/oauth2/refresh_token` with valid client_id, client_secret, and refresh_token THEN the system SHALL return a new mock access_token response
2. WHEN a POST request is made with invalid refresh_token THEN the system SHALL return an error response with appropriate error code
3. WHEN a successful refresh occurs THEN the system SHALL return updated access_token and refresh_token with new expiration times
4. WHEN the refresh_token is expired or invalid THEN the system SHALL return a 401 unauthorized response

### Requirement 3

**User Story:** As a developer working with invoice functionality, I want to use mock invoice endpoints, so that I can test invoice listing and handling without affecting real data.

#### Acceptance Criteria

1. WHEN a POST request is made to `/dop/api/v1/invoice/list` with valid access_token THEN the system SHALL return a mock list of invoices
2. WHEN a POST request is made to `/dop/api/v1/invoice/handle` with valid parameters THEN the system SHALL return a success response indicating invoice processing
3. WHEN requests are made without valid access_token THEN the system SHALL return 401 unauthorized responses
4. WHEN invoice handle request contains invalid invoice data THEN the system SHALL return validation error responses

### Requirement 4

**User Story:** As a developer needing merchant information, I want to use a mock merchant info endpoint, so that I can test merchant data retrieval functionality.

#### Acceptance Criteria

1. WHEN a POST request is made to `/dop/api/v1/common/merchant/base/info` with valid access_token THEN the system SHALL return mock merchant base information
2. WHEN the request is made without access_token THEN the system SHALL return 401 unauthorized response
3. WHEN the access_token is invalid or expired THEN the system SHALL return 403 forbidden response
4. WHEN merchant info is returned THEN the system SHALL include typical merchant fields like merchant_id, name, status, etc.

### Requirement 5

**User Story:** As a developer using the mock API, I want the application to have a simple web interface, so that I can view available endpoints and test them manually.

#### Acceptance Criteria

1. WHEN I access the root URL THEN the system SHALL display a list of available mock endpoints
2. WHEN I click on an endpoint THEN the system SHALL show the expected request format and sample responses
3. WHEN I want to test an endpoint THEN the system SHALL provide a simple form to make test requests
4. WHEN responses are returned THEN the system SHALL display them in a readable JSON format

### Requirement 6

**User Story:** As a developer deploying the mock API, I want the application to be easily configurable, so that I can customize response data and behavior for different testing scenarios.

#### Acceptance Criteria

1. WHEN the application starts THEN the system SHALL load configuration from environment variables or config files
2. WHEN I want to modify mock response data THEN the system SHALL allow easy customization without code changes
3. WHEN different test scenarios are needed THEN the system SHALL support multiple response profiles
4. WHEN the application is deployed THEN the system SHALL provide clear documentation on configuration options