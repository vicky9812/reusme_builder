/**
 * Payment Routes
 * @fileoverview Payment routes for CV Builder backend
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-19
 */

import { Router, Response } from 'express';
import { PaymentController } from '@/controllers/PaymentController';
import { authenticate } from '@/middleware/auth';
import { sanitizeInput } from '@/middleware/validation';
import { requireFields } from '@/middleware/validation';

const router = Router();
const paymentController = new PaymentController();

/**
 * @route   POST /api/payment/process
 * @desc    Process payment transaction
 * @access  Private
 */
router.post(
  '/process',
  authenticate,
  sanitizeInput,
  requireFields(['amount', 'payment_method', 'transaction_id', 'action_type']),
  (req: any, res: Response) => {
    paymentController.processPayment(req, res);
  }
);

/**
 * @route   GET /api/payment/history
 * @desc    Get user payment history
 * @access  Private
 */
router.get(
  '/history',
  authenticate,
  (req: any, res: Response) => {
    paymentController.getPaymentHistory(req, res);
  }
);

/**
 * @route   GET /api/payment/stats
 * @desc    Get user payment statistics
 * @access  Private
 */
router.get(
  '/stats',
  authenticate,
  (req: any, res: Response) => {
    paymentController.getPaymentStats(req, res);
  }
);

export default router;


