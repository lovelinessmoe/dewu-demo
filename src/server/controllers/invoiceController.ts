import { Response } from 'express';
import { 
  InvoiceListRequest, 
  InvoiceHandleRequest, 
  InvoiceListResponse, 
  InvoiceHandleResponse,
  ErrorResponse,
  ApiErrorCode,
  HttpStatusCode,
  InvoiceItem
} from '../types/index';
import { AuthenticatedRequest } from '../middleware/auth';
import { BusinessLogic } from '../../shared/core/index.js';

// 创建业务逻辑实例
const businessLogic = new BusinessLogic();

/**
 * Invoice Controller
 * Handles invoice-related API endpoints matching Dewu specification
 */
export class InvoiceController {
  
  /**
   * Handle invoice list retrieval
   * POST /dop/api/v1/invoice/list
   */
  static async getInvoiceList(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Log incoming request details
      console.log(`[Invoice-List] ${req.method} ${req.originalUrl}`);
      console.log(`[Invoice-List] Request Headers:`, JSON.stringify(req.headers, null, 2));
      console.log(`[Invoice-List] Request Body:`, JSON.stringify(req.body, null, 2));
      console.log(`[Invoice-List] Request ID: ${req.requestId}`);
      console.log(`[Invoice-List] Token Data:`, req.tokenData);
      
      const requestData: InvoiceListRequest = req.body;
      
      // Validate required pagination parameters
      if (!requestData.page_no || requestData.page_no < 1) {
        const errorResponse: ErrorResponse = {
          code: ApiErrorCode.INVALID_PARAMETERS,
          msg: 'page_no is required and must be greater than 0',
          status: HttpStatusCode.BAD_REQUEST
        };
        res.status(HttpStatusCode.BAD_REQUEST).json(errorResponse);
        return;
      }
      
      if (!requestData.page_size || requestData.page_size < 1) {
        const errorResponse: ErrorResponse = {
          code: ApiErrorCode.INVALID_PARAMETERS,
          msg: 'page_size is required and must be greater than 0',
          status: HttpStatusCode.BAD_REQUEST
        };
        res.status(HttpStatusCode.BAD_REQUEST).json(errorResponse);
        return;
      }
      
      // 使用统一的业务逻辑
      const result = await businessLogic.getInvoiceList(req.body);
      
      if (!result.success) {
        res.status(result.error!.status).json(result.error);
        return;
      }
      
      res.status(HttpStatusCode.OK).json(result.data);
      
    } catch (error) {
      console.error('Error in getInvoiceList:', error);
      
      const errorResponse: ErrorResponse = {
        code: ApiErrorCode.INTERNAL_ERROR,
        msg: 'Internal server error while retrieving invoice list',
        status: HttpStatusCode.INTERNAL_SERVER_ERROR
      };
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
  }
  
  /**
   * Handle invoice processing
   * POST /dop/api/v1/invoice/handle
   */
  static async handleInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Log incoming request details
      console.log(`[Invoice-Handle] ${req.method} ${req.originalUrl}`);
      console.log(`[Invoice-Handle] Request Headers:`, JSON.stringify(req.headers, null, 2));
      console.log(`[Invoice-Handle] Request Body:`, JSON.stringify(req.body, null, 2));
      console.log(`[Invoice-Handle] Request ID: ${req.requestId}`);
      console.log(`[Invoice-Handle] Token Data:`, req.tokenData);
      
      const requestData: InvoiceHandleRequest = req.body;
      
      // Validate required parameters
      if (!requestData.order_no) {
        const errorResponse: ErrorResponse = {
          code: ApiErrorCode.INVALID_PARAMETERS,
          msg: 'order_no is required',
          status: HttpStatusCode.BAD_REQUEST
        };
        res.status(HttpStatusCode.BAD_REQUEST).json(errorResponse);
        return;
      }
      
      if (requestData.operation_type === undefined) {
        const errorResponse: ErrorResponse = {
          code: ApiErrorCode.INVALID_PARAMETERS,
          msg: 'operation_type is required',
          status: HttpStatusCode.BAD_REQUEST
        };
        res.status(HttpStatusCode.BAD_REQUEST).json(errorResponse);
        return;
      }
      
      if (requestData.category_type === undefined) {
        const errorResponse: ErrorResponse = {
          code: ApiErrorCode.INVALID_PARAMETERS,
          msg: 'category_type is required',
          status: HttpStatusCode.BAD_REQUEST
        };
        res.status(HttpStatusCode.BAD_REQUEST).json(errorResponse);
        return;
      }
      
      // Validate operation_type (1 = approve, 2 = reject)
      if (![1, 2].includes(requestData.operation_type)) {
        const errorResponse: ErrorResponse = {
          code: ApiErrorCode.INVALID_PARAMETERS,
          msg: 'operation_type must be 1 (approve) or 2 (reject)',
          status: HttpStatusCode.BAD_REQUEST
        };
        res.status(HttpStatusCode.BAD_REQUEST).json(errorResponse);
        return;
      }
      
      // Validate conditional parameters
      if (requestData.operation_type === 1 && !requestData.image_key) {
        const errorResponse: ErrorResponse = {
          code: ApiErrorCode.INVALID_PARAMETERS,
          msg: 'image_key is required when operation_type is 1 (approve)',
          status: HttpStatusCode.BAD_REQUEST
        };
        res.status(HttpStatusCode.BAD_REQUEST).json(errorResponse);
        return;
      }
      
      if (requestData.operation_type === 2 && requestData.reject_operation === undefined) {
        const errorResponse: ErrorResponse = {
          code: ApiErrorCode.INVALID_PARAMETERS,
          msg: 'reject_operation is required when operation_type is 2 (reject)',
          status: HttpStatusCode.BAD_REQUEST
        };
        res.status(HttpStatusCode.BAD_REQUEST).json(errorResponse);
        return;
      }
      
      // Validate category_type (1 = electronic, 2 = paper)
      if (![1, 2].includes(requestData.category_type)) {
        const errorResponse: ErrorResponse = {
          code: ApiErrorCode.INVALID_PARAMETERS,
          msg: 'category_type must be 1 (electronic) or 2 (paper)',
          status: HttpStatusCode.BAD_REQUEST
        };
        res.status(HttpStatusCode.BAD_REQUEST).json(errorResponse);
        return;
      }
      
      // 使用统一的业务逻辑
      const result = await businessLogic.handleInvoice(req.body);
      
      if (!result.success) {
        res.status(result.error!.status).json(result.error);
        return;
      }
      
      res.status(HttpStatusCode.OK).json(result.data);
      
    } catch (error) {
      console.error('Error in handleInvoice:', error);
      
      const errorResponse: ErrorResponse = {
        code: ApiErrorCode.INTERNAL_ERROR,
        msg: 'Internal server error while processing invoice',
        status: HttpStatusCode.INTERNAL_SERVER_ERROR
      };
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
  }
}