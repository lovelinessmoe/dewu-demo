import { Response } from 'express';
import { 
  InvoiceListRequest, 
  InvoiceHandleRequest, 
  InvoiceListResponse, 
  InvoiceHandleResponse,
  ErrorResponse,
  ApiErrorCode,
  HttpStatusCode,
  InvoiceItem,
  generateTraceId,
  createErrorResponse
} from '../types/index';
import { AuthenticatedRequest } from '../middleware/auth';

// 直接导入 BusinessLogic 类
const { BusinessLogic } = require('../../shared/core/index.js');

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
        const errorResponse = createErrorResponse(
          ApiErrorCode.INVALID_PARAMETERS,
          'page_no is required and must be greater than 0',
          HttpStatusCode.BAD_REQUEST,
          generateTraceId()
        );
        res.status(HttpStatusCode.BAD_REQUEST).json(errorResponse);
        return;
      }
      
      if (!requestData.page_size || requestData.page_size < 1) {
        const errorResponse = createErrorResponse(
          ApiErrorCode.INVALID_PARAMETERS,
          'page_size is required and must be greater than 0',
          HttpStatusCode.BAD_REQUEST,
          generateTraceId()
        );
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
      
      const errorResponse = createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        'Internal server error while retrieving invoice list',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        generateTraceId()
      );
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
        const errorResponse = createErrorResponse(
          ApiErrorCode.INVALID_PARAMETERS,
          'order_no is required',
          HttpStatusCode.BAD_REQUEST,
          generateTraceId()
        );
        res.status(HttpStatusCode.BAD_REQUEST).json(errorResponse);
        return;
      }
      
      if (requestData.operation_type === undefined) {
        const errorResponse = createErrorResponse(
          ApiErrorCode.INVALID_PARAMETERS,
          'operation_type is required',
          HttpStatusCode.BAD_REQUEST,
          generateTraceId()
        );
        res.status(HttpStatusCode.BAD_REQUEST).json(errorResponse);
        return;
      }
      
      if (requestData.category_type === undefined) {
        const errorResponse = createErrorResponse(
          ApiErrorCode.INVALID_PARAMETERS,
          'category_type is required',
          HttpStatusCode.BAD_REQUEST,
          generateTraceId()
        );
        res.status(HttpStatusCode.BAD_REQUEST).json(errorResponse);
        return;
      }
      
      // Validate operation_type (1 = approve, 2 = reject)
      if (![1, 2].includes(requestData.operation_type)) {
        const errorResponse = createErrorResponse(
          ApiErrorCode.INVALID_PARAMETERS,
          'operation_type must be 1 (approve) or 2 (reject)',
          HttpStatusCode.BAD_REQUEST,
          generateTraceId()
        );
        res.status(HttpStatusCode.BAD_REQUEST).json(errorResponse);
        return;
      }
      
      // Validate conditional parameters
      if (requestData.operation_type === 1 && !requestData.image_key) {
        const errorResponse = createErrorResponse(
          ApiErrorCode.INVALID_PARAMETERS,
          'image_key is required when operation_type is 1 (approve)',
          HttpStatusCode.BAD_REQUEST,
          generateTraceId()
        );
        res.status(HttpStatusCode.BAD_REQUEST).json(errorResponse);
        return;
      }
      
      if (requestData.operation_type === 2 && requestData.reject_operation === undefined) {
        const errorResponse = createErrorResponse(
          ApiErrorCode.INVALID_PARAMETERS,
          'reject_operation is required when operation_type is 2 (reject)',
          HttpStatusCode.BAD_REQUEST,
          generateTraceId()
        );
        res.status(HttpStatusCode.BAD_REQUEST).json(errorResponse);
        return;
      }
      
      // Validate category_type (1 = electronic, 2 = paper)
      if (![1, 2].includes(requestData.category_type)) {
        const errorResponse = createErrorResponse(
          ApiErrorCode.INVALID_PARAMETERS,
          'category_type must be 1 (electronic) or 2 (paper)',
          HttpStatusCode.BAD_REQUEST,
          generateTraceId()
        );
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
      
      const errorResponse = createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        'Internal server error while processing invoice',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        generateTraceId()
      );
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
  }

  /**
   * Add invoices to the system
   * POST /dop/api/v1/invoice/add
   */
  static async addInvoices(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Log incoming request details
      console.log(`[Invoice-Add] ${req.method} ${req.originalUrl}`);
      console.log(`[Invoice-Add] Request Headers:`, JSON.stringify(req.headers, null, 2));
      console.log(`[Invoice-Add] Request Body:`, JSON.stringify(req.body, null, 2));
      console.log(`[Invoice-Add] Request ID: ${req.requestId}`);
      console.log(`[Invoice-Add] Token Data:`, req.tokenData);
      
      const { invoices } = req.body;
      
      // Validate required parameters
      if (!invoices || !Array.isArray(invoices) || invoices.length === 0) {
        const errorResponse = createErrorResponse(
          ApiErrorCode.INVALID_PARAMETERS,
          'invoices array is required and must not be empty',
          HttpStatusCode.BAD_REQUEST,
          generateTraceId()
        );
        res.status(HttpStatusCode.BAD_REQUEST).json(errorResponse);
        return;
      }
      
      // 使用统一的业务逻辑
      const result = await businessLogic.addInvoices(invoices);
      
      if (!result.success) {
        res.status(result.error!.status).json(result.error);
        return;
      }
      
      res.status(HttpStatusCode.OK).json(result.data);
      
    } catch (error) {
      console.error('Error in addInvoices:', error);
      
      const errorResponse = createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        'Internal server error while adding invoices',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        generateTraceId()
      );
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
  }

  /**
   * Update invoice information
   * POST /dop/api/v1/invoice/update
   */
  static async updateInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Log incoming request details
      console.log(`[Invoice-Update] ${req.method} ${req.originalUrl}`);
      console.log(`[Invoice-Update] Request Headers:`, JSON.stringify(req.headers, null, 2));
      console.log(`[Invoice-Update] Request Body:`, JSON.stringify(req.body, null, 2));
      console.log(`[Invoice-Update] Request ID: ${req.requestId}`);
      console.log(`[Invoice-Update] Token Data:`, req.tokenData);
      
      const { order_no, invoice_data } = req.body;
      
      // Validate required parameters
      if (!order_no || !invoice_data) {
        const errorResponse = createErrorResponse(
          ApiErrorCode.INVALID_PARAMETERS,
          'order_no and invoice_data are required',
          HttpStatusCode.BAD_REQUEST,
          generateTraceId()
        );
        res.status(HttpStatusCode.BAD_REQUEST).json(errorResponse);
        return;
      }
      
      // 使用统一的业务逻辑
      const result = await businessLogic.updateInvoiceInfo(order_no, invoice_data);
      
      if (!result.success) {
        res.status(result.error!.status).json(result.error);
        return;
      }
      
      res.status(HttpStatusCode.OK).json(result.data);
      
    } catch (error) {
      console.error('Error in updateInvoice:', error);
      
      const errorResponse = createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        'Internal server error while updating invoice',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        generateTraceId()
      );
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
  }
}