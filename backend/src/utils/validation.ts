import { ValidationError } from '@/shared/types';
import { UserRules, CVRules } from '@/shared/rules';

/**
 * Utility class for validation operations
 */
export class ValidationUtil {
  /**
   * Combine multiple validation error arrays
   */
  static combineErrors(...errorArrays: ValidationError[][]): ValidationError[] {
    return errorArrays.flat();
  }

  /**
   * Check if validation errors exist
   */
  static hasErrors(errors: ValidationError[]): boolean {
    return errors.length > 0;
  }

  /**
   * Format validation errors for API response
   */
  static formatErrors(errors: ValidationError[]): string {
    return errors.map(error => `${error.field}: ${error.message}`).join(', ');
  }

  /**
   * Validate user registration data
   */
  static validateUserRegistration(data: {
    username: string;
    email: string;
    password: string;
    contact_number?: string;
  }): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate username
    errors.push(...UserRules.validateUsername(data.username));

    // Validate email
    errors.push(...UserRules.validateEmail(data.email));

    // Validate password
    errors.push(...UserRules.validatePassword(data.password));

    // Validate contact number (optional)
    if (data.contact_number) {
      errors.push(...UserRules.validateContactNumber(data.contact_number));
    }

    return errors;
  }

  /**
   * Validate profile update data
   */
  static validateProfileUpdate(data: {
    username?: string;
    email?: string;
    contact_number?: string;
  }): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate username (optional)
    if (data.username) {
      errors.push(...UserRules.validateUsername(data.username));
    }

    // Validate email (optional)
    if (data.email) {
      errors.push(...UserRules.validateEmail(data.email));
    }

    // Validate contact number (optional)
    if (data.contact_number) {
      errors.push(...UserRules.validateContactNumber(data.contact_number));
    }

    return errors;
  }

  /**
   * Validate password
   */
  static validatePassword(password: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!password || password.length === 0) {
      errors.push({ field: 'password', message: 'Password is required' });
      return errors;
    }

    if (password.length < 8) {
      errors.push({ 
        field: 'password', 
        message: 'Password must be at least 8 characters long' 
      });
    }

    if (password.length > 128) {
      errors.push({ 
        field: 'password', 
        message: 'Password must not exceed 128 characters' 
      });
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
      errors.push({ 
        field: 'password', 
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
      });
    }

    return errors;
  }

  /**
   * Validate user login data
   */
  static validateUserLogin(data: {
    username?: string;
    email?: string;
    password: string;
  }): ValidationError[] {
    const errors: ValidationError[] = [];

    // Either username or email must be provided
    if (!data.username && !data.email) {
      errors.push({
        field: 'username_or_email',
        message: 'Either username or email is required'
      });
    }

    // Validate password
    errors.push(...UserRules.validatePassword(data.password));

    // If username is provided, validate it
    if (data.username) {
      errors.push(...UserRules.validateUsername(data.username));
    }

    // If email is provided, validate it
    if (data.email) {
      errors.push(...UserRules.validateEmail(data.email));
    }

    return errors;
  }

  /**
   * Validate CV creation data
   */
  static validateCVCreation(data: {
    title: string;
    layout: string;
    basic_details: any;
    education?: any[];
    experience?: any[];
    projects?: any[];
    skills?: any[];
    social_profiles?: any[];
  }): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate title
    errors.push(...CVRules.validateTitle(data.title));

    // Validate layout
    errors.push(...CVRules.validateLayout(data.layout));

    // Validate basic details
    errors.push(...CVRules.validateBasicDetails(data.basic_details));

    // Validate education (if provided)
    if (data.education && data.education.length > 0) {
      errors.push(...CVRules.validateEducation(data.education));
    }

    // Validate experience (if provided)
    if (data.experience && data.experience.length > 0) {
      errors.push(...CVRules.validateExperience(data.experience));
    }

    // Validate projects (if provided)
    if (data.projects && data.projects.length > 0) {
      errors.push(...CVRules.validateProjects(data.projects));
    }

    // Validate skills (if provided)
    if (data.skills && data.skills.length > 0) {
      errors.push(...CVRules.validateSkills(data.skills));
    }

    // Validate social profiles (if provided)
    if (data.social_profiles && data.social_profiles.length > 0) {
      errors.push(...CVRules.validateSocialProfiles(data.social_profiles));
    }

    return errors;
  }

  /**
   * Validate CV update data
   */
  static validateCVUpdate(data: {
    title?: string;
    layout?: string;
    status?: string;
    is_public?: boolean;
    basic_details?: any;
    education?: any[];
    experience?: any[];
    projects?: any[];
    skills?: any[];
    social_profiles?: any[];
  }): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate title (if provided)
    if (data.title !== undefined) {
      errors.push(...CVRules.validateTitle(data.title));
    }

    // Validate layout (if provided)
    if (data.layout !== undefined) {
      errors.push(...CVRules.validateLayout(data.layout));
    }

    // Validate status (if provided)
    if (data.status !== undefined) {
      const validStatuses = ['draft', 'published', 'archived'];
      if (!validStatuses.includes(data.status)) {
        errors.push({
          field: 'status',
          message: `Status must be one of: draft, published, archived`
        });
      }
    }

    // Validate basic details (if provided)
    if (data.basic_details !== undefined) {
      errors.push(...CVRules.validateBasicDetails(data.basic_details));
    }

    // Validate education (if provided)
    if (data.education !== undefined && data.education.length > 0) {
      errors.push(...CVRules.validateEducation(data.education));
    }

    // Validate experience (if provided)
    if (data.experience !== undefined && data.experience.length > 0) {
      errors.push(...CVRules.validateExperience(data.experience));
    }

    // Validate projects (if provided)
    if (data.projects !== undefined && data.projects.length > 0) {
      errors.push(...CVRules.validateProjects(data.projects));
    }

    // Validate skills (if provided)
    if (data.skills !== undefined && data.skills.length > 0) {
      errors.push(...CVRules.validateSkills(data.skills));
    }

    // Validate social profiles (if provided)
    if (data.social_profiles !== undefined && data.social_profiles.length > 0) {
      errors.push(...CVRules.validateSocialProfiles(data.social_profiles));
    }

    return errors;
  }

  /**
   * Validate pagination parameters
   */
  static validatePagination(page?: number, limit?: number): ValidationError[] {
    const errors: ValidationError[] = [];

    if (page !== undefined) {
      if (page < 1) {
        errors.push({
          field: 'page',
          message: 'Page must be greater than 0'
        });
      }
    }

    if (limit !== undefined) {
      if (limit < 1) {
        errors.push({
          field: 'limit',
          message: 'Limit must be greater than 0'
        });
      }
      if (limit > 100) {
        errors.push({
          field: 'limit',
          message: 'Limit must not exceed 100'
        });
      }
    }

    return errors;
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(file: {
    mimetype: string;
    size: number;
  }): ValidationError[] {
    const errors: ValidationError[] = [];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.mimetype)) {
      errors.push({
        field: 'file',
        message: 'File type not allowed. Only JPEG, PNG, GIF, and WebP images are allowed'
      });
    }

    if (file.size > maxSize) {
      errors.push({
        field: 'file',
        message: 'File size too large. Maximum size is 5MB'
      });
    }

    return errors;
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate phone number format
   */
  static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validate date format (YYYY-MM-DD)
   */
  static isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return false;
    }
    
    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
  }

  /**
   * Validate percentage (0-100)
   */
  static isValidPercentage(percentage: number): boolean {
    return percentage >= 0 && percentage <= 100;
  }

  /**
   * Validate CGPA (0-10)
   */
  static isValidCGPA(cgpa: number): boolean {
    return cgpa >= 0 && cgpa <= 10;
  }
}

export default ValidationUtil;
