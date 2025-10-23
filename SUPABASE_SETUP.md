# Supabase Database Setup Guide

## Your Supabase Project Details
- **Project ID**: `nrmqynkgghddclbnsiet`
- **Project Name**: `chrome-extension`
- **URL**: `https://nrmqynkgghddclbnsiet.supabase.co`

## Quick Setup Steps

### 1. Set up Environment Variables
```bash
# Run this command to create your .env file
npm run setup
```

### 2. Set up Database Schema

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/nrmqynkgghddclbnsiet
2. Navigate to **SQL Editor** in the left sidebar
3. Create a new query and paste the entire contents of `database/schema.sql`
4. Click **Run** to execute the schema

### 3. Test Database Connection
```bash
# Test if your database is properly configured
npm run test:db
```

### 4. Start Development Server
```bash
# Start the backend server
npm run dev
```

## Database Schema Overview

The schema creates the following tables:

### Core Tables
- **users** - User accounts and authentication
- **cvs** - CV documents
- **basic_details** - Personal information
- **education** - Educational background
- **experience** - Work experience
- **projects** - Project portfolio
- **skills** - Technical and soft skills
- **social_profiles** - Social media links

### Tracking Tables
- **cv_downloads** - Download tracking
- **cv_shares** - Share tracking
- **email_verification_tokens** - Email verification
- **password_reset_tokens** - Password reset
- **refresh_tokens** - JWT refresh tokens
- **payment_transactions** - Payment tracking (future)

## Row Level Security (RLS)

The schema includes comprehensive RLS policies that ensure:
- Users can only access their own data
- Public CVs can be viewed by anyone
- Proper authentication is required for sensitive operations

## API Endpoints

Once set up, your API will be available at:
- **Base URL**: `http://localhost:3000/api`
- **Health Check**: `http://localhost:3000/health`

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile

### CV Management Endpoints
- `POST /api/cv` - Create new CV
- `GET /api/cv` - Get user's CVs
- `GET /api/cv/:id` - Get CV by ID
- `PUT /api/cv/:id` - Update CV
- `DELETE /api/cv/:id` - Delete CV

## Testing the Setup

### 1. Test Database Connection
```bash
npm run test:db
```

### 2. Test API Endpoints
```bash
# Start the server
npm run dev

# In another terminal, test the health endpoint
curl http://localhost:3000/health

# Test user registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify your Supabase URL and keys are correct
   - Check if the database schema has been applied
   - Ensure your Supabase project is active

2. **Tables Not Found**
   - Run the SQL schema from `database/schema.sql`
   - Check the Supabase SQL Editor for any errors
   - Verify RLS policies are enabled

3. **Authentication Errors**
   - Check JWT secrets in your .env file
   - Ensure proper CORS configuration
   - Verify request headers and body format

### Getting Help

If you encounter issues:
1. Check the console output for error messages
2. Verify your Supabase project settings
3. Ensure all environment variables are set correctly
4. Check the Supabase logs in your dashboard

## Next Steps

After successful setup:
1. Implement OAuth providers (Google, Facebook)
2. Add email verification functionality
3. Implement PDF generation for CV downloads
4. Add payment integration for premium features
5. Deploy to production environment
