/**
 * Settings Page Component
 * @fileoverview Settings page component for CV Builder frontend
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-18
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Bell, Shield, Palette, CreditCard, Save, Eye, EyeOff, Loader2, Check, X, Download, FileText } from 'lucide-react';
import { apiService } from '../services/api';
import { User as UserType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    contact_number: '',
  });
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  
  // UI state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    email_notifications: true,
    marketing_emails: false,
  });
  
  // Theme settings
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        setProfile(response.data);
        setProfileForm({
          username: response.data.username || '',
          email: response.data.email || '',
          contact_number: response.data.contact_number || '',
        });
      } else {
        toast.error('Failed to load profile');
      }
    } catch (error: any) {
      console.error('Fetch profile error:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) return;
    
    try {
      setIsUpdating(true);
      
      // Only send changed fields
      const updates: any = {};
      if (profileForm.username !== profile.username) updates.username = profileForm.username;
      if (profileForm.email !== profile.email) updates.email = profileForm.email;
      if (profileForm.contact_number !== profile.contact_number) updates.contact_number = profileForm.contact_number;
      
      if (Object.keys(updates).length === 0) {
        toast.success('No changes to save');
        return;
      }
      
      const response = await apiService.updateProfile(updates);
      
      if (response.success && response.data) {
        setProfile(response.data);
        updateUser(response.data);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordForm.new_password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setIsChangingPassword(true);
      
      const response = await apiService.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      
      if (response.success) {
        toast.success('Password changed successfully!');
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
        setShowPasswordForm(false);
      } else {
        toast.error(response.message || 'Failed to change password');
      }
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value,
    }));
    toast.success('Notification settings updated');
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast.success('Theme updated');
  };

  const generateBillingPDF = (paymentData: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    doc.setLineHeightFactor(1.2);

    // Header band
    doc.setFillColor(243, 244, 246);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246);
    doc.text('CV Builder', margin, 25);

    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text('INVOICE', pageWidth - 20, 18, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text(`Invoice # ${paymentData.transaction_id}`, pageWidth - 20, 28, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 20, 34, { align: 'right' });

    // From / Bill To
    const blockTop = 50;
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text('From', margin, blockTop);
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.text('CV Builder Pvt. Ltd.', margin, blockTop + 8);
    doc.text('Mumbai, Maharashtra, IN', margin, blockTop + 14);
    doc.text('support@cvbuilder.com', margin, blockTop + 20);

    const billToX = pageWidth / 2 + 10;
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text('Bill To', billToX, blockTop);
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.text(String(paymentData.metadata.cardholder_name || 'Customer'), billToX, blockTop + 8);
    doc.text(`Payment: ${String(paymentData.payment_method || '').toUpperCase()}`, billToX, blockTop + 14);
    doc.text(`Card: **** **** **** ${String(paymentData.metadata.card_last_four || '****')}`, billToX, blockTop + 20);

    // Table
    const tableTop = blockTop + 42;
    const colX = { desc: margin, qty: pageWidth - 110, price: pageWidth - 70, amount: pageWidth - margin };
    doc.setFillColor(243, 244, 246);
    doc.setDrawColor(229, 231, 235);
    const headerHeight = 12;
    doc.rect(margin, tableTop, pageWidth - margin * 2, headerHeight, 'FD');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text('Description', colX.desc, tableTop + 8);
    doc.text('Qty', colX.qty, tableTop + 8);
    doc.text('Price', colX.price, tableTop + 8);
    doc.text('Amount', colX.amount, tableTop + 8, { align: 'right' });

    const rowHeight = 14;
    const rowY = tableTop + headerHeight + rowHeight - 4;
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, rowY - rowHeight, pageWidth - margin, rowY - rowHeight);
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    const planName = String(paymentData.metadata.plan_name || 'Selected Plan');
    const currency = String(paymentData.currency || 'INR');
    const price = Number(paymentData.amount || 0);
    doc.text(`${planName} Subscription`, colX.desc, rowY);
    doc.text('1', colX.qty, rowY);
    doc.text(`${currency === 'INR' ? '₹' : ''}${price.toFixed(2)}`, colX.price, rowY);
    doc.text(`${currency === 'INR' ? '₹' : ''}${price.toFixed(2)}`, colX.amount, rowY, { align: 'right' });

    // Totals
    const tableBottom = tableTop + headerHeight + rowHeight + 6;
    const totalsTop = tableBottom + 12;
    const totalsLeft = pageWidth - 120;
    const totalsWidth = 100;
    const lineHeight = 8;
    doc.setDrawColor(229, 231, 235);
    doc.rect(totalsLeft, totalsTop, totalsWidth, 40);

    const subtotal = price;
    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const grandTotal = Math.round((subtotal + tax) * 100) / 100;
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.text('Subtotal', totalsLeft + 6, totalsTop + lineHeight);
    doc.text(`${currency === 'INR' ? '₹' : ''}${subtotal.toFixed(2)}`, totalsLeft + totalsWidth - 6, totalsTop + lineHeight, { align: 'right' });
    doc.text('Tax (18% GST)', totalsLeft + 6, totalsTop + lineHeight * 2);
    doc.text(`${currency === 'INR' ? '₹' : ''}${tax.toFixed(2)}`, totalsLeft + totalsWidth - 6, totalsTop + lineHeight * 2, { align: 'right' });
    doc.line(totalsLeft, totalsTop + lineHeight * 2.5, totalsLeft + totalsWidth, totalsTop + lineHeight * 2.5);
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.text('Total', totalsLeft + 6, totalsTop + lineHeight * 4);
    doc.text(`${currency === 'INR' ? '₹' : ''}${grandTotal.toFixed(2)}`, totalsLeft + totalsWidth - 6, totalsTop + lineHeight * 4, { align: 'right' });

    // Notes & footer
    const notesTop = totalsTop + 56;
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text('Thank you for your purchase. This is a system generated invoice and does not require a signature.', 20, notesTop, { maxWidth: pageWidth - 40 });

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Crafted by Neosoft, Developed by Vicky Assignment', pageWidth / 2, pageHeight - 18, { align: 'center' });
    doc.text('© 2025 CV Builder. All rights reserved.', pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.save(`billing-invoice-${paymentData.transaction_id}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-secondary-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 text-secondary-600 hover:text-secondary-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-secondary-300"></div>
              <h1 className="text-xl font-semibold text-secondary-900">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-secondary-900 mb-2">
            Account Settings
          </h2>
          <p className="text-secondary-600">
            Manage your account preferences and settings
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Profile Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <User className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-secondary-900">Profile Information</h3>
            </div>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter email"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={profileForm.contact_number}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, contact_number: e.target.value }))}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter phone number"
                />
              </div>
              <button 
                type="submit"
                disabled={isUpdating}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Update Profile</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Billing & Plan Information */}
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CreditCard className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-secondary-900">Billing & Plan</h3>
            </div>
            
            <div className="space-y-4">
              {/* Current Plan */}
              <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg">
                <div>
                  <h4 className="font-semibold text-secondary-900">Current Plan</h4>
                  <p className="text-secondary-600">
                    {user?.role === 'premium' ? 'Premium Plan' : user?.role === 'admin' ? 'Admin Plan' : 'Free Plan'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary-600">
                    {user?.role === 'premium' ? '₹999' : user?.role === 'admin' ? '₹1999' : '₹0'}
                  </span>
                  <p className="text-sm text-secondary-600">/month</p>
                </div>
              </div>

              {/* Plan Features */}
              <div className="space-y-2">
                <h5 className="font-medium text-secondary-900">Plan Features:</h5>
                <ul className="space-y-1 text-sm text-secondary-600">
                  {user?.role === 'premium' ? (
                    <>
                      <li>✓ Unlimited CVs</li>
                      <li>✓ All templates</li>
                      <li>✓ PDF & DOCX downloads</li>
                      <li>✓ Priority support</li>
                      <li>✓ Advanced analytics</li>
                    </>
                  ) : user?.role === 'admin' ? (
                    <>
                      <li>✓ Everything in Premium</li>
                      <li>✓ API access</li>
                      <li>✓ White-label solution</li>
                      <li>✓ Dedicated support</li>
                      <li>✓ Custom integrations</li>
                    </>
                  ) : (
                    <>
                      <li>✓ Up to 3 CVs</li>
                      <li>✓ Basic templates</li>
                      <li>✓ PDF downloads</li>
                      <li>✓ Email support</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Upgrade Button */}
              {user?.role === 'user' && (
                <div className="pt-4 border-t border-secondary-200">
                  <button
                    onClick={() => navigate('/payment')}
                    className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Upgrade Plan</span>
                  </button>
                </div>
              )}

              {/* Manage Subscription */}
              {(user?.role === 'premium' || user?.role === 'admin') && (
                <div className="pt-4 border-t border-secondary-200">
                  <button
                    onClick={() => navigate('/payment')}
                    className="w-full bg-secondary-100 text-secondary-700 px-4 py-2 rounded-lg hover:bg-secondary-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Manage Subscription</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Bell className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-secondary-900">Notifications</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-secondary-900">Email Notifications</p>
                  <p className="text-sm text-secondary-600">Receive updates about your CVs</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('email_notifications', !notifications.email_notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.email_notifications ? 'bg-primary-600' : 'bg-secondary-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.email_notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-secondary-900">Marketing Emails</p>
                  <p className="text-sm text-secondary-600">Receive tips and updates</p>
                </div>
                <button
                  onClick={() => handleNotificationChange('marketing_emails', !notifications.marketing_emails)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.marketing_emails ? 'bg-primary-600' : 'bg-secondary-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.marketing_emails ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-secondary-900">Privacy & Security</h3>
            </div>
            <div className="space-y-4">
              <button 
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="w-full bg-secondary-100 text-secondary-700 px-4 py-2 rounded-lg hover:bg-secondary-200 transition-colors flex items-center justify-center space-x-2"
              >
                <Shield className="h-4 w-4" />
                <span>Change Password</span>
              </button>
              
              {showPasswordForm && (
                <form onSubmit={handlePasswordChange} className="space-y-4 p-4 bg-secondary-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter current password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-500 hover:text-secondary-700"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-500 hover:text-secondary-700"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                        className="w-full px-3 py-2 pr-10 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Confirm new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-500 hover:text-secondary-700"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      type="submit"
                      disabled={isChangingPassword}
                      className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Changing...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Change Password</span>
                        </>
                      )}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowPasswordForm(false)}
                      className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors flex items-center space-x-2"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Palette className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-secondary-900">Appearance</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Theme
                </label>
                <select 
                  value={theme}
                  onChange={(e) => handleThemeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>
          </div>

          {/* Billing History */}
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="h-6 w-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-secondary-900">Billing History</h3>
            </div>
            <div className="space-y-4">
              {/* Sample billing records */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-secondary-500" />
                    <div>
                      <p className="font-medium text-secondary-900">Premium Plan - January 2025</p>
                      <p className="text-sm text-secondary-600">Transaction ID: TXN_1737123456789</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-secondary-900">₹999</span>
                    <button
                      onClick={() => {
                        const paymentData = {
                          amount: 999,
                          currency: 'INR',
                          payment_method: 'card',
                          transaction_id: 'TXN_1737123456789',
                          status: 'completed',
                          action_type: 'premium_upgrade',
                          metadata: {
                            plan_id: 'premium',
                            plan_name: 'Premium Plan',
                            card_last_four: '1234',
                            cardholder_name: user?.username || 'Customer',
                          },
                        };
                        generateBillingPDF(paymentData);
                      }}
                      className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-secondary-500" />
                    <div>
                      <p className="font-medium text-secondary-900">Basic Plan - December 2024</p>
                      <p className="text-sm text-secondary-600">Transaction ID: TXN_1734567890123</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-secondary-900">₹499</span>
                    <button
                      onClick={() => {
                        const paymentData = {
                          amount: 499,
                          currency: 'INR',
                          payment_method: 'card',
                          transaction_id: 'TXN_1734567890123',
                          status: 'completed',
                          action_type: 'premium_upgrade',
                          metadata: {
                            plan_id: 'basic',
                            plan_name: 'Basic Plan',
                            card_last_four: '5678',
                            cardholder_name: user?.username || 'Customer',
                          },
                        };
                        generateBillingPDF(paymentData);
                      }}
                      className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="text-center pt-4 border-t border-secondary-200">
                <p className="text-sm text-secondary-600">
                  All invoices include "Crafted by Neosoft, Developed by Vicky Assignment" tagline
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

