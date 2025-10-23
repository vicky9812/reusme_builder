/**
 * Login Page Component
 * 
 * This component provides the user login functionality for the CV Builder application.
 * It includes form validation, error handling, and integration with the authentication
 * service to allow users to log into their accounts.
 * 
 * Business Logic:
 * - Provides secure user authentication form
 * - Validates user input (email/username and password)
 * - Integrates with backend authentication API
 * - Handles login success and error states
 * - Redirects authenticated users to dashboard
 * - Provides navigation to registration page
 * - Manages form state and validation
 * - Displays loading states during authentication
 * - Shows user-friendly error messages
 * - Implements responsive design for all devices
 * 
 * @fileoverview Login page component for CV Builder frontend
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-17
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

/**
 * Login Form Data Interface
 * 
 * Business Logic:
 * - Defines the structure of login form data
 * - Ensures type safety for form inputs
 * - Validates required fields for authentication
 * 
 * @interface LoginFormData
 * @author Vicky
 */
interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

/**
 * Login Page Component
 * 
 * Business Logic:
 * - Renders the complete login form with validation
 * - Handles user authentication process
 * - Manages form state and user interactions
 * - Provides visual feedback and error handling
 * - Integrates with authentication context
 * 
 * @returns {JSX.Element} Login page component
 * @author Vicky
 */
const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  /**
   * Handle Login Form Submission
   * 
   * Business Logic:
   * - Validates form data before submission
   * - Calls authentication API with user credentials
   * - Handles successful login and token storage
   * - Manages error states and user feedback
   * - Redirects to dashboard on successful login
   * - Implements loading states during authentication
   * 
   * @param {LoginFormData} data - Form data containing login credentials
   * @returns {Promise<void>} Promise that resolves when login is complete
   * @author Vicky
   */
  const onSubmit = async (data: LoginFormData): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Call the authentication API
      const response = await apiService.login({
        email: data.email,
        password: data.password,
      });

      // Store authentication data
      if (response.access_token) {
        localStorage.setItem('access_token', response.access_token);
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        }
      }

      // Update auth context
      await login({
        email: data.email,
        password: data.password,
      });

      // Show success message
      toast.success('Login successful! Welcome back!');

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Show user-friendly error message
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Login failed. Please check your credentials and try again.';
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle Password Visibility
   * 
   * Business Logic:
   * - Switches between showing and hiding password
   * - Improves user experience by allowing password verification
   * - Maintains security by defaulting to hidden password
   * 
   * @author Vicky
   */
  const togglePasswordVisibility = (): void => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center">
            <LogIn className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-secondary-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            Sign in to your CV Builder account
          </p>
        </div>

        {/* Login Form */}
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-secondary-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Please enter a valid email address',
                      },
                    })}
                    type="email"
                    id="email"
                    className={`input-field pl-10 ${errors.email ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className={`input-field pl-10 pr-10 ${errors.password ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    {...register('rememberMe')}
                    id="rememberMe"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                    disabled={isLoading}
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-secondary-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`btn-primary w-full ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <LogIn className="h-5 w-5 mr-2" />
                      Sign In
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Registration Link */}
        <div className="text-center">
          <p className="text-sm text-secondary-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Create one here
            </Link>
          </p>
        </div>

        {/* Demo Credentials Info */}
        <div className="card bg-info-50 border-info-200">
          <div className="card-body">
            <div className="flex items-start">
              <User className="h-5 w-5 text-info-600 mt-0.5 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-info-800">Demo Account</h3>
                <p className="text-sm text-info-700 mt-1">
                  Use any email and password from your registered accounts to test the login functionality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
