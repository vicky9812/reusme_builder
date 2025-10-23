/**
 * Forgot Password Page Component
 *
 * This component provides the user interface and logic for password reset using OTP.
 * It includes a form for email input, OTP verification, and new password setting.
 * The component handles the complete forgot password flow with proper validation.
 *
 * Business Logic:
 * - Handles user input for email address.
 * - Requests OTP for password reset from backend API.
 * - Verifies OTP code entered by user.
 * - Allows user to set new password after OTP verification.
 * - Manages loading states and displays toast notifications for feedback.
 * - Provides navigation back to login page.
 * - Implements proper form validation and error handling.
 *
 * @fileoverview Forgot password page component for CV Builder frontend
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-17
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Shield, Key, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService } from '../services/api';

/**
 * Forgot Password Form Data Interface
 *
 * Business Logic:
 * - Defines the structure for forgot password form data.
 * - Ensures type safety for form inputs.
 *
 * @interface ForgotPasswordFormData
 * @author Vicky
 */
interface ForgotPasswordFormData {
  email: string;
  otp: string;
  new_password: string;
  confirm_password: string;
}

/**
 * Forgot Password Page Component
 *
 * Business Logic:
 * - Manages multi-step forgot password flow (email → OTP → new password).
 * - Handles form state and submission for each step.
 * - Calls authentication service for OTP generation and verification.
 * - Manages password visibility toggle.
 * - Displays success/error messages using toast notifications.
 * - Provides navigation back to login page.
 *
 * @returns {JSX.Element} Forgot password page component
 * @author Vicky
 */
const ForgotPasswordPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'email' | 'otp' | 'password'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<ForgotPasswordFormData>();

  const newPassword = watch('new_password');

  /**
   * Handles email submission for OTP request.
   *
   * Business Logic:
   * - Sets loading state to true.
   * - Calls the API service to request OTP for password reset.
   * - Stores email for next steps.
   * - Moves to OTP verification step on success.
   * - Displays error messages on failure.
   * - Resets loading state.
   *
   * @param {ForgotPasswordFormData} data - The form data containing email.
   * @returns {Promise<void>}
   * @author Vicky
   */
  const onSubmitEmail = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await apiService.requestPasswordReset(data.email);
      
      setEmail(data.email);
      setCurrentStep('otp');
      toast.success('OTP sent to your email address!');
      
      // Show OTP in development mode
      if (response.otp && response.otp !== '****') {
        toast.success(`Development OTP: ${response.otp}`, { duration: 10000 });
      }
    } catch (error: any) {
      console.error('Request password reset error:', error);
      toast.error(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles OTP verification.
   *
   * Business Logic:
   * - Sets loading state to true.
   * - Calls the API service to verify OTP.
   * - Stores reset token for password change.
   * - Moves to password reset step on success.
   * - Displays error messages on failure.
   * - Resets loading state.
   *
   * @param {ForgotPasswordFormData} data - The form data containing OTP.
   * @returns {Promise<void>}
   * @author Vicky
   */
  const onSubmitOTP = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await apiService.verifyOTP(email, data.otp);
      
      setResetToken(response.reset_token);
      setCurrentStep('password');
      toast.success('OTP verified successfully!');
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast.error(error.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles new password submission.
   *
   * Business Logic:
   * - Sets loading state to true.
   * - Calls the API service to reset password with token.
   * - Redirects to login page on success.
   * - Displays error messages on failure.
   * - Resets loading state.
   *
   * @param {ForgotPasswordFormData} data - The form data containing new password.
   * @returns {Promise<void>}
   * @author Vicky
   */
  const onSubmitPassword = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await apiService.resetPassword(resetToken, data.new_password);
      
      toast.success('Password reset successfully! Please login with your new password.');
      navigate('/login');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles back navigation between steps.
   *
   * Business Logic:
   * - Moves back to previous step in the flow.
   * - Resets form data when going back.
   * - Handles navigation to login page from first step.
   *
   * @returns {void}
   * @author Vicky
   */
  const handleBack = () => {
    if (currentStep === 'otp') {
      setCurrentStep('email');
      reset();
    } else if (currentStep === 'password') {
      setCurrentStep('otp');
      reset();
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center p-4">
      <div className="card max-w-md w-full mx-auto">
        <div className="card-header text-center">
          <button
            onClick={handleBack}
            className="absolute left-4 top-4 p-2 text-secondary-400 hover:text-secondary-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <h1 className="text-3xl font-extrabold text-secondary-900 mb-2">
            {currentStep === 'email' && 'Forgot Password?'}
            {currentStep === 'otp' && 'Verify OTP'}
            {currentStep === 'password' && 'Set New Password'}
          </h1>
          
          <p className="text-secondary-600">
            {currentStep === 'email' && 'Enter your email address to receive a verification code.'}
            {currentStep === 'otp' && 'Enter the 4-digit code sent to your email.'}
            {currentStep === 'password' && 'Create a new password for your account.'}
          </p>
        </div>

        <div className="card-body">
          {currentStep === 'email' && (
            <form onSubmit={handleSubmit(onSubmitEmail)} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-secondary-400" aria-hidden="true" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="input-field pl-10"
                    placeholder="you@example.com"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  className="btn-primary w-full flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading && <span className="loading-spinner mr-2" />}
                  <Shield className="h-5 w-5 mr-2" />
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </div>
            </form>
          )}

          {currentStep === 'otp' && (
            <form onSubmit={handleSubmit(onSubmitOTP)} className="space-y-6">
              {/* OTP Input */}
              <div>
                <label htmlFor="otp" className="form-label">
                  Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-secondary-400" aria-hidden="true" />
                  </div>
                  <input
                    id="otp"
                    type="text"
                    required
                    className="input-field pl-10 text-center text-2xl tracking-widest"
                    placeholder="1111"
                    maxLength={4}
                    {...register('otp', {
                      required: 'OTP is required',
                      pattern: {
                        value: /^\d{4}$/,
                        message: 'OTP must be 4 digits',
                      },
                    })}
                  />
                </div>
                {errors.otp && (
                  <p className="form-error">{errors.otp.message}</p>
                )}
                <p className="text-sm text-secondary-500 mt-2">
                  Development OTP: <span className="font-mono font-bold">1111</span>
                </p>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  className="btn-primary w-full flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading && <span className="loading-spinner mr-2" />}
                  <Shield className="h-5 w-5 mr-2" />
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </form>
          )}

          {currentStep === 'password' && (
            <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-6">
              {/* New Password Input */}
              <div>
                <label htmlFor="new_password" className="form-label">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-secondary-400" aria-hidden="true" />
                  </div>
                  <input
                    id="new_password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="input-field pl-10 pr-10"
                    placeholder="••••••••"
                    {...register('new_password', {
                      required: 'New password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters',
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                        message: 'Password must contain uppercase, lowercase, number, and special character',
                      },
                    })}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
                    {showPassword ? (
                      <EyeOff
                        className="h-5 w-5 text-secondary-400 hover:text-secondary-600"
                        onClick={() => setShowPassword(false)}
                      />
                    ) : (
                      <Eye
                        className="h-5 w-5 text-secondary-400 hover:text-secondary-600"
                        onClick={() => setShowPassword(true)}
                      />
                    )}
                  </div>
                </div>
                {errors.new_password && (
                  <p className="form-error">{errors.new_password.message}</p>
                )}
              </div>

              {/* Confirm Password Input */}
              <div>
                <label htmlFor="confirm_password" className="form-label">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-secondary-400" aria-hidden="true" />
                  </div>
                  <input
                    id="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="input-field pl-10 pr-10"
                    placeholder="••••••••"
                    {...register('confirm_password', {
                      required: 'Please confirm your password',
                      validate: (value) =>
                        value === newPassword || 'Passwords do not match',
                    })}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
                    {showConfirmPassword ? (
                      <EyeOff
                        className="h-5 w-5 text-secondary-400 hover:text-secondary-600"
                        onClick={() => setShowConfirmPassword(false)}
                      />
                    ) : (
                      <Eye
                        className="h-5 w-5 text-secondary-400 hover:text-secondary-600"
                        onClick={() => setShowConfirmPassword(true)}
                      />
                    )}
                  </div>
                </div>
                {errors.confirm_password && (
                  <p className="form-error">{errors.confirm_password.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  className="btn-primary w-full flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading && <span className="loading-spinner mr-2" />}
                  <Shield className="h-5 w-5 mr-2" />
                  {isLoading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="card-footer text-center">
          <p className="text-sm text-secondary-600">
            Remember your password?{' '}
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

export default ForgotPasswordPage;
