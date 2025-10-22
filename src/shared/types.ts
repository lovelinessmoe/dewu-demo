// Shared types that can be used by both frontend and backend

// Re-export all server types for shared usage
export * from '../server/types/index';

// Additional frontend-specific types
export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  requiresAuth: boolean;
  requestExample?: any;
  responseExample?: any;
}

export interface TestRequest {
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
}

export interface TestResponse {
  status: number;
  headers: Record<string, string>;
  data: any;
  duration: number;
}

// HTTP Status Codes for better type safety
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500
}