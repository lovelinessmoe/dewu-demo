import { Router } from 'express';
import { InvoiceController } from '../controllers/invoiceController';
import { authenticateAndValidateSignature } from '../middleware/auth';

const router = Router();

/**
 * Invoice List Endpoint
 * POST /dop/api/v1/invoice/list
 * Requires authentication and signature validation
 */
router.post('/dop/api/v1/invoice/list', authenticateAndValidateSignature, InvoiceController.getInvoiceList);

/**
 * Invoice Handle Endpoint
 * POST /dop/api/v1/invoice/handle
 * Requires authentication and signature validation
 */
router.post('/dop/api/v1/invoice/handle', authenticateAndValidateSignature, InvoiceController.handleInvoice);

/**
 * Add Invoices Endpoint
 * POST /dop/api/v1/invoice/add
 * Requires authentication
 */
router.post('/dop/api/v1/invoice/add', authenticateAndValidateSignature, InvoiceController.addInvoices);

/**
 * Update Invoice Endpoint
 * POST /dop/api/v1/invoice/update
 * Requires authentication
 */
router.post('/dop/api/v1/invoice/update', authenticateAndValidateSignature, InvoiceController.updateInvoice);

export default router;