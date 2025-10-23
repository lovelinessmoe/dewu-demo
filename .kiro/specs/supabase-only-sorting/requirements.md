# Requirements Document

## Introduction

This feature focuses on refactoring the invoice management system to use Supabase exclusively for data operations, removing all fallback logic, and implementing consistent sorting by update date across both backend API and frontend interface.

## Requirements

### Requirement 1

**User Story:** As a developer, I want the system to use only Supabase for data operations, so that there is a single source of truth and consistent behavior.

#### Acceptance Criteria

1. WHEN the system queries invoice data THEN it SHALL only use Supabase database
2. WHEN Supabase is unavailable THEN the system SHALL return appropriate error responses instead of fallback data
3. WHEN adding new invoices THEN they SHALL only be stored in Supabase
4. WHEN updating invoice information THEN changes SHALL only be applied to Supabase

### Requirement 2

**User Story:** As a user, I want invoices to be sorted by update date with newest first, so that I can easily find the most recently modified invoices.

#### Acceptance Criteria

1. WHEN retrieving invoice lists from the API THEN invoices SHALL be ordered by upload_time in descending order (newest first)
2. WHEN the frontend displays invoice lists THEN they SHALL maintain the same sort order as the API
3. WHEN new invoices are added THEN they SHALL appear at the top of the list based on their upload_time
4. WHEN invoices are updated THEN their position in the list SHALL reflect their upload_time

### Requirement 3

**User Story:** As a developer, I want consistent sorting behavior between backend and frontend, so that the user experience is predictable and data integrity is maintained.

#### Acceptance Criteria

1. WHEN the backend API returns sorted data THEN the frontend SHALL preserve that order
2. WHEN displaying invoice lists THEN the frontend SHALL NOT apply additional client-side sorting that conflicts with backend sorting
3. WHEN pagination is used THEN the sort order SHALL be maintained across all pages
4. WHEN filtering is applied THEN the results SHALL still be sorted by update date

### Requirement 4

**User Story:** As a system administrator, I want proper error handling when Supabase is unavailable, so that users receive clear feedback about system status.

#### Acceptance Criteria

1. WHEN Supabase connection fails THEN the API SHALL return a 503 Service Unavailable error
2. WHEN database queries fail THEN appropriate error messages SHALL be returned to the client
3. WHEN the frontend receives database errors THEN it SHALL display user-friendly error messages
4. WHEN retrying failed operations THEN the system SHALL provide clear feedback about retry attempts