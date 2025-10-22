import { Router } from 'express';
import { OAuth2Controller } from '../controllers/oauth2Controller';

const router = Router();

/**
 * OAuth2 Token Generation Endpoint
 * POST /api/v1/h5/passport/v1/oauth2/token
 */
router.post('/api/v1/h5/passport/v1/oauth2/token', OAuth2Controller.generateToken);

/**
 * OAuth2 Token Refresh Endpoint
 * POST /api/v1/h5/passport/v1/oauth2/refresh_token
 */
router.post('/api/v1/h5/passport/v1/oauth2/refresh_token', OAuth2Controller.refreshToken);

export default router;