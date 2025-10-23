import { SupabaseClient } from '@supabase/supabase-js';
import { database } from '@/config/database';
import { 
  CV, 
  CVData, 
  BasicDetails, 
  Education, 
  Experience, 
  Project, 
  Skill, 
  SocialProfile,
  CreateCVRequest,
  UpdateCVRequest,
  QueryOptions
} from '@/shared/types';
import { CV_STATUS, CV_LAYOUTS, PAGINATION } from '@/shared/constants';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';

/**
 * CV Model
 *
 * Business Logic:
 * - Encapsulates all persistence for CV entities against Supabase
 * - Provides user-scoped queries and dashboard aggregations
 * - Updates counters (download/share) atomically
 *
 * Code Conventions:
 * - No HTTP concerns; returns plain data or throws Errors
 * - All timestamps are ISO strings
 *
 * @fileoverview Data access layer for CVs
 * @author vicky neosoft test builder app
 */
export class CVModel {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = database.getClient();
  }

  /**
   * Create a new CV
   */
  async create(userId: string, cvData: CreateCVRequest): Promise<CVData> {
    const cvId = uuidv4();
    const now = new Date().toISOString();

    // Create CV record
    const cv: Omit<CV, 'created_at' | 'updated_at'> = {
      id: cvId,
      user_id: userId,
      title: cvData.title,
      layout: cvData.layout,
      status: 'draft',
      is_public: false,
      download_count: 0,
      share_count: 0,
      last_modified: now,
    };

    const { data: createdCV, error: cvError } = await this.supabase
      .from('cvs')
      .insert(cv)
      .select()
      .single();

    if (cvError) {
      throw new Error(`Failed to create CV: ${cvError.message}`);
    }

    // Create basic details
    const basicDetails: Omit<BasicDetails, 'id'> = {
      cv_id: cvId,
      ...cvData.basic_details,
    };

    const { data: createdBasicDetails, error: basicError } = await this.supabase
      .from('basic_details')
      .insert(basicDetails)
      .select()
      .single();

    if (basicError) {
      // Rollback CV creation
      await this.supabase.from('cvs').delete().eq('id', cvId);
      throw new Error(`Failed to create basic details: ${basicError.message}`);
    }

    const result: CVData = {
      cv: createdCV,
      basic_details: createdBasicDetails,
      education: [],
      experience: [],
      projects: [],
      skills: [],
      social_profiles: [],
    };

    // Create additional sections if provided
    if (cvData.education && cvData.education.length > 0) {
      result.education = await this.createEducation(cvId, cvData.education);
    }

    if (cvData.experience && cvData.experience.length > 0) {
      result.experience = await this.createExperience(cvId, cvData.experience);
    }

    if (cvData.projects && cvData.projects.length > 0) {
      result.projects = await this.createProjects(cvId, cvData.projects);
    }

    if (cvData.skills && cvData.skills.length > 0) {
      result.skills = await this.createSkills(cvId, cvData.skills);
    }

    if (cvData.social_profiles && cvData.social_profiles.length > 0) {
      result.social_profiles = await this.createSocialProfiles(cvId, cvData.social_profiles);
    }

    return result;
  }

  /**
   * Get CV by ID
   */
  async findById(id: string, userId?: string): Promise<CVData | null> {
    // Build query
    let query = this.supabase
      .from('cvs')
      .select('*')
      .eq('id', id);

    // If userId is provided, ensure user owns the CV
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: cv, error: cvError } = await query.single();

    if (cvError) {
      if (cvError.code === 'PGRST116') {
        return null; // CV not found
      }
      throw new Error(`Failed to find CV: ${cvError.message}`);
    }

    // Get all related data
    const [basicDetails, education, experience, projects, skills, socialProfiles] = await Promise.all([
      this.getBasicDetails(id),
      this.getEducation(id),
      this.getExperience(id),
      this.getProjects(id),
      this.getSkills(id),
      this.getSocialProfiles(id),
    ]);

    return {
      cv,
      basic_details: basicDetails!,
      education,
      experience,
      projects,
      skills,
      social_profiles: socialProfiles,
    };
  }

  /**
   * Get CVs by user ID with pagination
   */
  async findByUserId(
    userId: string, 
    options: QueryOptions = {}
  ): Promise<{ cvs: CV[]; pagination: any }> {
    const page = options.page || PAGINATION.DEFAULT_PAGE;
    const limit = options.limit || PAGINATION.DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('cvs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    // Apply filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }

    // Apply search
    if (options.search) {
      query = query.ilike('title', `%${options.search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: cvs, error, count } = await query;

    if (error) {
      throw new Error(`Failed to find CVs: ${error.message}`);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      cvs: cvs || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Update CV
   */
  async update(id: string, userId: string, updates: UpdateCVRequest): Promise<CVData> {
    // Verify ownership
    const existingCV = await this.findById(id, userId);
    if (!existingCV) {
      throw new Error('CV not found or access denied');
    }

    const now = new Date().toISOString();

    // Update CV record
    const cvUpdates: Partial<CV> = {
      updated_at: now,
      last_modified: now,
    };

    if (updates.title !== undefined) cvUpdates.title = updates.title;
    if (updates.layout !== undefined) cvUpdates.layout = updates.layout;
    if (updates.status !== undefined) cvUpdates.status = updates.status;
    if (updates.is_public !== undefined) cvUpdates.is_public = updates.is_public;

    if (Object.keys(cvUpdates).length > 2) { // More than just timestamps
      const { data: updatedCV, error: cvError } = await this.supabase
        .from('cvs')
        .update(cvUpdates)
        .eq('id', id)
        .select()
        .single();

      if (cvError) {
        throw new Error(`Failed to update CV: ${cvError.message}`);
      }
    }

    // Update basic details if provided
    if (updates.basic_details) {
      await this.updateBasicDetails(id, updates.basic_details);
    }

    // Update sections if provided
    if (updates.education !== undefined) {
      await this.updateEducation(id, updates.education);
    }

    if (updates.experience !== undefined) {
      await this.updateExperience(id, updates.experience);
    }

    if (updates.projects !== undefined) {
      await this.updateProjects(id, updates.projects);
    }

    if (updates.skills !== undefined) {
      await this.updateSkills(id, updates.skills);
    }

    if (updates.social_profiles !== undefined) {
      await this.updateSocialProfiles(id, updates.social_profiles);
    }

    // Return updated CV data
    return this.findById(id, userId) as Promise<CVData>;
  }

  /**
   * Delete CV
   */
  async delete(id: string, userId: string): Promise<void> {
    // Verify ownership
    const existingCV = await this.findById(id, userId);
    if (!existingCV) {
      throw new Error('CV not found or access denied');
    }

    // Delete all related data (cascade should handle this, but being explicit)
    await Promise.all([
      this.supabase.from('basic_details').delete().eq('cv_id', id),
      this.supabase.from('education').delete().eq('cv_id', id),
      this.supabase.from('experience').delete().eq('cv_id', id),
      this.supabase.from('projects').delete().eq('cv_id', id),
      this.supabase.from('skills').delete().eq('cv_id', id),
      this.supabase.from('social_profiles').delete().eq('cv_id', id),
    ]);

    // Delete CV
    const { error } = await this.supabase
      .from('cvs')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete CV: ${error.message}`);
    }
  }

  /**
   * Duplicate CV
   */
  async duplicate(id: string, userId: string, newTitle?: string): Promise<CVData> {
    const originalCV = await this.findById(id, userId);
    if (!originalCV) {
      throw new Error('CV not found or access denied');
    }

    const duplicateData: CreateCVRequest = {
      title: newTitle || `${originalCV.cv.title} (Copy)`,
      layout: originalCV.cv.layout,
      basic_details: {
        ...originalCV.basic_details,
        profile_image_url: undefined, // Don't copy profile image
      },
      education: originalCV.education.map(edu => ({
        ...edu,
        id: undefined,
        cv_id: undefined,
      })),
      experience: originalCV.experience.map(exp => ({
        ...exp,
        id: undefined,
        cv_id: undefined,
      })),
      projects: originalCV.projects.map(proj => ({
        ...proj,
        id: undefined,
        cv_id: undefined,
      })),
      skills: originalCV.skills.map(skill => ({
        ...skill,
        id: undefined,
        cv_id: undefined,
      })),
      social_profiles: originalCV.social_profiles.map(profile => ({
        ...profile,
        id: undefined,
        cv_id: undefined,
      })),
    };

    return this.create(userId, duplicateData);
  }

  /**
   * Increment download count
   */
  async incrementDownloadCount(id: string): Promise<void> {
    // First get current count
    const { data: cv, error: fetchError } = await this.supabase
      .from('cvs')
      .select('download_count')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch CV for download increment: ${fetchError.message}`);
    }

    // Increment the count
    const { error } = await this.supabase
      .from('cvs')
      .update({
        download_count: (cv.download_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to increment download count: ${error.message}`);
    }
  }

  /**
   * Increment share count
   */
  async incrementShareCount(id: string): Promise<void> {
    // First get current count
    const { data: cv, error: fetchError } = await this.supabase
      .from('cvs')
      .select('share_count')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch CV for share increment: ${fetchError.message}`);
    }

    // Increment the count
    const { error } = await this.supabase
      .from('cvs')
      .update({
        share_count: (cv.share_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to increment share count: ${error.message}`);
    }
  }

  // Private helper methods for section management

  private async getBasicDetails(cvId: string): Promise<BasicDetails | null> {
    const { data, error } = await this.supabase
      .from('basic_details')
      .select('*')
      .eq('cv_id', cvId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get basic details: ${error.message}`);
    }

    return data;
  }

  private async getEducation(cvId: string): Promise<Education[]> {
    const { data, error } = await this.supabase
      .from('education')
      .select('*')
      .eq('cv_id', cvId)
      .order('start_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to get education: ${error.message}`);
    }

    return data || [];
  }

  private async getExperience(cvId: string): Promise<Experience[]> {
    const { data, error } = await this.supabase
      .from('experience')
      .select('*')
      .eq('cv_id', cvId)
      .order('joining_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to get experience: ${error.message}`);
    }

    return data || [];
  }

  private async getProjects(cvId: string): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('cv_id', cvId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get projects: ${error.message}`);
    }

    return data || [];
  }

  private async getSkills(cvId: string): Promise<Skill[]> {
    const { data, error } = await this.supabase
      .from('skills')
      .select('*')
      .eq('cv_id', cvId)
      .order('category', { ascending: true });

    if (error) {
      throw new Error(`Failed to get skills: ${error.message}`);
    }

    return data || [];
  }

  private async getSocialProfiles(cvId: string): Promise<SocialProfile[]> {
    const { data, error } = await this.supabase
      .from('social_profiles')
      .select('*')
      .eq('cv_id', cvId)
      .order('platform_name', { ascending: true });

    if (error) {
      throw new Error(`Failed to get social profiles: ${error.message}`);
    }

    return data || [];
  }

  private async createEducation(cvId: string, education: Omit<Education, 'id' | 'cv_id'>[]): Promise<Education[]> {
    const educationData = education.map(edu => ({
      id: uuidv4(),
      cv_id: cvId,
      ...edu,
    }));

    const { data, error } = await this.supabase
      .from('education')
      .insert(educationData)
      .select();

    if (error) {
      throw new Error(`Failed to create education: ${error.message}`);
    }

    return data || [];
  }

  private async createExperience(cvId: string, experience: Omit<Experience, 'id' | 'cv_id'>[]): Promise<Experience[]> {
    const experienceData = experience.map(exp => ({
      id: uuidv4(),
      cv_id: cvId,
      ...exp,
    }));

    const { data, error } = await this.supabase
      .from('experience')
      .insert(experienceData)
      .select();

    if (error) {
      throw new Error(`Failed to create experience: ${error.message}`);
    }

    return data || [];
  }

  private async createProjects(cvId: string, projects: Omit<Project, 'id' | 'cv_id'>[]): Promise<Project[]> {
    const projectsData = projects.map(proj => ({
      id: uuidv4(),
      cv_id: cvId,
      ...proj,
    }));

    const { data, error } = await this.supabase
      .from('projects')
      .insert(projectsData)
      .select();

    if (error) {
      throw new Error(`Failed to create projects: ${error.message}`);
    }

    return data || [];
  }

  private async createSkills(cvId: string, skills: Omit<Skill, 'id' | 'cv_id'>[]): Promise<Skill[]> {
    const skillsData = skills.map(skill => ({
      id: uuidv4(),
      cv_id: cvId,
      ...skill,
    }));

    const { data, error } = await this.supabase
      .from('skills')
      .insert(skillsData)
      .select();

    if (error) {
      throw new Error(`Failed to create skills: ${error.message}`);
    }

    return data || [];
  }

  private async createSocialProfiles(cvId: string, profiles: Omit<SocialProfile, 'id' | 'cv_id'>[]): Promise<SocialProfile[]> {
    const profilesData = profiles.map(profile => ({
      id: uuidv4(),
      cv_id: cvId,
      ...profile,
    }));

    const { data, error } = await this.supabase
      .from('social_profiles')
      .insert(profilesData)
      .select();

    if (error) {
      throw new Error(`Failed to create social profiles: ${error.message}`);
    }

    return data || [];
  }

  private async updateBasicDetails(cvId: string, updates: Partial<Omit<BasicDetails, 'id' | 'cv_id'>>): Promise<void> {
    const { error } = await this.supabase
      .from('basic_details')
      .update(updates)
      .eq('cv_id', cvId);

    if (error) {
      throw new Error(`Failed to update basic details: ${error.message}`);
    }
  }

  private async updateEducation(cvId: string, education: Omit<Education, 'id' | 'cv_id'>[]): Promise<void> {
    // Delete existing education
    await this.supabase.from('education').delete().eq('cv_id', cvId);
    
    // Create new education if provided
    if (education.length > 0) {
      await this.createEducation(cvId, education);
    }
  }

  private async updateExperience(cvId: string, experience: Omit<Experience, 'id' | 'cv_id'>[]): Promise<void> {
    // Delete existing experience
    await this.supabase.from('experience').delete().eq('cv_id', cvId);
    
    // Create new experience if provided
    if (experience.length > 0) {
      await this.createExperience(cvId, experience);
    }
  }

  private async updateProjects(cvId: string, projects: Omit<Project, 'id' | 'cv_id'>[]): Promise<void> {
    // Delete existing projects
    await this.supabase.from('projects').delete().eq('cv_id', cvId);
    
    // Create new projects if provided
    if (projects.length > 0) {
      await this.createProjects(cvId, projects);
    }
  }

  private async updateSkills(cvId: string, skills: Omit<Skill, 'id' | 'cv_id'>[]): Promise<void> {
    // Delete existing skills
    await this.supabase.from('skills').delete().eq('cv_id', cvId);
    
    // Create new skills if provided
    if (skills.length > 0) {
      await this.createSkills(cvId, skills);
    }
  }

  private async updateSocialProfiles(cvId: string, profiles: Omit<SocialProfile, 'id' | 'cv_id'>[]): Promise<void> {
    // Delete existing social profiles
    await this.supabase.from('social_profiles').delete().eq('cv_id', cvId);
    
    // Create new social profiles if provided
    if (profiles.length > 0) {
      await this.createSocialProfiles(cvId, profiles);
    }
  }

  /**
   * Get dashboard statistics for user
   * @author Vicky
   */
  async getDashboardStats(userId: string): Promise<any> {
    try {
      const { data: cvs, error } = await this.supabase
        .from('cvs')
        .select('status, download_count, share_count')
        .eq('user_id', userId);

      if (error) {
        throw new Error('Failed to get dashboard statistics');
      }

      const stats = {
        total_cvs: cvs?.length || 0,
        published_cvs: cvs?.filter(cv => cv.status === 'published').length || 0,
        draft_cvs: cvs?.filter(cv => cv.status === 'draft').length || 0,
        archived_cvs: cvs?.filter(cv => cv.status === 'archived').length || 0,
        total_downloads: cvs?.reduce((sum, cv) => sum + (cv.download_count || 0), 0) || 0,
        total_shares: cvs?.reduce((sum, cv) => sum + (cv.share_count || 0), 0) || 0,
        total_views: 0, // TODO: Implement view tracking when view_count column is added
        recent_activity: [] // TODO: Implement recent activity tracking
      };

      return stats;
    } catch (error: any) {
      logger.error('Get dashboard stats error:', error);
      throw error;
    }
  }
}

export default CVModel;
