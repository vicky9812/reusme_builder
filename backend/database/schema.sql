-- CV Builder Database Schema for Supabase (PostgreSQL)
-- This file contains all the database tables and relationships

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    contact_number VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'premium')),
    is_verified BOOLEAN DEFAULT FALSE,
    profile_image_url TEXT,
    oauth_provider VARCHAR(20) CHECK (oauth_provider IN ('google', 'facebook')),
    oauth_id VARCHAR(255),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CVs table
CREATE TABLE cvs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    layout VARCHAR(20) NOT NULL CHECK (layout IN ('modern', 'classic', 'creative')),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_public BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic Details table
CREATE TABLE basic_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    profile_image_url TEXT,
    full_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    pincode VARCHAR(10),
    introduction TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Education table
CREATE TABLE education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    degree_name VARCHAR(100) NOT NULL,
    institution VARCHAR(100) NOT NULL,
    percentage DECIMAL(5,2) CHECK (percentage >= 0 AND percentage <= 100),
    cgpa DECIMAL(3,2) CHECK (cgpa >= 0 AND cgpa <= 10),
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Experience table
CREATE TABLE experience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    organization_name VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    joining_location VARCHAR(100),
    ctc VARCHAR(50),
    joining_date DATE NOT NULL,
    leaving_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    technologies TEXT[], -- Array of technologies
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    team_size INTEGER CHECK (team_size > 0),
    duration VARCHAR(50),
    technologies TEXT[], -- Array of technologies
    description TEXT,
    project_url TEXT,
    github_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Skills table
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    skill_name VARCHAR(50) NOT NULL,
    proficiency_percentage INTEGER NOT NULL CHECK (proficiency_percentage >= 0 AND proficiency_percentage <= 100),
    category VARCHAR(20) NOT NULL CHECK (category IN ('technical', 'interpersonal', 'language')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social Profiles table
CREATE TABLE social_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    platform_name VARCHAR(50) NOT NULL,
    profile_url TEXT NOT NULL,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CV Downloads tracking table
CREATE TABLE cv_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    download_type VARCHAR(20) DEFAULT 'pdf' CHECK (download_type IN ('pdf', 'docx')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CV Shares tracking table
CREATE TABLE cv_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cv_id UUID NOT NULL REFERENCES cvs(id) ON DELETE CASCADE,
    share_platform VARCHAR(20) NOT NULL CHECK (share_platform IN ('email', 'linkedin', 'twitter', 'facebook', 'whatsapp')),
    recipient_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email verification tokens table
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password reset tokens table
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment transactions table (for future implementation)
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cv_id UUID REFERENCES cvs(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    payment_method VARCHAR(20) NOT NULL,
    transaction_id VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('download', 'share', 'premium_upgrade')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);
CREATE INDEX idx_cvs_user_id ON cvs(user_id);
CREATE INDEX idx_cvs_status ON cvs(status);
CREATE INDEX idx_cvs_public ON cvs(is_public);
CREATE INDEX idx_basic_details_cv_id ON basic_details(cv_id);
CREATE INDEX idx_education_cv_id ON education(cv_id);
CREATE INDEX idx_experience_cv_id ON experience(cv_id);
CREATE INDEX idx_projects_cv_id ON projects(cv_id);
CREATE INDEX idx_skills_cv_id ON skills(cv_id);
CREATE INDEX idx_social_profiles_cv_id ON social_profiles(cv_id);
CREATE INDEX idx_cv_downloads_user_id ON cv_downloads(user_id);
CREATE INDEX idx_cv_downloads_cv_id ON cv_downloads(cv_id);
CREATE INDEX idx_cv_downloads_created_at ON cv_downloads(created_at);
CREATE INDEX idx_cv_shares_user_id ON cv_shares(user_id);
CREATE INDEX idx_cv_shares_cv_id ON cv_shares(cv_id);
CREATE INDEX idx_cv_shares_created_at ON cv_shares(created_at);
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_cv_id ON payment_transactions(cv_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cvs_updated_at BEFORE UPDATE ON cvs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_basic_details_updated_at BEFORE UPDATE ON basic_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_education_updated_at BEFORE UPDATE ON education FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_experience_updated_at BEFORE UPDATE ON experience FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_social_profiles_updated_at BEFORE UPDATE ON social_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
ALTER TABLE basic_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public can view user profiles for public CVs" ON users FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM cvs 
        WHERE cvs.user_id = users.id 
        AND cvs.is_public = true 
        AND cvs.status = 'published'
    )
);

-- CVs policies
CREATE POLICY "Users can view their own CVs" ON cvs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own CVs" ON cvs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own CVs" ON cvs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own CVs" ON cvs FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Public can view published public CVs" ON cvs FOR SELECT USING (is_public = true AND status = 'published');

-- Basic details policies
CREATE POLICY "Users can view basic details of their CVs" ON basic_details FOR SELECT USING (
    EXISTS (SELECT 1 FROM cvs WHERE cvs.id = basic_details.cv_id AND cvs.user_id = auth.uid())
);
CREATE POLICY "Users can create basic details for their CVs" ON basic_details FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM cvs WHERE cvs.id = basic_details.cv_id AND cvs.user_id = auth.uid())
);
CREATE POLICY "Users can update basic details of their CVs" ON basic_details FOR UPDATE USING (
    EXISTS (SELECT 1 FROM cvs WHERE cvs.id = basic_details.cv_id AND cvs.user_id = auth.uid())
);
CREATE POLICY "Users can delete basic details of their CVs" ON basic_details FOR DELETE USING (
    EXISTS (SELECT 1 FROM cvs WHERE cvs.id = basic_details.cv_id AND cvs.user_id = auth.uid())
);
CREATE POLICY "Public can view basic details of public CVs" ON basic_details FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM cvs 
        WHERE cvs.id = basic_details.cv_id 
        AND cvs.is_public = true 
        AND cvs.status = 'published'
    )
);

-- Similar policies for other tables (education, experience, projects, skills, social_profiles)
-- Education policies
CREATE POLICY "Users can manage education of their CVs" ON education FOR ALL USING (
    EXISTS (SELECT 1 FROM cvs WHERE cvs.id = education.cv_id AND cvs.user_id = auth.uid())
);
CREATE POLICY "Public can view education of public CVs" ON education FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM cvs 
        WHERE cvs.id = education.cv_id 
        AND cvs.is_public = true 
        AND cvs.status = 'published'
    )
);

-- Experience policies
CREATE POLICY "Users can manage experience of their CVs" ON experience FOR ALL USING (
    EXISTS (SELECT 1 FROM cvs WHERE cvs.id = experience.cv_id AND cvs.user_id = auth.uid())
);
CREATE POLICY "Public can view experience of public CVs" ON experience FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM cvs 
        WHERE cvs.id = experience.cv_id 
        AND cvs.is_public = true 
        AND cvs.status = 'published'
    )
);

-- Projects policies
CREATE POLICY "Users can manage projects of their CVs" ON projects FOR ALL USING (
    EXISTS (SELECT 1 FROM cvs WHERE cvs.id = projects.cv_id AND cvs.user_id = auth.uid())
);
CREATE POLICY "Public can view projects of public CVs" ON projects FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM cvs 
        WHERE cvs.id = projects.cv_id 
        AND cvs.is_public = true 
        AND cvs.status = 'published'
    )
);

-- Skills policies
CREATE POLICY "Users can manage skills of their CVs" ON skills FOR ALL USING (
    EXISTS (SELECT 1 FROM cvs WHERE cvs.id = skills.cv_id AND cvs.user_id = auth.uid())
);
CREATE POLICY "Public can view skills of public CVs" ON skills FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM cvs 
        WHERE cvs.id = skills.cv_id 
        AND cvs.is_public = true 
        AND cvs.status = 'published'
    )
);

-- Social profiles policies
CREATE POLICY "Users can manage social profiles of their CVs" ON social_profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM cvs WHERE cvs.id = social_profiles.cv_id AND cvs.user_id = auth.uid())
);
CREATE POLICY "Public can view social profiles of public CVs" ON social_profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM cvs 
        WHERE cvs.id = social_profiles.cv_id 
        AND cvs.is_public = true 
        AND cvs.status = 'published'
    )
);

-- CV downloads policies
CREATE POLICY "Users can view their own download history" ON cv_downloads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own download records" ON cv_downloads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CV shares policies
CREATE POLICY "Users can view their own share history" ON cv_shares FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own share records" ON cv_shares FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Token policies
CREATE POLICY "Users can manage their own verification tokens" ON email_verification_tokens FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own password reset tokens" ON password_reset_tokens FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own refresh tokens" ON refresh_tokens FOR ALL USING (auth.uid() = user_id);

-- Payment transactions policies
CREATE POLICY "Users can view their own payment transactions" ON payment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own payment transactions" ON payment_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create a function to get user's CV count
CREATE OR REPLACE FUNCTION get_user_cv_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM cvs WHERE user_id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user's monthly download count
CREATE OR REPLACE FUNCTION get_user_monthly_downloads(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM cv_downloads 
        WHERE user_id = user_uuid 
        AND created_at >= date_trunc('month', CURRENT_DATE)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user's monthly share count
CREATE OR REPLACE FUNCTION get_user_monthly_shares(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM cv_shares 
        WHERE user_id = user_uuid 
        AND created_at >= date_trunc('month', CURRENT_DATE)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
