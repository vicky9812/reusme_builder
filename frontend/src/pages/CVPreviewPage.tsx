/**
 * CV Preview Page Component
 * @fileoverview CV preview page component for CV Builder frontend
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-18
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Share2, Edit, Globe, Mail, Phone, MapPin, Calendar, Award, Briefcase, GraduationCap, Code, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService } from '../services/api';
import { CVData } from '../types';

const CVPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCV();
    }
  }, [id]);

  const fetchCV = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getCV(id!);
      if (response.success && response.data) {
        setCvData(response.data);
      } else {
        toast.error('Failed to load CV');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Fetch CV error:', error);
      toast.error('Failed to load CV');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!cvData) return;
    
    try {
      setIsDownloading(true);
      await apiService.downloadCV(cvData.cv.id);
      toast.success('CV download initiated');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error('Failed to download CV');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!cvData) return;
    
    try {
      await apiService.shareCV(cvData.cv.id, { platform: 'email' });
      toast.success('CV shared successfully');
    } catch (error: any) {
      console.error('Share error:', error);
      toast.error('Failed to share CV');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  const getLayoutStyles = (layout: string) => {
    switch (layout.toLowerCase()) {
      case 'modern':
        return {
          container: 'bg-gradient-to-br from-blue-50 to-indigo-100',
          header: 'bg-white shadow-lg',
          card: 'bg-white shadow-md',
          accent: 'text-blue-600',
          accentBg: 'bg-blue-100'
        };
      case 'classic':
        return {
          container: 'bg-gradient-to-br from-gray-50 to-slate-100',
          header: 'bg-white shadow-lg',
          card: 'bg-white shadow-md',
          accent: 'text-gray-700',
          accentBg: 'bg-gray-100'
        };
      case 'creative':
        return {
          container: 'bg-gradient-to-br from-purple-50 to-pink-100',
          header: 'bg-white shadow-lg',
          card: 'bg-white shadow-md',
          accent: 'text-purple-600',
          accentBg: 'bg-purple-100'
        };
      default:
        return {
          container: 'bg-gradient-to-br from-gray-50 to-slate-100',
          header: 'bg-white shadow-lg',
          card: 'bg-white shadow-md',
          accent: 'text-gray-700',
          accentBg: 'bg-gray-100'
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading CV...</p>
        </div>
      </div>
    );
  }

  if (!cvData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-secondary-900 mb-4">CV Not Found</h2>
          <p className="text-secondary-600 mb-6">The CV you're looking for doesn't exist or you don't have permission to view it.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const styles = getLayoutStyles(cvData.cv.layout);

  return (
    <div className={`min-h-screen ${styles.container}`}>
      {/* Header */}
      <header className={`${styles.header} border-b border-gray-200`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-secondary-600 hover:text-secondary-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-secondary-300"></div>
              <h1 className="text-xl font-semibold text-secondary-900">{cvData.cv.title}</h1>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/cv-editor/${cvData.cv.id}`)}
                className="flex items-center space-x-2 px-3 py-2 border border-secondary-300 rounded-lg hover:border-secondary-400 hover:bg-secondary-50 transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center space-x-2 px-3 py-2 border border-secondary-300 rounded-lg hover:border-secondary-400 hover:bg-secondary-50 transition-colors disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>{isDownloading ? 'Generating...' : 'Download'}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-3 py-2 border border-secondary-300 rounded-lg hover:border-secondary-400 hover:bg-secondary-50 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CV Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`${styles.card} rounded-lg overflow-hidden`}>
          {/* CV Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-8">
            <div className="flex items-center space-x-6">
              {cvData.basic_details.profile_image_url && (
                <img
                  src={cvData.basic_details.profile_image_url}
                  alt={cvData.basic_details.full_name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{cvData.basic_details.full_name}</h1>
                <div className="flex items-center space-x-4 text-primary-100">
                  <div className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>{cvData.basic_details.email}</span>
                  </div>
                  {cvData.basic_details.phone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="h-4 w-4" />
                      <span>{cvData.basic_details.phone}</span>
                    </div>
                  )}
                  {cvData.basic_details.address && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{cvData.basic_details.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Introduction */}
            {cvData.basic_details.introduction && (
              <div className="mb-8">
                <h2 className={`text-2xl font-bold ${styles.accent} mb-4 flex items-center`}>
                  <span className={`w-8 h-8 ${styles.accentBg} rounded-full flex items-center justify-center mr-3`}>
                    <Award className="h-4 w-4" />
                  </span>
                  About Me
                </h2>
                <p className="text-gray-700 leading-relaxed">{cvData.basic_details.introduction}</p>
              </div>
            )}

            {/* Experience */}
            {cvData.experience.length > 0 && (
              <div className="mb-8">
                <h2 className={`text-2xl font-bold ${styles.accent} mb-4 flex items-center`}>
                  <span className={`w-8 h-8 ${styles.accentBg} rounded-full flex items-center justify-center mr-3`}>
                    <Briefcase className="h-4 w-4" />
                  </span>
                  Experience
                </h2>
                <div className="space-y-6">
                  {cvData.experience.map((exp) => (
                    <div key={exp.id} className="border-l-4 border-primary-200 pl-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{exp.position}</h3>
                          <p className="text-primary-600 font-medium">{exp.organization_name}</p>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {formatDate(exp.joining_date)} - {exp.is_current ? 'Present' : exp.leaving_date ? formatDate(exp.leaving_date) : 'N/A'}
                            </span>
                          </div>
                          {exp.joining_location && (
                            <div className="flex items-center space-x-1 mt-1">
                              <MapPin className="h-4 w-4" />
                              <span>{exp.joining_location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {exp.description && (
                        <p className="text-gray-700 mb-2">{exp.description}</p>
                      )}
                      {exp.technologies && exp.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {exp.technologies.map((tech, index) => (
                            <span key={index} className={`px-2 py-1 ${styles.accentBg} ${styles.accent} rounded-full text-sm`}>
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {cvData.education.length > 0 && (
              <div className="mb-8">
                <h2 className={`text-2xl font-bold ${styles.accent} mb-4 flex items-center`}>
                  <span className={`w-8 h-8 ${styles.accentBg} rounded-full flex items-center justify-center mr-3`}>
                    <GraduationCap className="h-4 w-4" />
                  </span>
                  Education
                </h2>
                <div className="space-y-4">
                  {cvData.education.map((edu) => (
                    <div key={edu.id} className="border-l-4 border-primary-200 pl-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{edu.degree_name}</h3>
                          <p className="text-primary-600 font-medium">{edu.institution}</p>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {formatDate(edu.start_date)} - {edu.is_current ? 'Present' : edu.end_date ? formatDate(edu.end_date) : 'N/A'}
                            </span>
                          </div>
                          {(edu.percentage || edu.cgpa) && (
                            <div className="mt-1">
                              {edu.percentage && <span>Percentage: {edu.percentage}%</span>}
                              {edu.cgpa && <span>CGPA: {edu.cgpa}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      {edu.description && (
                        <p className="text-gray-700">{edu.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {cvData.projects.length > 0 && (
              <div className="mb-8">
                <h2 className={`text-2xl font-bold ${styles.accent} mb-4 flex items-center`}>
                  <span className={`w-8 h-8 ${styles.accentBg} rounded-full flex items-center justify-center mr-3`}>
                    <Code className="h-4 w-4" />
                  </span>
                  Projects
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {cvData.projects.map((project) => (
                    <div key={project.id} className={`${styles.card} p-6`}>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                        <div className="flex space-x-2">
                          {project.project_url && (
                            <a
                              href={project.project_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          {project.github_url && (
                            <a
                              href={project.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-gray-700"
                            >
                              <Code className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                      {project.description && (
                        <p className="text-gray-700 mb-3">{project.description}</p>
                      )}
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.map((tech, index) => (
                            <span key={index} className={`px-2 py-1 ${styles.accentBg} ${styles.accent} rounded-full text-sm`}>
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {cvData.skills.length > 0 && (
              <div className="mb-8">
                <h2 className={`text-2xl font-bold ${styles.accent} mb-4 flex items-center`}>
                  <span className={`w-8 h-8 ${styles.accentBg} rounded-full flex items-center justify-center mr-3`}>
                    <Award className="h-4 w-4" />
                  </span>
                  Skills
                </h2>
                <div className="space-y-4">
                  {['technical', 'interpersonal', 'language'].map((category) => {
                    const categorySkills = cvData.skills.filter(skill => skill.category === category);
                    if (categorySkills.length === 0) return null;
                    
                    return (
                      <div key={category}>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 capitalize">{category} Skills</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categorySkills.map((skill) => (
                            <div key={skill.id} className="flex items-center space-x-3">
                              <span className="text-sm font-medium text-gray-700 w-24">{skill.skill_name}</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${styles.accentBg}`}
                                  style={{ width: `${skill.proficiency_percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 w-12">{skill.proficiency_percentage}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Social Profiles */}
            {cvData.social_profiles.length > 0 && (
              <div className="mb-8">
                <h2 className={`text-2xl font-bold ${styles.accent} mb-4 flex items-center`}>
                  <span className={`w-8 h-8 ${styles.accentBg} rounded-full flex items-center justify-center mr-3`}>
                    <Globe className="h-4 w-4" />
                  </span>
                  Social Profiles
                </h2>
                <div className="flex flex-wrap gap-4">
                  {cvData.social_profiles.map((profile) => (
                    <a
                      key={profile.id}
                      href={profile.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center space-x-2 px-4 py-2 ${styles.accentBg} ${styles.accent} rounded-lg hover:opacity-80 transition-opacity`}
                    >
                      <Globe className="h-4 w-4" />
                      <span>{profile.platform_name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVPreviewPage;


