/**
 * Dashboard Page Component
 * @fileoverview Dashboard page component for CV Builder frontend
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-17
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  FileText, 
  Plus, 
  Edit, 
  Download, 
  Share, 
  Eye, 
  Trash2, 
  Settings,
  LogOut,
  Calendar,
  TrendingUp,
  Award,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface CV {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  layout: 'modern' | 'classic' | 'creative';
  created_at: string;
  updated_at: string;
  download_count: number;
  share_count: number;
}

interface DashboardStats {
  total_cvs: number;
  published_cvs: number;
  draft_cvs: number;
  total_downloads: number;
  total_shares: number;
  total_views: number;
}

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingCV, setIsCreatingCV] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [cvsResponse, statsResponse] = await Promise.all([
        apiService.getCVs(),
        apiService.getDashboardStats()
      ]);
      
      if (cvsResponse.success && cvsResponse.data) {
        setCvs(cvsResponse.data);
      }
      
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (error: any) {
      console.error('Dashboard data fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCV = async () => {
    try {
      setIsCreatingCV(true);
        const response = await apiService.createCV({
          title: 'My New CV',
          layout: 'modern',
          basic_details: {
            full_name: user?.username || '',
            email: user?.email || '',
            phone: '',
            address: '',
            introduction: '',
            profile_image_url: ''
          }
        });

      if (response.success && response.data) {
        toast.success('CV created successfully!');
        navigate(`/cv-editor/${response.data.cv.id}`);
      }
    } catch (error: any) {
      console.error('Create CV error:', error);
      toast.error('Failed to create CV');
    } finally {
      setIsCreatingCV(false);
    }
  };

  const handleDeleteCV = async (cvId: string) => {
    if (!window.confirm('Are you sure you want to delete this CV?')) {
      return;
    }

    try {
      const response = await apiService.deleteCV(cvId);
      if (response.success) {
        toast.success('CV deleted successfully');
        fetchDashboardData();
      }
    } catch (error: any) {
      console.error('Delete CV error:', error);
      toast.error('Failed to delete CV');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLayoutIcon = (layout: string) => {
    switch (layout) {
      case 'MODERN':
        return '🎨';
      case 'CLASSIC':
        return '📄';
      case 'CREATIVE':
        return '✨';
      default:
        return '📄';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading dashboard...</p>
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
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">CV Builder</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-secondary-500" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-secondary-700">
                      {user?.username || 'Loading...'}
                    </span>
                    <span className="text-xs text-secondary-500 capitalize">
                      {user?.role === 'premium' ? 'Premium Plan' : user?.role === 'admin' ? 'Admin Plan' : user?.role ? 'Free Plan' : 'Loading...'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-secondary-600 hover:text-secondary-800 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-secondary-900 mb-2">
            Welcome back, {user?.username || 'User'}! 👋
          </h2>
          <p className="text-secondary-600">
            Manage your CVs and track your progress
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-secondary-200">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <FileText className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Total CVs</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats.total_cvs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-secondary-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Published</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats.published_cvs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-secondary-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Download className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Downloads</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats.total_downloads}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-secondary-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Share className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary-600">Shares</p>
                  <p className="text-2xl font-bold text-secondary-900">{stats.total_shares}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className={`bg-white rounded-lg shadow-sm p-6 border border-secondary-200 mb-8 ${cvs.length === 0 ? 'border-primary-200 bg-primary-50' : ''}`}>
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">
            {cvs.length === 0 ? '🚀 Get Started' : 'Quick Actions'}
          </h3>
          {cvs.length === 0 && (
            <p className="text-secondary-600 mb-4">
              Create your first CV to showcase your skills and experience
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={handleCreateCV}
              disabled={isCreatingCV}
              className={`flex items-center justify-center space-x-2 p-4 rounded-lg transition-colors disabled:opacity-50 ${
                cvs.length === 0 
                  ? 'bg-primary-600 text-white hover:bg-primary-700 border-2 border-primary-600' 
                  : 'border-2 border-dashed border-primary-300 hover:border-primary-400 hover:bg-primary-50'
              }`}
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">
                {isCreatingCV ? 'Creating...' : (cvs.length === 0 ? 'Create Your First CV' : 'Create New CV')}
              </span>
            </button>

            <Link
              to="/templates"
              className="flex items-center justify-center space-x-2 p-4 border border-secondary-300 rounded-lg hover:border-secondary-400 hover:bg-secondary-50 transition-colors"
            >
              <Award className="h-5 w-5 text-secondary-600" />
              <span className="text-secondary-600 font-medium">Browse Templates</span>
            </Link>

            <Link
              to="/settings"
              className="flex items-center justify-center space-x-2 p-4 border border-secondary-300 rounded-lg hover:border-secondary-400 hover:bg-secondary-50 transition-colors"
            >
              <Settings className="h-5 w-5 text-secondary-600" />
              <span className="text-secondary-600 font-medium">Settings</span>
            </Link>

            <Link
              to="/help"
              className="flex items-center justify-center space-x-2 p-4 border border-secondary-300 rounded-lg hover:border-secondary-400 hover:bg-secondary-50 transition-colors"
            >
              <Clock className="h-5 w-5 text-secondary-600" />
              <span className="text-secondary-600 font-medium">Help & Support</span>
            </Link>
          </div>
        </div>

        {/* CVs List */}
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
          <div className="px-6 py-4 border-b border-secondary-200">
            <h3 className="text-lg font-semibold text-secondary-900">Your CVs</h3>
          </div>

          {cvs.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-secondary-900 mb-2">No CVs yet</h4>
              <p className="text-secondary-600 mb-4">
                Create your first CV to get started
              </p>
              <button
                onClick={handleCreateCV}
                disabled={isCreatingCV}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>Create Your First CV</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-secondary-200">
              {cvs.map((cv) => (
                <div key={cv.id} className="p-6 hover:bg-secondary-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">{getLayoutIcon(cv.layout)}</div>
                      <div>
                        <h4 className="text-lg font-medium text-secondary-900">{cv.title}</h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(cv.status)}`}>
                            {cv.status}
                          </span>
                          <span className="text-sm text-secondary-500">
                            {cv.layout} Layout
                          </span>
                          <span className="text-sm text-secondary-500">
                            Updated {formatDate(cv.updated_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-4 text-sm text-secondary-500">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>0</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Download className="h-4 w-4" />
                          <span>{cv.download_count}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Share className="h-4 w-4" />
                          <span>{cv.share_count}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <Link
                          to={`/cv-editor/${cv.id}`}
                          className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit CV"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>

                        <Link
                          to={`/cv-preview/${cv.id}`}
                          className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Preview CV"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>

                        <button
                          onClick={() => handleDeleteCV(cv.id)}
                          className="p-2 text-secondary-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete CV"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
