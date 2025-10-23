/**
 * Help Page Component
 * @fileoverview Help page component for CV Builder frontend
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-18
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';

const HelpPage: React.FC = () => {
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
              <h1 className="text-xl font-semibold text-secondary-900">Help & Support</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Coming Soon Message */}
        <div className="text-center mb-12">
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-12">
            <Clock className="h-16 w-16 text-primary-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-secondary-900 mb-4">
              Coming Soon
            </h2>
            <p className="text-secondary-600 text-lg mb-8">
              Exciting new features are on the way! Stay tuned for comprehensive help and support.
            </p>
            
            {/* Demo Content */}
            <div className="bg-secondary-50 rounded-lg p-8 mb-8">
              <h3 className="text-xl font-semibold text-secondary-900 mb-4">Demo Content</h3>
              <div className="text-left text-secondary-600 space-y-4">
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                  incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis 
                  nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <p>
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
                  eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt 
                  in culpa qui officia deserunt mollit anim id est laborum.
                </p>
                <p>
                  Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium 
                  doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore 
                  veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                </p>
              </div>
            </div>

            {/* Credits */}
            <div className="border-t border-secondary-200 pt-8">
              <p className="text-secondary-500 text-sm">
                Crafted by <span className="font-semibold text-primary-600">Neosoft</span>
              </p>
              <p className="text-secondary-500 text-sm mt-1">
                Developed by <span className="font-semibold text-primary-600">Vicky</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;

