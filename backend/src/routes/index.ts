/**
 * API Router Index
 *
 * Business Logic:
 * - Aggregates feature routers under `/api`
 * - Adds a simple `/api/health` route
 * - Provides a JSON 404 for unknown API paths
 *
 * Code Conventions:
 * - No business logic; only composition of routers
 *
 * @fileoverview Routes aggregator
 * @author vicky neosoft test builder app
 */
import { Router } from 'express';
import authRoutes from './auth';
import cvRoutes from './cv';
import paymentRoutes from './payment';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CV Builder API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/cv', cvRoutes);
router.use('/payment', paymentRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
  });
});

export default router;
