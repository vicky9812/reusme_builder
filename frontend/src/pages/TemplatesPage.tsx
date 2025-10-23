/**
 * Templates Page Component
 * @fileoverview Templates page component for CV Builder frontend
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-18
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Palette, FileText, Loader2, Plus } from 'lucide-react';
import { apiService } from '../services/api';
import { Layout, CreateCVRequest, BasicDetails } from '../types';
import toast from 'react-hot-toast';

const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingCV, setCreatingCV] = useState<string | null>(null);

  useEffect(() => {
    fetchLayouts();
  }, []);

  const fetchLayouts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getLayouts();
      if (response.success && response.data) {
        setLayouts(response.data);
      } else {
        toast.error('Failed to load templates');
      }
    } catch (error) {
      console.error('Error fetching layouts:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCV = async (layoutId: string) => {
    try {
      setCreatingCV(layoutId);
      
      // Create default basic details for new CV
      const defaultBasicDetails: Omit<BasicDetails, 'id' | 'cv_id'> = {
        full_name: 'Your Name',
        email: 'your.email@example.com',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        introduction: 'Write a brief summary about yourself...',
        profile_image_url: undefined,
      };

      const cvData: CreateCVRequest = {
        title: `My ${layouts.find(l => l.id === layoutId)?.name || 'New'} CV`,
        layout: layoutId.toLowerCase() as 'modern' | 'classic' | 'creative',
        basic_details: defaultBasicDetails,
        education: [],
        experience: [],
        projects: [],
        skills: [],
        social_profiles: [],
      };

      const response = await apiService.createCV(cvData);
      
      if (response.success && response.data) {
        toast.success('CV created successfully!');
        navigate(`/cv-editor/${response.data.cv.id}`);
      } else {
        toast.error(response.message || 'Failed to create CV');
      }
    } catch (error: any) {
      console.error('Error creating CV:', error);
      toast.error(error.message || 'Failed to create CV');
    } finally {
      setCreatingCV(null);
    }
  };

  const getLayoutIcon = (layoutId: string) => {
    switch (layoutId.toLowerCase()) {
      case 'modern':
        return <Palette className="h-8 w-8 text-primary-600" />;
      case 'classic':
        return <FileText className="h-8 w-8 text-secondary-600" />;
      case 'creative':
        return <Award className="h-8 w-8 text-accent-600" />;
      default:
        return <FileText className="h-8 w-8 text-secondary-600" />;
    }
  };

  const getLayoutEmoji = (layoutId: string) => {
    switch (layoutId.toLowerCase()) {
      case 'modern':
        return '🎨';
      case 'classic':
        return '📄';
      case 'creative':
        return '✨';
      default:
        return '📄';
    }
  };

  const getLayoutBgColor = (layoutId: string) => {
    switch (layoutId.toLowerCase()) {
      case 'modern':
        return 'bg-primary-100';
      case 'classic':
        return 'bg-secondary-100';
      case 'creative':
        return 'bg-accent-100';
      default:
        return 'bg-secondary-100';
    }
  };

  if (loading) {
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
                <h1 className="text-xl font-semibold text-secondary-900">CV Templates</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Loading State */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
              <p className="text-secondary-600">Loading templates...</p>
            </div>
          </div>
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
              <h1 className="text-xl font-semibold text-secondary-900">CV Templates</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-secondary-900 mb-4">
            Choose Your Perfect CV Template
          </h2>
          <p className="text-secondary-600 max-w-2xl mx-auto">
            Select from our professionally designed templates to create a standout CV that gets you noticed.
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {layouts.map((layout) => (
            <div 
              key={layout.id} 
              className="bg-white rounded-lg shadow-sm border border-secondary-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className={`flex items-center justify-center w-16 h-16 ${getLayoutBgColor(layout.id)} rounded-lg mx-auto mb-4`}>
                  {getLayoutIcon(layout.id)}
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 text-center mb-2">
                  {layout.name}
                </h3>
                <p className="text-secondary-600 text-center mb-4">
                  {layout.description}
                </p>
                <div className="bg-secondary-50 rounded-lg p-4 mb-4">
                  <div className="text-center">
                    <div className="text-4xl mb-2">{getLayoutEmoji(layout.id)}</div>
                    <p className="text-sm text-secondary-500">{layout.name} Layout</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleCreateCV(layout.id)}
                  disabled={creatingCV === layout.id}
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {creatingCV === layout.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Use This Template</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-8">
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">
              More Templates Coming Soon!
            </h3>
            <p className="text-secondary-600">
              We're working on adding more beautiful templates. Stay tuned for updates!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesPage;

