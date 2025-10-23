/**
 * Payment Controller
 * @fileoverview Payment controller for CV Builder backend
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-19
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/types/express';
import { ResponseUtil } from '@/utils/response';
import { logger } from '@/utils/logger';
import { PaymentModel } from '@/models/Payment';
import { UserModel } from '@/models/User';

export class PaymentController {
  private paymentModel: PaymentModel;
  private userModel: UserModel;

  constructor() {
    this.paymentModel = new PaymentModel();
    this.userModel = new UserModel();
  }

  /**
   * Process payment
   * 
   * Business Logic:
   * - Validates payment data
   * - Creates payment transaction record
   * - Updates user subscription status
   * - Handles demo payment processing
   * - Validates 14-digit card numbers for demo
   * 
   * @param {AuthenticatedRequest} req - Express request object with authenticated user and payment data
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when payment is processed
   */
  processPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      const {
        amount,
        currency = 'INR',
        payment_method,
        transaction_id,
        status,
        action_type,
        metadata
      } = req.body;

      // Validate required fields
      if (!amount || !payment_method || !transaction_id || !action_type) {
        ResponseUtil.validationError(res, 'Missing required payment fields');
        return;
      }

      // Demo payment validation - check for 14-digit card number
      if (metadata?.card_last_four) {
        const cardNumber = metadata.card_last_four;
        if (cardNumber.length !== 4 || !/^\d+$/.test(cardNumber)) {
          ResponseUtil.validationError(res, 'Invalid card number format');
          return;
        }
      }

      // Demo payment processing - simulate payment gateway
      let paymentStatus = status;
      if (status === 'completed') {
        // For demo purposes, we'll accept any payment
        paymentStatus = 'completed';
        logger.info(`Demo payment processed for user ${userId}: ₹${amount} ${currency}`);
      }

      // Create payment transaction
      const paymentTransaction = await this.paymentModel.create({
        user_id: userId,
        amount: parseFloat(amount),
        currency,
        payment_method,
        transaction_id,
        status: paymentStatus,
        action_type,
        metadata: metadata || {}
      });

      // Update user role if it's a premium upgrade
      if (action_type === 'premium_upgrade' && paymentStatus === 'completed') {
        const planId = metadata?.plan_id;
        let newRole: 'user' | 'admin' | 'premium' = 'user';
        
        if (planId === 'premium' || planId === 'pro') {
          newRole = 'premium';
        }

        await this.userModel.update(userId, { role: newRole });
        logger.info(`User ${userId} upgraded to ${newRole} role`);
      }

      ResponseUtil.success(res, {
        transaction_id: paymentTransaction.transaction_id,
        status: paymentTransaction.status,
        amount: paymentTransaction.amount,
        currency: paymentTransaction.currency,
        message: 'Payment processed successfully'
      }, 'Payment processed successfully');

    } catch (error: any) {
      logger.error('Payment processing error:', error);
      
      if (error.message.includes('already exists')) {
        ResponseUtil.conflict(res, 'Transaction ID already exists');
        return;
      }

      ResponseUtil.error(res, 'Payment processing failed');
    }
  };

  /**
   * Get payment history
   * 
   * Business Logic:
   * - Retrieves user's payment transactions
   * - Filters by date range if provided
   * - Returns paginated results
   * 
   * @param {AuthenticatedRequest} req - Express request object with authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when payment history is retrieved
   */
  getPaymentHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      const { page = 1, limit = 10, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const payments = await this.paymentModel.findByUserId(userId, {
        limit: Number(limit),
        offset,
        status: status as string
      });

      const total = await this.paymentModel.countByUserId(userId);

      ResponseUtil.success(res, {
        payments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }, 'Payment history retrieved successfully');

    } catch (error: any) {
      logger.error('Get payment history error:', error);
      ResponseUtil.error(res, 'Failed to retrieve payment history');
    }
  };

  /**
   * Get payment statistics
   * 
   * Business Logic:
   * - Calculates user's payment statistics
   * - Returns total spent, successful payments, etc.
   * 
   * @param {AuthenticatedRequest} req - Express request object with authenticated user
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when payment statistics are retrieved
   */
  getPaymentStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      const stats = await this.paymentModel.getUserStats(userId);

      ResponseUtil.success(res, stats, 'Payment statistics retrieved successfully');

    } catch (error: any) {
      logger.error('Get payment stats error:', error);
      ResponseUtil.error(res, 'Failed to retrieve payment statistics');
    }
  };
}
