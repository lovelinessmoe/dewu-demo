# Implementation Plan

- [x] 1. Refactor SupabaseService to remove fallback logic
  - Remove availability tracking and isAvailable property
  - Add consistent sorting (ORDER BY upload_time DESC) to getInvoices method
  - Replace null returns with specific error throwing
  - Remove testConnection method and related fallback logic
  - _Requirements: 1.1, 1.2, 2.1_

- [x] 2. Update BusinessLogic class to use Supabase exclusively
  - Remove mockData property and all mock data references
  - Remove fallback logic from getInvoiceList method
  - Remove fallback logic from handleInvoice method
  - Remove fallback logic from addInvoices method
  - Remove fallback logic from updateInvoiceInfo method
  - Update error handling to propagate Supabase errors properly
  - _Requirements: 1.1, 1.3, 1.4, 4.2_

- [x] 3. Add consistent sorting to all Supabase queries
  - Add ORDER BY upload_time DESC to getInvoices query
  - Ensure sorting is applied before pagination
  - Verify sorting works with all filter combinations
  - _Requirements: 2.1, 2.3, 3.3_

- [x] 4. Update error handling for database-only operations
  - Define specific error codes for different failure types
  - Update API responses to return proper HTTP status codes
  - Add trace_id to all error responses for debugging
  - _Requirements: 4.1, 4.2_

- [x] 5. Remove client-side sorting from frontend
  - Remove sortBy and sortOrder from InvoiceManagerState interface
  - Remove sortInvoices function and updateSort function
  - Remove sorting controls from the UI
  - Ensure frontend preserves backend sort order
  - _Requirements: 2.2, 3.1, 3.2_

- [x] 6. Update frontend error handling
  - Add handling for 503 Service Unavailable errors
  - Update error messages for database-specific errors
  - Add user-friendly messages for different error scenarios
  - _Requirements: 4.3, 4.4_

- [x] 7. Add comprehensive error handling tests
  - Write unit tests for SupabaseService error scenarios
  - Test BusinessLogic error propagation
  - Test frontend error display for various error codes
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 8. Add sorting validation tests
  - Test that all queries include proper ORDER BY clause
  - Verify sort order is maintained across pagination
  - Test sorting with various filter combinations
  - _Requirements: 2.1, 2.3, 3.3_

- [x] 9. Clean up initialization and remove mock data dependencies
  - Remove mock data initialization from BusinessLogic constructor
  - Remove initializeData method from SupabaseService
  - Update system startup to handle Supabase-only operations
  - _Requirements: 1.1, 1.2_

- [x] 10. Validate and test the complete refactored system
  - Test invoice list retrieval with proper sorting
  - Test error scenarios when Supabase is unavailable
  - Verify frontend displays errors appropriately
  - Test all CRUD operations work with Supabase only
  - _Requirements: 1.1, 2.1, 3.1, 4.1_