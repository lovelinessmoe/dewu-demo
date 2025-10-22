import { Response } from 'express';
import { 
  MerchantInfoRequest, 
  MerchantInfoResponse,
  ErrorResponse,
  ApiErrorCode,
  HttpStatusCode
} from '../types/index';
import { AuthenticatedRequest } from '../middleware/auth';
import { MockDataGenerator } from '../utils/mockDataGenerator';

/**
 * Merchant Controller
 * Handles merchant-related API endpoints matching Dewu specification
 */
export class MerchantController {
  
  /**
   * Handle merchant base info retrieval
   * POST /dop/api/v1/common/merchant/base/info
   */
  static async getMerchantBaseInfo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Log incoming request details
      console.log(`[Merchant-Info] ${req.method} ${req.originalUrl}`);
      console.log(`[Merchant-Info] Request Headers:`, JSON.stringify(req.headers, null, 2));
      console.log(`[Merchant-Info] Request Body:`, JSON.stringify(req.body, null, 2));
      console.log(`[Merchant-Info] Request ID: ${req.requestId}`);
      console.log(`[Merchant-Info] Token Data:`, req.tokenData);
      
      const requestData: MerchantInfoRequest = req.body;
      
      // Validate required parameters (app_key, access_token, timestamp, sign are validated by middleware)
      // The access_token validation is already handled by the authenticateToken middleware
      // At this point, we know the token is valid
      
      // Generate mock merchant info response matching Dewu specification
      const response: MerchantInfoResponse = MockDataGenerator.generateMerchantInfoResponse();
      
      res.status(HttpStatusCode.OK).json(response);
      
    } catch (error) {
      console.error('Error in getMerchantBaseInfo:', error);
      
      const errorResponse: ErrorResponse = {
        code: ApiErrorCode.INTERNAL_ERROR,
        msg: 'Internal server error while retrieving merchant information',
        status: HttpStatusCode.INTERNAL_SERVER_ERROR
      };
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
  }
}