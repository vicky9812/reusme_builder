/**
 * Authorization & Business Rules
 *
 * Business Logic:
 * - Encapsulates permission checks (own/unlimited), limits and validations
 * - Keeps domain rules independent of HTTP and persistence
 *
 * Code Conventions:
 * - Return `{ allowed, reason? }` objects for all rule checks
 *
 * @fileoverview Domain rules for users and CVs
 * @author vicky neosoft test builder app
 */
import { 
  VALIDATION_RULES, 
  BUSINESS_RULES, 
  USER_ROLES, 
  CV_STATUS, 
  CV_LAYOUTS,
  OAUTH_PROVIDERS 
} from './constants';
import { 
  User, 
  CV, 
  BasicDetails, 
  Education, 
  Experience, 
  Project, 
  Skill, 
  SocialProfile,
  ValidationError 
} from './types';

/**
 * Business Rules and Validation Logic
 * This file contains all the business logic rules and validation functions
 * that define the constraints and conditions for the CV Builder application
 */

// User Validation Rules
export class UserRules {
  static validateUsername(username: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!username || username.trim().length === 0) {
      errors.push({ field: 'username', message: 'Username is required' });
      return errors;
    }

    const trimmedUsername = username.trim();
    
    if (trimmedUsername.length < VALIDATION_RULES.USERNAME.MIN_LENGTH) {
      errors.push({ 
        field: 'username', 
        message: `Username must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters long` 
      });
    }

    if (trimmedUsername.length > VALIDATION_RULES.USERNAME.MAX_LENGTH) {
      errors.push({ 
        field: 'username', 
        message: `Username must not exceed ${VALIDATION_RULES.USERNAME.MAX_LENGTH} characters` 
      });
    }

    if (!VALIDATION_RULES.USERNAME.PATTERN.test(trimmedUsername)) {
      errors.push({ 
        field: 'username', 
        message: 'Username can only contain letters, numbers, and underscores' 
      });
    }

    return errors;
  }

  static validateEmail(email: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!email || email.trim().length === 0) {
      errors.push({ field: 'email', message: 'Email is required' });
      return errors;
    }

    if (!VALIDATION_RULES.EMAIL.PATTERN.test(email)) {
      errors.push({ field: 'email', message: 'Please provide a valid email address' });
    }

    return errors;
  }

  static validatePassword(password: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!password || password.length === 0) {
      errors.push({ field: 'password', message: 'Password is required' });
      return errors;
    }

    if (password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
      errors.push({ 
        field: 'password', 
        message: `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters long` 
      });
    }

    if (password.length > VALIDATION_RULES.PASSWORD.MAX_LENGTH) {
      errors.push({ 
        field: 'password', 
        message: `Password must not exceed ${VALIDATION_RULES.PASSWORD.MAX_LENGTH} characters` 
      });
    }

    if (!VALIDATION_RULES.PASSWORD.PATTERN.test(password)) {
      errors.push({ 
        field: 'password', 
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
      });
    }

    return errors;
  }

  static validateContactNumber(contactNumber?: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!contactNumber) return errors; // Optional field

    if (!VALIDATION_RULES.PHONE.PATTERN.test(contactNumber)) {
      errors.push({ field: 'contact_number', message: 'Please provide a valid contact number' });
    }

    return errors;
  }

  static canCreateCV(user: User): { allowed: boolean; reason?: string } {
    // Check if user is active
    if (!user.is_active) {
      return { allowed: false, reason: 'User account is not active' };
    }

    // Check if user is verified (for non-OAuth users)
    if (!user.oauth_provider && !user.is_verified) {
      return { allowed: false, reason: 'Email verification required' };
    }

    return { allowed: true };
  }

  static canDownloadCV(user: User, cv: CV): { allowed: boolean; reason?: string } {
    // Check if user owns the CV
    if (user.id !== cv.user_id) {
      return { allowed: false, reason: 'You can only download your own CVs' };
    }

    // Allow downloading DRAFT CVs for testing purposes
    // TODO: Re-enable this check in production
    // if (cv.status !== 'published') {
    //   return { allowed: false, reason: 'CV must be published before downloading' };
    // }

    return { allowed: true };
  }

  static canShareCV(user: User, cv: CV): { allowed: boolean; reason?: string } {
    // Check if user owns the CV
    if (user.id !== cv.user_id) {
      return { allowed: false, reason: 'You can only share your own CVs' };
    }

    // Check if CV is published
    if (cv.status !== 'published') {
      return { allowed: false, reason: 'CV must be published before sharing' };
    }

    return { allowed: true };
  }
}

// CV Validation Rules
export class CVRules {
  static validateTitle(title: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!title || title.trim().length === 0) {
      errors.push({ field: 'title', message: 'CV title is required' });
      return errors;
    }

    const trimmedTitle = title.trim();
    
    if (trimmedTitle.length < 3) {
      errors.push({ field: 'title', message: 'CV title must be at least 3 characters long' });
    }

    if (trimmedTitle.length > 100) {
      errors.push({ field: 'title', message: 'CV title must not exceed 100 characters' });
    }

    return errors;
  }

  static validateLayout(layout: string): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!layout) {
      errors.push({ field: 'layout', message: 'CV layout is required' });
      return errors;
    }

    const validLayouts = ['modern', 'classic', 'creative'];
    if (!validLayouts.includes(layout)) {
      errors.push({ 
        field: 'layout', 
        message: `Invalid layout. Must be one of: modern, classic, creative` 
      });
    }

    return errors;
  }

  static validateBasicDetails(basicDetails: BasicDetails): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!basicDetails.full_name || basicDetails.full_name.trim().length === 0) {
      errors.push({ field: 'full_name', message: 'Full name is required' });
    } else {
      const trimmedName = basicDetails.full_name.trim();
      if (trimmedName.length < VALIDATION_RULES.NAME.MIN_LENGTH) {
        errors.push({ 
          field: 'full_name', 
          message: `Full name must be at least ${VALIDATION_RULES.NAME.MIN_LENGTH} characters long` 
        });
      }
      if (trimmedName.length > VALIDATION_RULES.NAME.MAX_LENGTH) {
        errors.push({ 
          field: 'full_name', 
          message: `Full name must not exceed ${VALIDATION_RULES.NAME.MAX_LENGTH} characters` 
        });
      }
    }

    if (!basicDetails.email || !VALIDATION_RULES.EMAIL.PATTERN.test(basicDetails.email)) {
      errors.push({ field: 'email', message: 'Valid email is required' });
    }

    if (basicDetails.phone && !VALIDATION_RULES.PHONE.PATTERN.test(basicDetails.phone)) {
      errors.push({ field: 'phone', message: 'Please provide a valid phone number' });
    }

    if (basicDetails.introduction && basicDetails.introduction.length > VALIDATION_RULES.DESCRIPTION.MAX_LENGTH) {
      errors.push({ 
        field: 'introduction', 
        message: `Introduction must not exceed ${VALIDATION_RULES.DESCRIPTION.MAX_LENGTH} characters` 
      });
    }

    return errors;
  }

  static validateEducation(education: Education[]): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (education.length > BUSINESS_RULES.MAX_EDUCATION_ENTRIES) {
      errors.push({ 
        field: 'education', 
        message: `Maximum ${BUSINESS_RULES.MAX_EDUCATION_ENTRIES} education entries allowed` 
      });
    }

    education.forEach((edu, index) => {
      if (!edu.degree_name || edu.degree_name.trim().length === 0) {
        errors.push({ field: `education[${index}].degree_name`, message: 'Degree name is required' });
      }

      if (!edu.institution || edu.institution.trim().length === 0) {
        errors.push({ field: `education[${index}].institution`, message: 'Institution name is required' });
      }

      if (!edu.start_date) {
        errors.push({ field: `education[${index}].start_date`, message: 'Start date is required' });
      }

      if (edu.percentage && (edu.percentage < 0 || edu.percentage > 100)) {
        errors.push({ field: `education[${index}].percentage`, message: 'Percentage must be between 0 and 100' });
      }

      if (edu.cgpa && (edu.cgpa < 0 || edu.cgpa > 10)) {
        errors.push({ field: `education[${index}].cgpa`, message: 'CGPA must be between 0 and 10' });
      }
    });

    return errors;
  }

  static validateExperience(experience: Experience[]): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (experience.length > BUSINESS_RULES.MAX_EXPERIENCE_ENTRIES) {
      errors.push({ 
        field: 'experience', 
        message: `Maximum ${BUSINESS_RULES.MAX_EXPERIENCE_ENTRIES} experience entries allowed` 
      });
    }

    experience.forEach((exp, index) => {
      if (!exp.organization_name || exp.organization_name.trim().length === 0) {
        errors.push({ field: `experience[${index}].organization_name`, message: 'Organization name is required' });
      }

      if (!exp.position || exp.position.trim().length === 0) {
        errors.push({ field: `experience[${index}].position`, message: 'Position is required' });
      }

      if (!exp.joining_date) {
        errors.push({ field: `experience[${index}].joining_date`, message: 'Joining date is required' });
      }
    });

    return errors;
  }

  static validateProjects(projects: Project[]): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (projects.length > BUSINESS_RULES.MAX_PROJECT_ENTRIES) {
      errors.push({ 
        field: 'projects', 
        message: `Maximum ${BUSINESS_RULES.MAX_PROJECT_ENTRIES} project entries allowed` 
      });
    }

    projects.forEach((project, index) => {
      if (!project.title || project.title.trim().length === 0) {
        errors.push({ field: `projects[${index}].title`, message: 'Project title is required' });
      } else {
        const trimmedTitle = project.title.trim();
        if (trimmedTitle.length < VALIDATION_RULES.PROJECT_TITLE.MIN_LENGTH) {
          errors.push({ 
            field: `projects[${index}].title`, 
            message: `Project title must be at least ${VALIDATION_RULES.PROJECT_TITLE.MIN_LENGTH} characters long` 
          });
        }
        if (trimmedTitle.length > VALIDATION_RULES.PROJECT_TITLE.MAX_LENGTH) {
          errors.push({ 
            field: `projects[${index}].title`, 
            message: `Project title must not exceed ${VALIDATION_RULES.PROJECT_TITLE.MAX_LENGTH} characters` 
          });
        }
      }

      if (project.team_size && project.team_size < 1) {
        errors.push({ field: `projects[${index}].team_size`, message: 'Team size must be at least 1' });
      }
    });

    return errors;
  }

  static validateSkills(skills: Skill[]): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (skills.length > BUSINESS_RULES.MAX_SKILL_ENTRIES) {
      errors.push({ 
        field: 'skills', 
        message: `Maximum ${BUSINESS_RULES.MAX_SKILL_ENTRIES} skill entries allowed` 
      });
    }

    skills.forEach((skill, index) => {
      if (!skill.skill_name || skill.skill_name.trim().length === 0) {
        errors.push({ field: `skills[${index}].skill_name`, message: 'Skill name is required' });
      } else {
        const trimmedName = skill.skill_name.trim();
        if (trimmedName.length < VALIDATION_RULES.SKILL_NAME.MIN_LENGTH) {
          errors.push({ 
            field: `skills[${index}].skill_name`, 
            message: `Skill name must be at least ${VALIDATION_RULES.SKILL_NAME.MIN_LENGTH} characters long` 
          });
        }
        if (trimmedName.length > VALIDATION_RULES.SKILL_NAME.MAX_LENGTH) {
          errors.push({ 
            field: `skills[${index}].skill_name`, 
            message: `Skill name must not exceed ${VALIDATION_RULES.SKILL_NAME.MAX_LENGTH} characters` 
          });
        }
      }

      if (skill.proficiency_percentage < 0 || skill.proficiency_percentage > 100) {
        errors.push({ field: `skills[${index}].proficiency_percentage`, message: 'Proficiency percentage must be between 0 and 100' });
      }

      if (!['technical', 'interpersonal', 'language'].includes(skill.category)) {
        errors.push({ field: `skills[${index}].category`, message: 'Category must be technical, interpersonal, or language' });
      }
    });

    return errors;
  }

  static validateSocialProfiles(socialProfiles: SocialProfile[]): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (socialProfiles.length > BUSINESS_RULES.MAX_SOCIAL_PROFILE_ENTRIES) {
      errors.push({ 
        field: 'social_profiles', 
        message: `Maximum ${BUSINESS_RULES.MAX_SOCIAL_PROFILE_ENTRIES} social profile entries allowed` 
      });
    }

    socialProfiles.forEach((profile, index) => {
      if (!profile.platform_name || profile.platform_name.trim().length === 0) {
        errors.push({ field: `social_profiles[${index}].platform_name`, message: 'Platform name is required' });
      }

      if (!profile.profile_url || profile.profile_url.trim().length === 0) {
        errors.push({ field: `social_profiles[${index}].profile_url`, message: 'Profile URL is required' });
      } else {
        try {
          new URL(profile.profile_url);
        } catch {
          errors.push({ field: `social_profiles[${index}].profile_url`, message: 'Please provide a valid URL' });
        }
      }
    });

    return errors;
  }

  static canUserCreateMoreCVs(user: User, currentCVCount: number): { allowed: boolean; reason?: string } {
    // Premium users can create unlimited CVs
    if (user.role === USER_ROLES.PREMIUM) {
      return { allowed: true };
    }

    // Regular users have a limit
    if (currentCVCount >= BUSINESS_RULES.MAX_CVS_PER_USER) {
      return { 
        allowed: false, 
        reason: `Maximum ${BUSINESS_RULES.MAX_CVS_PER_USER} CVs allowed for regular users. Upgrade to premium for unlimited CVs.` 
      };
    }

    return { allowed: true };
  }

  static canUserDownloadMore(user: User, downloadsThisMonth: number): { allowed: boolean; reason?: string } {
    const limit = user.role === USER_ROLES.PREMIUM 
      ? BUSINESS_RULES.PREMIUM_DOWNLOADS_PER_MONTH 
      : BUSINESS_RULES.FREE_DOWNLOADS_PER_MONTH;

    if (downloadsThisMonth >= limit) {
      const upgradeMessage = user.role === USER_ROLES.USER 
        ? ' Upgrade to premium for more downloads.' 
        : '';
      return { 
        allowed: false, 
        reason: `Monthly download limit reached (${limit}).${upgradeMessage}` 
      };
    }

    return { allowed: true };
  }

  static canUserShareMore(user: User, sharesThisMonth: number): { allowed: boolean; reason?: string } {
    const limit = user.role === USER_ROLES.PREMIUM 
      ? BUSINESS_RULES.PREMIUM_SHARES_PER_MONTH 
      : BUSINESS_RULES.FREE_SHARES_PER_MONTH;

    if (sharesThisMonth >= limit) {
      const upgradeMessage = user.role === USER_ROLES.USER 
        ? ' Upgrade to premium for more shares.' 
        : '';
      return { 
        allowed: false, 
        reason: `Monthly share limit reached (${limit}).${upgradeMessage}` 
      };
    }

    return { allowed: true };
  }
}

// General Business Rules
export class BusinessRules {
  static isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  static isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  static shouldRequireEmailVerification(): boolean {
    // In production, always require email verification
    // In development, make it optional for testing
    return this.isProduction();
  }

  static getMaxFileSize(): number {
    return parseInt(process.env.MAX_FILE_SIZE || '5242880', 10); // 5MB default
  }

  static getAllowedFileTypes(): string[] {
    return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  }

  static getRateLimitConfig() {
    return {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      skipSuccessfulRequests: false,
    };
  }
}
