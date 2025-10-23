/**
 * Application Entry Point
 * 
 * This is the main entry point for the CV Builder frontend application.
 * It initializes React, renders the App component, and sets up the
 * application environment.
 * 
 * Business Logic:
 * - Initializes React application
 * - Renders App component to DOM
 * - Sets up development tools and error reporting
 * - Configures application environment
 * - Handles application startup and initialization
 * 
 * @fileoverview Application entry point for CV Builder frontend
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-17
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Get root element for React rendering
 * 
 * Business Logic:
 * - Finds the root DOM element
 * - Ensures element exists before rendering
 * - Provides error handling for missing element
 * 
 * @author Vicky
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Make sure there is a div with id="root" in your HTML.');
}

/**
 * Create React root and render application
 * 
 * Business Logic:
 * - Creates React 18 root for concurrent features
 * - Renders App component with strict mode
 * - Enables development-time checks and warnings
 * - Provides better error boundaries and debugging
 * 
 * @author Vicky
 */
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Development tools and error reporting
if (process.env.NODE_ENV === 'development') {
  // Enable React DevTools
  if (typeof window !== 'undefined') {
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ || {};
  }
  
  // Log application startup
  console.log('🚀 CV Builder Frontend Application Started');
  console.log('📱 Environment:', process.env.NODE_ENV);
  console.log('🔗 API URL:', process.env.REACT_APP_API_URL || 'http://localhost:3000/api');
}



