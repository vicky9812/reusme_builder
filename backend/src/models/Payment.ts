/**
 * Payment Model
 * @fileoverview Payment model for CV Builder backend
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-19
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

export interface PaymentTransaction {
  id: string;
  user_id: string;
  cv_id?: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_id: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  action_type: 'download' | 'share' | 'premium_upgrade';
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentRequest {
  user_id: string;
  cv_id?: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_id: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  action_type: 'download' | 'share' | 'premium_upgrade';
  metadata: any;
}

export interface PaymentStats {
  total_spent: number;
  successful_payments: number;
  failed_payments: number;
  total_transactions: number;
  last_payment_date?: string;
}

export class PaymentModel {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Service Role Key are required');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    logger.info('Payment model initialized successfully');
  }

  /**
   * Create payment transaction
   */
  async create(paymentData: CreatePaymentRequest): Promise<PaymentTransaction> {
    try {
      const { data, error } = await (this.supabase as any)
        .from('payment_transactions')
        .insert(paymentData)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create payment transaction: ${error.message}`);
      }

      logger.info(`Payment transaction created: ${data?.transaction_id}`);
      return data as PaymentTransaction;
    } catch (error: any) {
      logger.error('Create payment transaction error:', error);
      throw error;
    }
  }

  /**
   * Find payment transactions by user ID
   */
  async findByUserId(
    userId: string, 
    options: { limit?: number; offset?: number; status?: string } = {}
  ): Promise<PaymentTransaction[]> {
    try {
      let query = (this.supabase as any)
        .from('payment_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to find payment transactions: ${error.message}`);
      }

      return (data || []) as PaymentTransaction[];
    } catch (error: any) {
      logger.error('Find payment transactions error:', error);
      throw error;
    }
  }

  /**
   * Count payment transactions by user ID
   */
  async countByUserId(userId: string): Promise<number> {
    try {
      const { count, error } = await (this.supabase as any)
        .from('payment_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to count payment transactions: ${error.message}`);
      }

      return count || 0;
    } catch (error: any) {
      logger.error('Count payment transactions error:', error);
      throw error;
    }
  }

  /**
   * Get user payment statistics
   */
  async getUserStats(userId: string): Promise<PaymentStats> {
    try {
      const { data: payments, error } = await (this.supabase as any)
        .from('payment_transactions')
        .select('amount, status, created_at')
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to get payment statistics: ${error.message}`);
      }

      const stats: PaymentStats = {
        total_spent: 0,
        successful_payments: 0,
        failed_payments: 0,
        total_transactions: payments?.length || 0,
        last_payment_date: undefined
      };

      if (payments && payments.length > 0) {
        // Sort by created_at to get the latest payment
        const sortedPayments = payments.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        stats.last_payment_date = sortedPayments[0].created_at;

        // Calculate statistics
        payments.forEach((payment: any) => {
          if (payment.status === 'completed') {
            stats.total_spent += payment.amount;
            stats.successful_payments++;
          } else if (payment.status === 'failed') {
            stats.failed_payments++;
          }
        });
      }

      return stats;
    } catch (error: any) {
      logger.error('Get user payment stats error:', error);
      throw error;
    }
  }

  /**
   * Find payment transaction by transaction ID
   */
  async findByTransactionId(transactionId: string): Promise<PaymentTransaction | null> {
    try {
      const { data, error } = await (this.supabase as any)
        .from('payment_transactions')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No rows found
        }
        throw new Error(`Failed to find payment transaction: ${error.message}`);
      }

      return data as PaymentTransaction;
    } catch (error: any) {
      logger.error('Find payment transaction by ID error:', error);
      throw error;
    }
  }

  /**
   * Update payment transaction status
   */
  async updateStatus(transactionId: string, status: PaymentTransaction['status']): Promise<void> {
    try {
      const { error } = await (this.supabase as any)
        .from('payment_transactions')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', transactionId);

      if (error) {
        throw new Error(`Failed to update payment transaction status: ${error.message}`);
      }

      logger.info(`Payment transaction status updated: ${transactionId} -> ${status}`);
    } catch (error: any) {
      logger.error('Update payment transaction status error:', error);
      throw error;
    }
  }
}
