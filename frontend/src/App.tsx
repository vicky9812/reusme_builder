/**
 * Main App Component
 * 
 * This is the root component of the CV Builder frontend application. It sets up
 * routing, authentication context, global styles, and error boundaries for the
 * entire application.
 * 
 * Business Logic:
 * - Configures React Router for navigation
 * - Provides authentication context to all components
 * - Sets up global error handling and toast notifications
 * - Manages application-wide state and providers
 * - Handles route protection and authentication
 * - Provides consistent layout and styling
 * 
 * @fileoverview Main App component for CV Builder frontend
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-17
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import CVEditorPage from './pages/CVEditorPage';
import CVPreviewPage from './pages/CVPreviewPage';
import TemplatesPage from './pages/TemplatesPage';
import SettingsPage from './pages/SettingsPage';
import PaymentPage from './pages/PaymentPage';
import HelpPage from './pages/HelpPage';
import './index.css';

/**
 * Protected Route Component
 * 
 * Business Logic:
 * - Wraps routes that require authentication
 * - Redirects unauthenticated users to login
 * - Provides seamless authentication flow
 * - Handles loading states during auth check
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to protect
 * @returns {JSX.Element} Protected route component
 * @author Vicky
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAuth();
  
  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

/**
 * Public Route Component
 * 
 * Business Logic:
 * - Wraps routes that should only be accessible to unauthenticated users
 * - Redirects authenticated users to dashboard
 * - Prevents duplicate login/registration
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Public route component
 * @author Vicky
 */
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = localStorage.getItem('access_token');
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};


/**
 * Error Boundary Component
 * 
 * Business Logic:
 * - Catches JavaScript errors anywhere in the component tree
 * - Displays fallback UI instead of crashing the app
 * - Logs errors for debugging
 * - Provides user-friendly error messages
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Error boundary component
 * @author Vicky
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
          <div className="card max-w-md w-full mx-4">
            <div className="card-body text-center">
              <h1 className="text-2xl font-bold text-error-600 mb-4">
                Something went wrong
              </h1>
              <p className="text-secondary-600 mb-6">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Main App Component
 * 
 * Business Logic:
 * - Sets up the complete application structure
 * - Configures routing and authentication
 * - Provides global context and error handling
 * - Manages application-wide state
 * - Handles navigation and route protection
 * 
 * @returns {JSX.Element} Main App component
 * @author Vicky
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            {/* Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#374151',
                  boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.75rem',
                },
                success: {
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />

            {/* Application Routes */}
            <Routes>
              {/* Public Routes */}
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPasswordPage />
                  </PublicRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cv-editor/:id"
                element={
                  <ProtectedRoute>
                    <CVEditorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cv-preview/:id"
                element={
                  <ProtectedRoute>
                    <CVPreviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/templates"
                element={
                  <ProtectedRoute>
                    <TemplatesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment"
                element={
                  <ProtectedRoute>
                    <PaymentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/help"
                element={
                  <ProtectedRoute>
                    <HelpPage />
                  </ProtectedRoute>
                }
              />

              {/* Default Route */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* 404 Route */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
                    <div className="card max-w-md w-full mx-4">
                      <div className="card-body text-center">
                        <h1 className="text-2xl font-bold text-secondary-900 mb-4">
                          Page Not Found
                        </h1>
                        <p className="text-secondary-600 mb-6">
                          The page you're looking for doesn't exist.
                        </p>
                        <a href="/register" className="btn-primary">
                          Go Home
                        </a>
                      </div>
                    </div>
                  </div>
                }
              />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
