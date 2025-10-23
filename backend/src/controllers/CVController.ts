/**
 * CV (Curriculum Vitae) Controller
 *
 * Business Logic:
 * - Orchestrates CRUD, dashboard stats, and share/download actions
 * - Validates input and enforces permissions via `ValidationUtil`, `UserRules`, `CVRules`
 * - Delegates data access to `CVModel`/`UserModel` only (no SQL here)
 * - Produces consistent API responses through `ResponseUtil`
 *
 * Code Conventions:
 * - Guard-clause style validation and authorization
 * - Typed `AuthenticatedRequest` for endpoints that require `req.user`
 * - No side-effects outside of logging and model calls
 *
 * @fileoverview HTTP adapter for CV operations
 * @author vicky neosoft test builder app
 */

import { Request, Response } from 'express';
import { CVModel } from '@/models/CV';
import { UserModel } from '@/models/User';
import { ValidationUtil } from '@/utils/validation';
import { ResponseUtil } from '@/utils/response';
import { AuthenticatedRequest, CreateCVRequest, UpdateCVRequest, QueryOptions } from '@/shared/types';
import { CVRules, UserRules } from '@/shared/rules';
import { logger } from '@/utils/logger';

/**
 * CV Controller class
 * 
 * Handles all CV-related HTTP requests and responses
 * 
 * @class CVController
 */
export class CVController {
  private cvModel: CVModel;
  private userModel: UserModel;

  /**
   * Constructor initializes CV and User model dependencies
   * 
   * Business Logic:
   * - Creates CVModel instance for CV database operations
   * - Creates UserModel instance for user-related operations
   * - Establishes dependency injection pattern
   * 
   * @constructor
   */
  constructor() {
    this.cvModel = new CVModel();
    this.userModel = new UserModel();
  }

  /**
   * Create a new CV for authenticated user
   * 
   * Business Logic:
   * - Validates CV data including layout and content
   * - Checks user permissions and account status
   * - Creates CV record with initial DRAFT status
   * - Assigns unique CV ID and user ownership
   * - Sets up CV metadata and timestamps
   * - Returns created CV data for immediate editing
   * 
   * @param {AuthenticatedRequest} req - Express request object with authenticated user and CV data
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when CV is created
   */
  createCV = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      const cvData: CreateCVRequest = req.body;

      // Validate input
      const errors = ValidationUtil.validateCVCreation(cvData);
      if (ValidationUtil.hasErrors(errors)) {
        const errorMessage = ValidationUtil.formatErrors(errors);
        ResponseUtil.validationError(res, 'CV creation validation failed', errorMessage);
        return;
      }

      // Get user to check permissions
      const user = await this.userModel.findById(userId);
      if (!user) {
        ResponseUtil.notFound(res, 'User not found');
        return;
      }

      // Check if user can create CV
      const canCreate = UserRules.canCreateCV(user);
      if (!canCreate.allowed) {
        ResponseUtil.forbidden(res, canCreate.reason);
        return;
      }

      // Get current CV count
      const { cvs } = await this.cvModel.findByUserId(userId);
      const canCreateMore = CVRules.canUserCreateMoreCVs(user, cvs.length);
      if (!canCreateMore.allowed) {
        ResponseUtil.forbidden(res, canCreateMore.reason);
        return;
      }

      // Create CV
      const result = await this.cvModel.create(userId, cvData);

      ResponseUtil.created(res, result, 'CV created successfully');
    } catch (error: any) {
      logger.error('CV creation error:', error);
      ResponseUtil.error(res, 'CV creation failed');
    }
  };

  /**
   * Get CV by ID
   */
  getCV = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { cvId } = req.params;
      const userId = req.user?.userId;

      if (!cvId) {
        ResponseUtil.badRequest(res, 'CV ID is required');
        return;
      }

      // Get CV (with ownership check if user is authenticated)
      const cv = await this.cvModel.findById(cvId, userId);
      if (!cv) {
        ResponseUtil.notFound(res, 'CV not found');
        return;
      }

      ResponseUtil.success(res, cv, 'CV retrieved successfully');
    } catch (error: any) {
      logger.error('Get CV error:', error);
      ResponseUtil.error(res, 'Failed to get CV');
    }
  };

  /**
   * Get user's CVs with pagination
   */
  getUserCVs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as string;

      const options: QueryOptions = {
        page,
        limit,
        search,
        filters: status ? { status } : undefined,
      };

      // Get CVs
      const result = await this.cvModel.findByUserId(userId, options);

      ResponseUtil.successWithPagination(res, result.cvs, result.pagination, 'CVs retrieved successfully');
    } catch (error: any) {
      logger.error('Get user CVs error:', error);
      ResponseUtil.error(res, 'Failed to get CVs');
    }
  };

  /**
   * Update CV
   */
  updateCV = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { cvId } = req.params;
      const userId = req.user?.userId;
      const updates: UpdateCVRequest = req.body;

      if (!cvId) {
        ResponseUtil.badRequest(res, 'CV ID is required');
        return;
      }

      if (!userId) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      // Validate input
      const errors = ValidationUtil.validateCVUpdate(updates);
      if (ValidationUtil.hasErrors(errors)) {
        const errorMessage = ValidationUtil.formatErrors(errors);
        ResponseUtil.validationError(res, 'CV update validation failed', errorMessage);
        return;
      }

      // Update CV
      const result = await this.cvModel.update(cvId, userId, updates);

      ResponseUtil.success(res, result, 'CV updated successfully');
    } catch (error: any) {
      logger.error('CV update error:', error);
      
      if (error.message === 'CV not found or access denied') {
        ResponseUtil.notFound(res, 'CV not found or access denied');
        return;
      }

      ResponseUtil.error(res, 'CV update failed');
    }
  };

  /**
   * Delete CV
   */
  deleteCV = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { cvId } = req.params;
      const userId = req.user?.userId;

      if (!cvId) {
        ResponseUtil.badRequest(res, 'CV ID is required');
        return;
      }

      if (!userId) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      // Delete CV
      await this.cvModel.delete(cvId, userId);

      ResponseUtil.success(res, null, 'CV deleted successfully');
    } catch (error: any) {
      logger.error('CV deletion error:', error);
      
      if (error.message === 'CV not found or access denied') {
        ResponseUtil.notFound(res, 'CV not found or access denied');
        return;
      }

      ResponseUtil.error(res, 'CV deletion failed');
    }
  };

  /**
   * Duplicate CV
   */
  duplicateCV = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { cvId } = req.params;
      const userId = req.user?.userId;
      const { title } = req.body;

      if (!cvId) {
        ResponseUtil.badRequest(res, 'CV ID is required');
        return;
      }

      if (!userId) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      // Get user to check permissions
      const user = await this.userModel.findById(userId);
      if (!user) {
        ResponseUtil.notFound(res, 'User not found');
        return;
      }

      // Check if user can create more CVs
      const { cvs } = await this.cvModel.findByUserId(userId);
      const canCreateMore = CVRules.canUserCreateMoreCVs(user, cvs.length);
      if (!canCreateMore.allowed) {
        ResponseUtil.forbidden(res, canCreateMore.reason);
        return;
      }

      // Duplicate CV
      const result = await this.cvModel.duplicate(cvId, userId, title);

      ResponseUtil.created(res, result, 'CV duplicated successfully');
    } catch (error: any) {
      logger.error('CV duplication error:', error);
      
      if (error.message === 'CV not found or access denied') {
        ResponseUtil.notFound(res, 'CV not found or access denied');
        return;
      }

      ResponseUtil.error(res, 'CV duplication failed');
    }
  };

  /**
   * Download CV (placeholder - would generate PDF)
   */
  downloadCV = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { cvId } = req.params;
      const userId = req.user?.userId;

      if (!cvId) {
        ResponseUtil.badRequest(res, 'CV ID is required');
        return;
      }

      if (!userId) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      // Get user and CV
      const user = await this.userModel.findById(userId);
      const cv = await this.cvModel.findById(cvId, userId);

      if (!user || !cv) {
        ResponseUtil.notFound(res, 'User or CV not found');
        return;
      }

      // Check download permissions
      const canDownload = UserRules.canDownloadCV(user, cv.cv);
      if (!canDownload.allowed) {
        ResponseUtil.forbidden(res, canDownload.reason);
        return;
      }

      // Check download limits
      const userStats = await this.userModel.getUserStats(userId);
      const canDownloadMore = CVRules.canUserDownloadMore(user, userStats.downloadsThisMonth);
      if (!canDownloadMore.allowed) {
        ResponseUtil.paymentRequired(res, canDownloadMore.reason);
        return;
      }

      // TODO: Generate PDF and return file
      // For now, just increment download count
      await this.cvModel.incrementDownloadCount(cvId);

      // TODO: Create download record
      // await this.createDownloadRecord(userId, cvId, 'pdf');

      ResponseUtil.success(res, { message: 'Download initiated' }, 'CV download started');
    } catch (error: any) {
      logger.error('CV download error:', error);
      ResponseUtil.error(res, 'CV download failed');
    }
  };

  /**
   * Share CV (placeholder - would send email/social media)
   */
  shareCV = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { cvId } = req.params;
      const userId = req.user?.userId;
      const { platform, recipient_email } = req.body;

      if (!cvId) {
        ResponseUtil.badRequest(res, 'CV ID is required');
        return;
      }

      if (!userId) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      if (!platform) {
        ResponseUtil.badRequest(res, 'Share platform is required');
        return;
      }

      // Get user and CV
      const user = await this.userModel.findById(userId);
      const cv = await this.cvModel.findById(cvId, userId);

      if (!user || !cv) {
        ResponseUtil.notFound(res, 'User or CV not found');
        return;
      }

      // Check share permissions
      const canShare = UserRules.canShareCV(user, cv.cv);
      if (!canShare.allowed) {
        ResponseUtil.forbidden(res, canShare.reason);
        return;
      }

      // Check share limits
      const userStats = await this.userModel.getUserStats(userId);
      const canShareMore = CVRules.canUserShareMore(user, userStats.sharesThisMonth);
      if (!canShareMore.allowed) {
        ResponseUtil.paymentRequired(res, canShareMore.reason);
        return;
      }

      // TODO: Implement sharing logic (email, social media, etc.)
      // For now, just increment share count
      await this.cvModel.incrementShareCount(cvId);

      // TODO: Create share record
      // await this.createShareRecord(userId, cvId, platform, recipient_email);

      ResponseUtil.success(res, { message: 'Share initiated' }, 'CV shared successfully');
    } catch (error: any) {
      logger.error('CV share error:', error);
      ResponseUtil.error(res, 'CV share failed');
    }
  };

  /**
   * Get CV statistics
   */
  getCVStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      // Get user statistics
      const stats = await this.userModel.getUserStats(userId);

      ResponseUtil.success(res, stats, 'CV statistics retrieved successfully');
    } catch (error: any) {
      logger.error('Get CV stats error:', error);
      ResponseUtil.error(res, 'Failed to get CV statistics');
    }
  };

  /**
   * Get available CV layouts
   */
  getLayouts = async (req: Request, res: Response): Promise<void> => {
    try {
      // TODO: Get layouts from database or configuration
      const layouts = [
        {
          id: 'modern',
          name: 'Modern',
          description: 'Clean and contemporary design',
          preview_url: '/images/layouts/modern-preview.png',
        },
        {
          id: 'classic',
          name: 'Classic',
          description: 'Traditional and professional layout',
          preview_url: '/images/layouts/classic-preview.png',
        },
        {
          id: 'creative',
          name: 'Creative',
          description: 'Unique and artistic design',
          preview_url: '/images/layouts/creative-preview.png',
        },
      ];

      ResponseUtil.success(res, layouts, 'CV layouts retrieved successfully');
    } catch (error: any) {
      logger.error('Get layouts error:', error);
      ResponseUtil.error(res, 'Failed to get CV layouts');
    }
  };

  /**
   * Get dashboard statistics for authenticated user
   * @author Vicky
   */
  getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        ResponseUtil.unauthorized(res, 'Authentication required');
        return;
      }

      const stats = await this.cvModel.getDashboardStats(userId);
      ResponseUtil.success(res, stats, 'Dashboard statistics retrieved successfully');
    } catch (error: any) {
      logger.error('Get dashboard stats error:', error);
      ResponseUtil.error(res, 'Failed to retrieve dashboard statistics');
    }
  };
}

export default CVController;
