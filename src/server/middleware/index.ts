// Authentication middleware exports
export {
  authenticateToken,
  requireScope,
  createMockToken,
  getTokenInfo,
  revokeToken,
  cleanupExpiredTokens,
  getTokenStore,
  validateSignature,
  validateRequestSignature,
  authenticateAndValidateSignature,
  addAppSecret,
  getAppSecret,
  type AuthenticatedRequest
} from './auth';