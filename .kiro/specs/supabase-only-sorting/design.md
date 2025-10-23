# Design Document

## Overview

This design outlines the refactoring of the invoice management system to use Supabase exclusively, removing all fallback logic, and implementing consistent sorting by update date. The system will be simplified to have a single data source while maintaining robust error handling.

## Architecture

### Current Architecture Issues
- Dual data sources (Supabase + fallback mock data) create complexity
- Inconsistent sorting behavior between Supabase and fallback data
- Frontend applies additional sorting that may conflict with backend sorting

### Target Architecture
- Single data source: Supabase database only
- Consistent sorting at the database level
- Frontend preserves backend sort order
- Proper error handling for database unavailability

## Components and Interfaces

### Backend Components

#### SupabaseService Class
**Current Issues:**
- Returns null when unavailable, causing fallback to mock data
- No consistent sorting in queries
- Complex availability tracking

**Design Changes:**
- Remove availability tracking and fallback logic
- Add consistent sorting to all queries
- Throw specific errors instead of returning null
- Simplify error handling

#### BusinessLogic Class
**Current Issues:**
- Contains fallback logic for mock data
- Inconsistent sorting between Supabase and mock data
- Complex branching logic

**Design Changes:**
- Remove all mock data and fallback logic
- Simplify methods to only handle Supabase operations
- Add proper error propagation
- Remove mockData property and related methods

### Frontend Components

#### InvoiceManager Component
**Current Issues:**
- May apply client-side sorting that conflicts with backend
- Complex state management for sorting

**Design Changes:**
- Remove client-side sorting logic
- Trust backend sort order
- Simplify state management
- Improve error handling for database failures

## Data Models

### Invoice Sorting
- **Primary Sort Field:** `upload_time`
- **Sort Order:** Descending (newest first)
- **Implementation:** Database-level ORDER BY clause
- **Consistency:** Applied to all invoice queries

### Error Response Model
```typescript
interface ErrorResponse {
  code: number
  msg: string
  status: number
  trace_id?: string
}
```

**Error Codes:**
- `503`: Service Unavailable (Supabase connection failed)
- `500`: Internal Server Error (Database query failed)
- `404`: Not Found (Invoice not found)

## Error Handling

### Backend Error Handling
1. **Connection Failures:** Return 503 Service Unavailable
2. **Query Failures:** Return 500 Internal Server Error with specific message
3. **Not Found:** Return 404 with clear message
4. **Validation Errors:** Return 400 Bad Request

### Frontend Error Handling
1. **503 Errors:** Display "Service temporarily unavailable" message
2. **500 Errors:** Display "Database error occurred" message
3. **404 Errors:** Display "Invoice not found" message
4. **Network Errors:** Display "Connection failed" message

## Testing Strategy

### Backend Testing
1. **Unit Tests:** Test SupabaseService methods with mocked Supabase client
2. **Integration Tests:** Test actual database operations with test database
3. **Error Handling Tests:** Verify proper error responses for various failure scenarios
4. **Sorting Tests:** Verify consistent sort order in all queries

### Frontend Testing
1. **Component Tests:** Test InvoiceManager with mocked API responses
2. **Error Handling Tests:** Verify proper error display for various error codes
3. **Sort Order Tests:** Verify frontend preserves backend sort order
4. **Integration Tests:** Test complete flow with test backend

## Implementation Approach

### Phase 1: Backend Refactoring
1. Remove fallback logic from SupabaseService
2. Add consistent sorting to all queries
3. Update error handling to throw specific errors
4. Remove mock data from BusinessLogic class

### Phase 2: Frontend Updates
1. Remove client-side sorting logic
2. Update error handling for new error responses
3. Simplify state management
4. Update UI to handle service unavailable states

### Phase 3: Testing and Validation
1. Test all error scenarios
2. Verify consistent sorting behavior
3. Validate performance with database-only operations
4. Ensure proper error messages are displayed

## Database Schema Considerations

### Required Indexes
- Index on `upload_time` for efficient sorting
- Composite indexes for filtered queries with sorting

### Query Optimization
- Use `ORDER BY upload_time DESC` in all list queries
- Ensure pagination works correctly with sorting
- Optimize for common filter + sort combinations

## Migration Strategy

### Deployment Steps
1. Deploy backend changes first
2. Verify Supabase connectivity and performance
3. Deploy frontend changes
4. Monitor error rates and performance
5. Remove old fallback code after validation

### Rollback Plan
- Keep current implementation in version control
- Monitor error rates after deployment
- Quick rollback capability if Supabase issues occur
- Gradual migration with feature flags if needed