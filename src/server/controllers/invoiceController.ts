import { Request, Response } from 'express';
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
import { MockDataGenerator } from '../utils/mockDataGenerator';
import { MockDataLoader } from '../utils/mockDataLoader';

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
      
      // Cap page size at 100 items per page
      const pageSize = Math.min(requestData.page_size, 100);
      
      // Load mock invoice data from JSON file
      let invoiceItems: InvoiceItem[] = [];
      try {
        invoiceItems = await MockDataLoader.loadInvoices();
      } catch (error) {
        console.error('Error loading invoice data:', error);
        // Fall back to generated data if file loading fails
        invoiceItems = MockDataGenerator.generateInvoiceItems(50);
      }
      
      // Apply filters
      let filteredInvoices = [...invoiceItems];
      
      // Filter by spu_id
      if (requestData.spu_id) {
        filteredInvoices = filteredInvoices.filter(invoice => invoice.spu_id === requestData.spu_id);
      }
      
      // Filter by status
      if (requestData.status !== undefined) {
        filteredInvoices = filteredInvoices.filter(invoice => invoice.status === requestData.status);
      }
      
      // Filter by order_no
      if (requestData.order_no) {
        filteredInvoices = filteredInvoices.filter(invoice => invoice.order_no === requestData.order_no);
      }
      
      // Filter by invoice_title_type
      if (requestData.invoice_title_type !== undefined) {
        filteredInvoices = filteredInvoices.filter(invoice => invoice.invoice_title_type === requestData.invoice_title_type);
      }
      
      // Filter by apply_start_time and apply_end_time
      if (requestData.apply_start_time) {
        const startTime = new Date(requestData.apply_start_time);
        filteredInvoices = filteredInvoices.filter(invoice => {
          const applyTime = new Date(invoice.apply_time);
          return applyTime >= startTime;
        });
      }
      
      if (requestData.apply_end_time) {
        const endTime = new Date(requestData.apply_end_time);
        filteredInvoices = filteredInvoices.filter(invoice => {
          const applyTime = new Date(invoice.apply_time);
          return applyTime <= endTime;
        });
      }
      
      // Calculate pagination
      const totalResults = filteredInvoices.length;
      const startIndex = (requestData.page_no - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);
      
      // Generate response matching Dewu specification
      const response: InvoiceListResponse = {
        trace_id: MockDataGenerator.generateTraceId(),
        code: ApiErrorCode.SUCCESS,
        msg: 'success',
        data: {
          page_no: requestData.page_no,
          page_size: pageSize,
          total_results: totalResults,
          list: paginatedInvoices
        }
      };
      
      res.status(HttpStatusCode.OK).json(response);
      
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
      
      // Simulate processing logic - in a real system this would update the database
      // For mock purposes, we'll just return success
      
      // Generate successful response matching Dewu specification
      const response: InvoiceHandleResponse = {
        trace_id: MockDataGenerator.generateTraceId(),
        code: ApiErrorCode.SUCCESS,
        msg: 'success',
        data: {}
      };
      
      res.status(HttpStatusCode.OK).json(response);
      
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