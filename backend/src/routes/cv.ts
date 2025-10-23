/**
 * CV Routes
 *
 * Business Logic:
 * - Validates params, authenticates, and authorizes before controller calls
 * - Uses `hasPermission('download:own')` etc. for role-based checks
 *
 * Code Conventions:
 * - Keep routes thin; delegate to controller methods
 *
 * @fileoverview Express routes for CV feature
 * @author vicky neosoft test builder app
 */
import { Router, Request, Response, NextFunction } from 'express';
import { CVController } from '@/controllers/CVController';
import { 
  authenticate, 
  requireOwnership,
  hasPermission 
} from '@/middleware/auth';
import { 
  validateBody, 
  validateParams,
  validatePagination, 
  sanitizeInput,
  validateUUID,
  requireFields 
} from '@/middleware/validation';
import { ValidationUtil } from '@/utils/validation';
import { AuthenticatedRequest } from '@/shared/types';

const router = Router();
const cvController = new CVController();

/**
 * @route   POST /api/cv
 * @desc    Create a new CV
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  sanitizeInput,
  validateBody(ValidationUtil.validateCVCreation),
  hasPermission('write:own'),
  (req: any, res: Response) => {
    cvController.createCV(req, res);
  }
);

/**
 * @route   GET /api/cv
 * @desc    Get user's CVs with pagination
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  validatePagination,
  hasPermission('read:own'),
  (req: any, res: Response) => {
    cvController.getUserCVs(req, res);
  }
);

/**
 * @route   GET /api/cv/dashboard-stats
 * @desc    Get dashboard statistics for authenticated user
 * @access  Private
 */
router.get(
  '/dashboard-stats',
  authenticate,
  cvController.getDashboardStats
);

/**
 * @route   GET /api/cv/layouts
 * @desc    Get available CV layouts
 * @access  Public
 */
router.get(
  '/layouts',
  cvController.getLayouts
);

/**
 * @route   GET /api/cv/stats
 * @desc    Get user's CV statistics
 * @access  Private
 */
router.get(
  '/stats',
  authenticate,
  hasPermission('read:own'),
  (req: any, res: Response) => {
    cvController.getCVStats(req, res);
  }
);

/**
 * @route   GET /api/cv/:cvId
 * @desc    Get CV by ID
 * @access  Private (or Public if CV is public)
 */
router.get(
  '/:cvId',
  validateUUID('cvId'),
  authenticate, // Optional authentication for public CVs
  (req: any, res: Response) => {
    cvController.getCV(req, res);
  }
);

/**
 * @route   PUT /api/cv/:cvId
 * @desc    Update CV
 * @access  Private
 */
router.put(
  '/:cvId',
  validateUUID('cvId'),
  authenticate,
  sanitizeInput,
  validateBody(ValidationUtil.validateCVUpdate),
  hasPermission('write:own'),
  (req: any, res: Response) => {
    cvController.updateCV(req, res);
  }
);

/**
 * @route   DELETE /api/cv/:cvId
 * @desc    Delete CV
 * @access  Private
 */
router.delete(
  '/:cvId',
  validateUUID('cvId'),
  authenticate,
  hasPermission('delete:own'),
  (req: any, res: Response) => {
    cvController.deleteCV(req, res);
  }
);

/**
 * @route   POST /api/cv/:cvId/duplicate
 * @desc    Duplicate CV
 * @access  Private
 */
router.post(
  '/:cvId/duplicate',
  validateUUID('cvId'),
  authenticate,
  sanitizeInput,
  hasPermission('write:own'),
  (req: any, res: Response) => {
    cvController.duplicateCV(req, res);
  }
);

/**
 * @route   POST /api/cv/:cvId/download
 * @desc    Download CV as PDF
 * @access  Private
 */
router.post(
  '/:cvId/download',
  validateUUID('cvId'),
  authenticate,
  hasPermission('download:own'),
  (req: any, res: Response) => {
    cvController.downloadCV(req, res);
  }
);

/**
 * @route   POST /api/cv/:cvId/share
 * @desc    Share CV
 * @access  Private
 */
router.post(
  '/:cvId/share',
  validateUUID('cvId'),
  authenticate,
  sanitizeInput,
  requireFields(['platform']),
  hasPermission('share:own'),
  (req: any, res: Response) => {
    cvController.shareCV(req, res);
  }
);

export default router;
