/**
 * PostCSS Configuration
 * 
 * This file configures PostCSS for processing CSS in the CV Builder frontend.
 * It enables Tailwind CSS and Autoprefixer for modern CSS features and
 * browser compatibility.
 * 
 * Business Logic:
 * - Processes Tailwind CSS directives and utilities
 * - Adds vendor prefixes for cross-browser compatibility
 * - Optimizes CSS for production builds
 * - Enables modern CSS features and transforms
 * 
 * @fileoverview PostCSS configuration for CV Builder frontend
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-17
 */

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

