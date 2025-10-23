import { SupabaseClient } from '@supabase/supabase-js';
import { database } from '@/config/database';
import { User, RegisterRequest, LoginRequest } from '@/shared/types';
import { USER_ROLES } from '@/shared/constants';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export class UserModel {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = database.getClient();
  }

  /**
   * Create a new user
   */
  async create(userData: RegisterRequest): Promise<User> {
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const user: Omit<User, 'created_at' | 'updated_at'> = {
      id: userId,
      username: userData.username,
      email: userData.email,
      password_hash: hashedPassword,
      contact_number: userData.contact_number,
      role: USER_ROLES.USER,
      is_verified: true, // Set to true for development - bypass email verification
      is_active: true,
    };

    const { data, error } = await this.supabase
      .from('users')
      .insert(user)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new Error(`Failed to find user by email: ${error.message}`);
    }

    return data;
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new Error(`Failed to find user by username: ${error.message}`);
    }

    return data;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }

    return data;
  }

  /**
   * Find user by email or username
   */
  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .or(`email.eq.${identifier},username.eq.${identifier}`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new Error(`Failed to find user: ${error.message}`);
    }

    return data;
  }

  /**
   * Verify user password
   */
  async verifyPassword(user: User, password: string): Promise<boolean> {
    if (!user.password_hash) {
      return false;
    }
    return bcrypt.compare(password, user.password_hash);
  }

  /**
   * Update user
   */
  async update(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data;
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const { error } = await this.supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update password: ${error.message}`);
    }
  }

  /**
   * Verify user email
   */
  async verifyEmail(id: string): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update({
        is_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to verify email: ${error.message}`);
    }

    return data;
  }

  /**
   * Update last login
   */
  async updateLastLogin(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update({
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update last login: ${error.message}`);
    }
  }

  /**
   * Deactivate user
   */
  async deactivate(id: string): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to deactivate user: ${error.message}`);
    }

    return data;
  }

  /**
   * Activate user
   */
  async activate(id: string): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to activate user: ${error.message}`);
    }

    return data;
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check email existence: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check username existence: ${error.message}`);
    }

    return !!data;
  }

  /**
   * Create OAuth user
   */
  async createOAuthUser(oauthData: {
    email: string;
    name: string;
    picture?: string;
    provider: string;
    oauthId: string;
  }): Promise<User> {
    const userId = uuidv4();
    const username = this.generateUsernameFromEmail(oauthData.email);
    
    const user: Omit<User, 'created_at' | 'updated_at'> = {
      id: userId,
      username,
      email: oauthData.email,
      role: USER_ROLES.USER,
      is_verified: true, // OAuth users are pre-verified
      is_active: true,
      profile_image_url: oauthData.picture,
      oauth_provider: oauthData.provider as any,
      oauth_id: oauthData.oauthId,
    };

    const { data, error } = await this.supabase
      .from('users')
      .insert(user)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create OAuth user: ${error.message}`);
    }

    return data;
  }

  /**
   * Find OAuth user
   */
  async findOAuthUser(provider: string, oauthId: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('oauth_provider', provider)
      .eq('oauth_id', oauthId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new Error(`Failed to find OAuth user: ${error.message}`);
    }

    return data;
  }

  /**
   * Generate username from email
   */
  private generateUsernameFromEmail(email: string): string {
    const baseUsername = email.split('@')[0];
    const timestamp = Date.now();
    return `${baseUsername}_${timestamp}`;
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<{
    totalCVs: number;
    publishedCVs: number;
    downloadsThisMonth: number;
    sharesThisMonth: number;
  }> {
    // Get CV count
    const { data: cvs, error: cvError } = await this.supabase
      .from('cvs')
      .select('id, status')
      .eq('user_id', userId);

    if (cvError) {
      throw new Error(`Failed to get CV stats: ${cvError.message}`);
    }

    const totalCVs = cvs?.length || 0;
    const publishedCVs = cvs?.filter(cv => cv.status === 'published').length || 0;

    // Get download and share stats for current month
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const { data: downloads, error: downloadError } = await this.supabase
      .from('cv_downloads')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', currentMonth.toISOString());

    if (downloadError) {
      throw new Error(`Failed to get download stats: ${downloadError.message}`);
    }

    const { data: shares, error: shareError } = await this.supabase
      .from('cv_shares')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', currentMonth.toISOString());

    if (shareError) {
      throw new Error(`Failed to get share stats: ${shareError.message}`);
    }

    return {
      totalCVs,
      publishedCVs,
      downloadsThisMonth: downloads?.length || 0,
      sharesThisMonth: shares?.length || 0,
    };
  }
}

export default UserModel;
