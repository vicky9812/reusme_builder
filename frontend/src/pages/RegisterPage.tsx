/**
 * Register Page Component
 * 
 * This component provides the user registration interface for the CV Builder
 * application. It includes form validation, error handling, and integration
 * with the authentication system.
 * 
 * Business Logic:
 * - Collects user registration data (username, email, password, contact)
 * - Validates form inputs with real-time feedback
 * - Handles password strength requirements
 * - Integrates with authentication context for registration
 * - Provides loading states and error handling
 * - Redirects to dashboard on successful registration
 * - Includes terms and conditions acceptance
 * 
 * @fileoverview Register page component for CV Builder frontend
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-17
 */

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * Registration form data interface
 * 
 * Business Logic:
 * - Defines structure for registration form data
 * - Ensures type safety for form validation
 * - Matches backend API expectations
 * 
 * @interface RegisterFormData
 * @author Vicky
 */
interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  contact_number: string;
  acceptTerms: boolean;
}

/**
 * Password strength indicator component
 * 
 * Business Logic:
 * - Analyzes password strength based on criteria
 * - Provides visual feedback for password requirements
 * - Helps users create secure passwords
 * - Shows real-time strength assessment
 * 
 * @param {Object} props - Component props
 * @param {string} props.password - Password to analyze
 * @returns {JSX.Element} Password strength indicator
 * @author Vicky
 */
const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
  /**
   * Calculate password strength score
   * 
   * Business Logic:
   * - Evaluates password against security criteria
   * - Assigns points for different requirements
   * - Returns strength level and criteria status
   * 
   * @param {string} password - Password to evaluate
   * @returns {Object} Strength analysis results
   * @author Vicky
   */
  const getPasswordStrength = (password: string) => {
    const criteria = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const score = Object.values(criteria).filter(Boolean).length;
    const strength = score < 2 ? 'weak' : score < 4 ? 'medium' : 'strong';
    const color = strength === 'weak' ? 'text-error-600' : strength === 'medium' ? 'text-warning-600' : 'text-success-600';

    return { criteria, strength, color, score };
  };

  const { criteria, strength, color, score } = getPasswordStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-secondary-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              score === 0 ? 'bg-secondary-300' :
              score <= 2 ? 'bg-error-500' :
              score <= 4 ? 'bg-warning-500' : 'bg-success-500'
            }`}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
        <span className={`text-sm font-medium ${color}`}>
          {strength.charAt(0).toUpperCase() + strength.slice(1)}
        </span>
      </div>
      
      <div className="space-y-1">
        {Object.entries(criteria).map(([key, met]) => (
          <div key={key} className="flex items-center space-x-2 text-sm">
            {met ? (
              <CheckCircle className="w-4 h-4 text-success-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-secondary-400" />
            )}
            <span className={met ? 'text-success-600' : 'text-secondary-500'}>
              {key === 'length' && 'At least 8 characters'}
              {key === 'uppercase' && 'One uppercase letter'}
              {key === 'lowercase' && 'One lowercase letter'}
              {key === 'number' && 'One number'}
              {key === 'special' && 'One special character'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Register page component
 * 
 * Business Logic:
 * - Renders registration form with validation
 * - Handles form submission and error states
 * - Provides user feedback and loading states
 * - Integrates with authentication system
 * - Redirects on successful registration
 * 
 * @returns {JSX.Element} Register page component
 * @author Vicky
 */
const RegisterPage: React.FC = () => {
  const { register: registerUser, state } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<RegisterFormData>();

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  /**
   * Handle form submission
   * 
   * Business Logic:
   * - Validates form data before submission
   * - Checks password confirmation match
   * - Calls authentication service for registration
   * - Handles success and error responses
   * - Redirects to dashboard on success
   * 
   * @param {RegisterFormData} data - Form data
   * @author Vicky
   */
  const onSubmit = async (data: RegisterFormData) => {
    try {
      // Clear any existing errors
      clearErrors();

      // Validate password confirmation
      if (data.password !== data.confirmPassword) {
        setError('confirmPassword', {
          type: 'manual',
          message: 'Passwords do not match',
        });
        return;
      }

      // Validate terms acceptance
      if (!data.acceptTerms) {
        setError('acceptTerms', {
          type: 'manual',
          message: 'You must accept the terms and conditions',
        });
        return;
      }

      // Prepare registration data
      const registrationData = {
        username: data.username,
        email: data.email,
        password: data.password,
        contact_number: data.contact_number || undefined,
      };

      // Call registration API
      await registerUser(registrationData);

      // Redirect to dashboard on success
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific field errors
      if (error.response?.data?.errors) {
        const fieldErrors = error.response.data.errors;
        Object.keys(fieldErrors).forEach(field => {
          setError(field as keyof RegisterFormData, {
            type: 'manual',
            message: fieldErrors[field][0],
          });
        });
      }
    }
  };

  /**
   * Redirect to dashboard if already authenticated
   * 
   * Business Logic:
   * - Checks if user is already logged in
   * - Redirects to dashboard to prevent duplicate registration
   * - Improves user experience
   * 
   * @author Vicky
   */
  useEffect(() => {
    if (state.isAuthenticated) {
      navigate('/dashboard');
    }
  }, [state.isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-xl flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-secondary-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-secondary-600">
            Join CV Builder and create professional resumes
          </p>
        </div>

        {/* Registration Form */}
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    {...register('username', {
                      required: 'Username is required',
                      minLength: {
                        value: 3,
                        message: 'Username must be at least 3 characters',
                      },
                      maxLength: {
                        value: 30,
                        message: 'Username must be less than 30 characters',
                      },
                      pattern: {
                        value: /^[a-zA-Z0-9_]+$/,
                        message: 'Username can only contain letters, numbers, and underscores',
                      },
                    })}
                    type="text"
                    className={`form-input pl-10 ${errors.username ? 'border-error-500' : ''}`}
                    placeholder="Enter your username"
                  />
                </div>
                {errors.username && (
                  <p className="form-error">{errors.username.message}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="form-label">
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
                    className={`form-input pl-10 ${errors.email ? 'border-error-500' : ''}`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
              </div>

              {/* Contact Number Field */}
              <div>
                <label htmlFor="contact_number" className="form-label">
                  Contact Number (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    {...register('contact_number', {
                      pattern: {
                        value: /^[\+]?[1-9][\d]{0,15}$/,
                        message: 'Please enter a valid phone number',
                      },
                    })}
                    type="tel"
                    className={`form-input pl-10 ${errors.contact_number ? 'border-error-500' : ''}`}
                    placeholder="Enter your phone number"
                  />
                </div>
                {errors.contact_number && (
                  <p className="form-error">{errors.contact_number.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="form-label">
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
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input pl-10 pr-10 ${errors.password ? 'border-error-500' : ''}`}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="form-error">{errors.password.message}</p>
                )}
                <PasswordStrengthIndicator password={password || ''} />
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`form-input pl-10 pr-10 ${errors.confirmPassword ? 'border-error-500' : ''}`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="form-error">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      {...register('acceptTerms', {
                        required: 'You must accept the terms and conditions',
                      })}
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="acceptTerms" className="text-secondary-700">
                      I agree to the{' '}
                      <a href="/terms" className="text-primary-600 hover:text-primary-500">
                        Terms and Conditions
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" className="text-primary-600 hover:text-primary-500">
                        Privacy Policy
                      </a>
                    </label>
                  </div>
                </div>
                {errors.acceptTerms && (
                  <p className="form-error">{errors.acceptTerms.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={state.isLoading}
                  className="btn-primary w-full py-3 text-base font-medium"
                >
                  {state.isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="loading-spinner mr-2" />
                      Creating Account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>

              {/* Error Message */}
              {state.error && (
                <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-error-400" />
                    <div className="ml-3">
                      <p className="text-sm text-error-800">{state.error}</p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-sm text-secondary-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
