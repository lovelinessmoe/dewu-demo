import { Router } from 'express';
import { MerchantController } from '../controllers/merchantController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * Merchant Base Info Endpoint
 * POST /dop/api/v1/common/merchant/base/info
 * Requires authentication via access_token in request body
 */
router.post('/dop/api/v1/common/merchant/base/info', authenticateToken, MerchantController.getMerchantBaseInfo);

export default router;