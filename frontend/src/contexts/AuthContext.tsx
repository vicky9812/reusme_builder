/**
 * Authentication Context
 * 
 * This context provides authentication state management for the CV Builder
 * frontend application. It handles user authentication, token management,
 * and provides authentication state to all components.
 * 
 * Business Logic:
 * - Manages user authentication state globally
 * - Handles login, logout, and registration operations
 * - Provides authentication status to components
 * - Manages user data and token storage
 * - Handles authentication errors and token refresh
 * - Provides loading states for authentication operations
 * 
 * @fileoverview Authentication context for CV Builder frontend
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-17
 */

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import apiService, { RegisterRequest, LoginRequest } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Authentication state interface
 * 
 * Business Logic:
 * - Defines the structure of authentication state
 * - Includes user data, loading states, and error information
 * - Provides type safety for authentication operations
 * 
 * @interface AuthState
 * @author Vicky
 */
interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Authentication action types
 * 
 * Business Logic:
 * - Defines all possible authentication actions
 * - Used for type safety in reducer
 * - Covers all authentication operations
 * 
 * @type AuthAction
 * @author Vicky
 */
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: any }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_SET_USER'; payload: any };

/**
 * Authentication context interface
 * 
 * Business Logic:
 * - Defines the context value structure
 * - Includes state and authentication methods
 * - Provides type safety for context consumers
 * 
 * @interface AuthContextType
 * @author Vicky
 */
interface AuthContextType {
  state: AuthState;
  user: any | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (userData: any) => void;
}

/**
 * Initial authentication state
 * 
 * Business Logic:
 * - Sets default state for authentication
 * - User starts as not authenticated
 * - No loading or error states initially
 * 
 * @constant initialState
 * @author Vicky
 */
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

/**
 * Authentication reducer
 * 
 * Business Logic:
 * - Handles state updates for authentication actions
 * - Manages loading, success, and error states
 * - Ensures state consistency across operations
 * - Provides predictable state transitions
 * 
 * @param {AuthState} state - Current authentication state
 * @param {AuthAction} action - Authentication action to process
 * @returns {AuthState} Updated authentication state
 * @author Vicky
 */
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload,
        error: null,
      };
    
    case 'AUTH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload,
      };
    
    case 'AUTH_LOGOUT':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: null,
      };
    
    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    case 'AUTH_SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };
    
    default:
      return state;
  }
};

/**
 * Create authentication context
 * 
 * Business Logic:
 * - Creates React context for authentication
 * - Provides default value for context
 * - Used throughout the application for auth state
 * 
 * @constant AuthContext
 * @author Vicky
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication provider component
 * 
 * Business Logic:
 * - Wraps the application with authentication context
 * - Manages authentication state using reducer
 * - Provides authentication methods to children
 * - Handles initial authentication check on mount
 * - Manages token refresh and error handling
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components
 * @returns {JSX.Element} Authentication provider component
 * @author Vicky
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Initialize authentication state on mount
   * 
   * Business Logic:
   * - Checks for existing authentication on app start
   * - Restores user data from localStorage
   * - Validates token and updates state
   * - Handles expired or invalid tokens
   * 
   * @author Vicky
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = apiService.getCurrentUser();
        const isAuthenticated = apiService.isAuthenticated();
        
        if (isAuthenticated && user) {
          // Set user immediately from localStorage
          dispatch({ type: 'AUTH_SET_USER', payload: user });
          
          // Verify token is still valid by fetching profile (non-blocking)
          try {
            const profile = await apiService.getProfile();
            if (profile.success && profile.data) {
              dispatch({ type: 'AUTH_SET_USER', payload: profile.data });
            }
          } catch (error) {
            console.warn('Profile fetch failed, but keeping user logged in:', error);
            // Don't logout on profile fetch failure, keep user logged in
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Only logout if there's a critical error
        if ((error as any)?.message?.includes('token') || (error as any)?.message?.includes('unauthorized')) {
          await logout();
        }
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login user with credentials
   * 
   * Business Logic:
   * - Validates user credentials with backend
   * - Stores authentication tokens and user data
   * - Updates authentication state
   * - Handles login errors and validation
   * - Shows success/error messages to user
   * 
   * @param {LoginRequest} credentials - User login credentials
   * @returns {Promise<void>} Promise that resolves when login is complete
   * @author Vicky
   */
  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await apiService.login(credentials);
      
      dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
      toast.success('Login successful!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  /**
   * Register new user
   * 
   * Business Logic:
   * - Creates new user account with backend
   * - Stores authentication tokens and user data
   * - Updates authentication state
   * - Handles registration errors and validation
   * - Shows success/error messages to user
   * 
   * @param {RegisterRequest} userData - User registration data
   * @returns {Promise<void>} Promise that resolves when registration is complete
   * @author Vicky
   */
  const register = async (userData: RegisterRequest): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await apiService.register(userData);
      
      dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
      toast.success('Registration successful! Welcome to CV Builder!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      toast.error(errorMessage);
    }
  };

  /**
   * Logout user
   * 
   * Business Logic:
   * - Sends logout request to backend
   * - Clears all stored tokens and user data
   * - Updates authentication state
   * - Redirects to login page
   * - Handles logout errors gracefully
   * 
   * @returns {Promise<void>} Promise that resolves when logout is complete
   * @author Vicky
   */
  const logout = async (): Promise<void> => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
      toast.success('Logged out successfully');
    }
  };

  /**
   * Clear authentication error
   * 
   * Business Logic:
   * - Removes error state from authentication
   * - Used to dismiss error messages
   * - Provides clean state for retry operations
   * 
   * @author Vicky
   */
  const clearError = (): void => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  /**
   * Refresh user data
   * 
   * Business Logic:
   * - Fetches latest user data from backend
   * - Updates user information in state
   * - Handles authentication errors
   * - Used for profile updates and data refresh
   * 
   * @returns {Promise<void>} Promise that resolves when refresh is complete
   * @author Vicky
   */
  const refreshUser = async (): Promise<void> => {
    try {
      const profile = await apiService.getProfile();
      dispatch({ type: 'AUTH_SET_USER', payload: profile });
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const updateUser = (userData: any) => {
    dispatch({ type: 'AUTH_SET_USER', payload: userData });
  };

  const value: AuthContextType = {
    state,
    user: state.user,
    login,
    register,
    logout,
    clearError,
    refreshUser,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 * 
 * Business Logic:
 * - Provides access to authentication context
 * - Ensures context is used within provider
 * - Throws error if used outside provider
 * - Provides type safety for context usage
 * 
 * @returns {AuthContextType} Authentication context value
 * @throws {Error} If used outside AuthProvider
 * @author Vicky
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
