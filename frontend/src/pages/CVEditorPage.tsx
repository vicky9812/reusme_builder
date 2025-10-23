/**
 * CV Editor Page Component
 * @fileoverview CV editor page component for CV Builder frontend
 * @author Vicky
 * @version 1.0.0
 * @since 2025-01-18
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Download, Share2, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiService } from '../services/api';
import { CV } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CVEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cvData, setCvData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [localStatus, setLocalStatus] = useState<string>('draft');

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
        setLocalStatus(response.data.cv.status);
      }
    } catch (error: any) {
      console.error('Fetch CV error:', error);
      toast.error('Failed to load CV');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!cvData) return;

    try {
      setIsSaving(true);
      
      // Ensure required fields have valid values
      const basicDetails = {
        full_name: cvData.basic_details.full_name?.trim() || '',
        email: cvData.basic_details.email?.trim() || '',
        phone: cvData.basic_details.phone?.trim() || '',
        address: cvData.basic_details.address?.trim() || '',
        introduction: cvData.basic_details.introduction?.trim() || '',
        profile_image_url: cvData.basic_details.profile_image_url?.trim() || ''
      };

      // Validate required fields
      if (!basicDetails.full_name) {
        toast.error('Full name is required');
        return;
      }
      if (!basicDetails.email) {
        toast.error('Email is required');
        return;
      }

      const response = await apiService.updateCV(cvData.cv.id, {
        title: cvData.cv.title,
        layout: cvData.cv.layout,
        status: 'draft',
        basic_details: basicDetails,
        education: cvData.education || [],
        experience: cvData.experience || [],
        projects: cvData.projects || [],
        skills: cvData.skills || [],
        social_profiles: cvData.social_profiles || []
      });

      if (response.success) {
        setLocalStatus('saved');
        toast.success('CV saved successfully!');
        // Refresh CV data to get latest from backend
        await fetchCV();
      }
    } catch (error: any) {
      console.error('Save CV error:', error);
      toast.error('Failed to save CV');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!cvData) return;

    try {
      setIsPublishing(true);
      
      // First save the CV to ensure all changes are saved
      const basicDetails = {
        full_name: cvData.basic_details.full_name?.trim() || '',
        email: cvData.basic_details.email?.trim() || '',
        phone: cvData.basic_details.phone?.trim() || '',
        address: cvData.basic_details.address?.trim() || '',
        introduction: cvData.basic_details.introduction?.trim() || '',
        profile_image_url: cvData.basic_details.profile_image_url?.trim() || ''
      };

      // Validate required fields
      if (!basicDetails.full_name) {
        toast.error('Full name is required to publish CV');
        return;
      }
      if (!basicDetails.email) {
        toast.error('Email is required to publish CV');
        return;
      }

      const response = await apiService.updateCV(cvData.cv.id, {
        title: cvData.cv.title,
        layout: cvData.cv.layout,
        status: 'published', // Change status to published
        basic_details: basicDetails,
        education: cvData.education || [],
        experience: cvData.experience || [],
        projects: cvData.projects || [],
        skills: cvData.skills || [],
        social_profiles: cvData.social_profiles || []
      });

      if (response.success) {
        setLocalStatus('published');
        toast.success('CV published successfully!');
        // Refresh CV data to get latest from backend
        await fetchCV();
      }
    } catch (error: any) {
      console.error('Publish CV error:', error);
      toast.error('Failed to publish CV');
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePreview = () => {
    const previewElement = document.getElementById('cv-preview');
    if (previewElement) {
      previewElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  const handleDownload = async () => {
    if (!cvData) return;

    try {
      setIsDownloading(true);
      toast.loading('Generating PDF...', { id: 'pdf-generation' });
      
      // First, increment download count via API
      try {
        await apiService.downloadCV(cvData.cv.id);
      } catch (apiError) {
        console.warn('Failed to track download:', apiError);
        // Continue with PDF generation even if tracking fails
      }
      
      // Create a temporary element for PDF generation
      const pdfElement = document.createElement('div');
      pdfElement.style.position = 'absolute';
      pdfElement.style.left = '-9999px';
      pdfElement.style.top = '0';
      pdfElement.style.width = '210mm'; // A4 width
      pdfElement.style.backgroundColor = 'white';
      pdfElement.style.padding = '20mm';
      pdfElement.style.fontFamily = 'Arial, sans-serif';
      pdfElement.style.fontSize = '12px';
      pdfElement.style.lineHeight = '1.4';
      
      // Build CV content
      pdfElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; margin-bottom: 10px; color: #333;">${cvData.cv.title}</h1>
          <p style="font-size: 14px; color: #666;">${cvData.cv.layout.charAt(0).toUpperCase() + cvData.cv.layout.slice(1)} Layout</p>
        </div>
        
          ${cvData.basic_details.introduction ? `
            <div style="margin-bottom: 25px;">
              <h2 style="font-size: 16px; margin-bottom: 10px; color: #333; border-bottom: 2px solid #007bff; padding-bottom: 5px;">Personal Summary</h2>
              <p style="text-align: justify; line-height: 1.6;">${cvData.basic_details.introduction}</p>
            </div>
          ` : ''}
        
        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 16px; margin-bottom: 10px; color: #333; border-bottom: 2px solid #007bff; padding-bottom: 5px;">Contact Information</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 20px;">
            ${cvData.basic_details.full_name ? `<p><strong>Name:</strong> ${cvData.basic_details.full_name}</p>` : ''}
            ${cvData.basic_details.email ? `<p><strong>Email:</strong> ${cvData.basic_details.email}</p>` : ''}
            ${cvData.basic_details.phone ? `<p><strong>Phone:</strong> ${cvData.basic_details.phone}</p>` : ''}
            ${cvData.basic_details.address ? `<p><strong>Address:</strong> ${cvData.basic_details.address}</p>` : ''}
          </div>
        </div>
        
        <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px;">
          <p>Crafted by Neosoft | Developed by Vicky</p>
        </div>
      `;
      
      document.body.appendChild(pdfElement);
      
      // Generate PDF with cross-browser compatibility
      const canvas = await html2canvas(pdfElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: pdfElement.offsetWidth,
        height: pdfElement.offsetHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Clean up
      document.body.removeChild(pdfElement);
      
      // Download PDF
      pdf.save(`${cvData.cv.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_cv.pdf`);
      
      toast.success('PDF downloaded successfully!', { id: 'pdf-generation' });
      
      // Refresh CV data to get updated download count
      await fetchCV();
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF', { id: 'pdf-generation' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!cvData) return;

    try {
      const shareData = {
        title: cvData.cv.title,
        text: `Check out my CV: ${cvData.cv.title}`,
        url: window.location.href
      };

      // Check if Web Share API is supported (mobile browsers)
      if (navigator.share && typeof navigator.share === 'function') {
        await navigator.share(shareData);
        toast.success('CV shared successfully!');
        return;
      }

      // Check if clipboard API is supported
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('CV link copied to clipboard!');
        return;
      }

      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareData.url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        toast.success('CV link copied to clipboard!');
      } catch (fallbackError) {
        console.error('Fallback copy error:', fallbackError);
        toast.error('Unable to copy link. Please copy manually: ' + shareData.url);
      } finally {
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to share CV');
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
          <p className="text-secondary-600 mb-6">The CV you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Dashboard
          </button>
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
                onClick={handlePreview}
                className="flex items-center space-x-2 px-3 py-2 border border-secondary-300 rounded-lg hover:border-secondary-400 hover:bg-secondary-50 transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span>Preview</span>
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

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>

              <button
                onClick={handlePublish}
                disabled={isPublishing || localStatus === 'published'}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Globe className="h-4 w-4" />
                <span>{isPublishing ? 'Publishing...' : localStatus === 'published' ? 'Published' : 'Publish'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Editor Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
              <h2 className="text-lg font-semibold text-secondary-900 mb-6">CV Editor</h2>
              
              {/* Basic Info */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    CV Title
                  </label>
                  <input
                    type="text"
                    value={cvData.cv.title}
                    onChange={(e) => {
                      setCvData({ ...cvData, cv: { ...cvData.cv, title: e.target.value } });
                      // Reset status to draft when user makes changes
                      if (localStatus === 'saved' || localStatus === 'published') {
                        setLocalStatus('draft');
                      }
                    }}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter CV title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Layout
                  </label>
                  <select
                  value={cvData.cv.layout}
                  onChange={(e) => {
                    setCvData({ ...cvData, cv: { ...cvData.cv, layout: e.target.value as any } });
                    // Reset status to draft when user makes changes
                    if (localStatus === 'saved' || localStatus === 'published') {
                      setLocalStatus('draft');
                    }
                  }}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="modern">Modern</option>
                    <option value="classic">Classic</option>
                    <option value="creative">Creative</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Personal Summary
                  </label>
                  <textarea
                    value={cvData.basic_details.introduction || ''}
                    onChange={(e) => {
                      setCvData({
                        ...cvData,
                        basic_details: { ...cvData.basic_details, introduction: e.target.value }
                      });
                      // Reset status to draft when user makes changes
                      if (localStatus === 'saved' || localStatus === 'published') {
                        setLocalStatus('draft');
                      }
                    }}
                    rows={4}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Write a brief summary about yourself..."
                  />
                </div>

                {/* Basic Details */}
                <div className="border-t border-secondary-200 pt-6">
                  <h3 className="text-md font-semibold text-secondary-900 mb-4">Contact Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={cvData.basic_details.full_name || ''}
                        onChange={(e) => {
                          setCvData({
                            ...cvData,
                            basic_details: { ...cvData.basic_details, full_name: e.target.value }
                          });
                          if (localStatus === 'saved' || localStatus === 'published') {
                            setLocalStatus('draft');
                          }
                        }}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={cvData.basic_details.email || ''}
                        onChange={(e) => {
                          setCvData({
                            ...cvData,
                            basic_details: { ...cvData.basic_details, email: e.target.value }
                          });
                          if (localStatus === 'saved' || localStatus === 'published') {
                            setLocalStatus('draft');
                          }
                        }}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter your email"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={cvData.basic_details.phone || ''}
                        onChange={(e) => {
                          setCvData({
                            ...cvData,
                            basic_details: { ...cvData.basic_details, phone: e.target.value }
                          });
                          if (localStatus === 'saved' || localStatus === 'published') {
                            setLocalStatus('draft');
                          }
                        }}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Address</label>
                      <input
                        type="text"
                        value={cvData.basic_details.address || ''}
                        onChange={(e) => {
                          setCvData({
                            ...cvData,
                            basic_details: { ...cvData.basic_details, address: e.target.value }
                          });
                          if (localStatus === 'saved' || localStatus === 'published') {
                            setLocalStatus('draft');
                          }
                        }}
                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Enter your address"
                      />
                    </div>
                  </div>
                </div>

                {/* Education Section */}
                <div className="border-t border-secondary-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-semibold text-secondary-900">Education</h3>
                    <button
                      onClick={() => {
                        const newEducation = {
                          id: `temp-${Date.now()}`,
                          cv_id: cvData.cv.id,
                          degree_name: '',
                          institution: '',
                          percentage: 0,
                          cgpa: 0,
                          start_date: '',
                          end_date: '',
                          is_current: false,
                          description: ''
                        };
                        setCvData({
                          ...cvData,
                          education: [...(cvData.education || []), newEducation]
                        });
                        if (localStatus === 'saved' || localStatus === 'published') {
                          setLocalStatus('draft');
                        }
                      }}
                      className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Add Education
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {(cvData.education || []).map((edu: any, index: number) => (
                      <div key={edu.id || index} className="border border-secondary-200 rounded-lg p-4 bg-secondary-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Degree Name</label>
                            <input
                              type="text"
                              value={edu.degree_name || ''}
                              onChange={(e) => {
                                const newEducation = [...(cvData.education || [])];
                                newEducation[index] = { ...edu, degree_name: e.target.value };
                                setCvData({ ...cvData, education: newEducation });
                                if (localStatus === 'saved' || localStatus === 'published') {
                                  setLocalStatus('draft');
                                }
                              }}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="e.g., Bachelor of Technology"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Institution</label>
                            <input
                              type="text"
                              value={edu.institution || ''}
                              onChange={(e) => {
                                const newEducation = [...(cvData.education || [])];
                                newEducation[index] = { ...edu, institution: e.target.value };
                                setCvData({ ...cvData, education: newEducation });
                                if (localStatus === 'saved' || localStatus === 'published') {
                                  setLocalStatus('draft');
                                }
                              }}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="e.g., University Name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Start Date</label>
                            <input
                              type="date"
                              value={edu.start_date || ''}
                              onChange={(e) => {
                                const newEducation = [...(cvData.education || [])];
                                newEducation[index] = { ...edu, start_date: e.target.value };
                                setCvData({ ...cvData, education: newEducation });
                                if (localStatus === 'saved' || localStatus === 'published') {
                                  setLocalStatus('draft');
                                }
                              }}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">End Date</label>
                            <input
                              type="date"
                              value={edu.end_date || ''}
                              onChange={(e) => {
                                const newEducation = [...(cvData.education || [])];
                                newEducation[index] = { ...edu, end_date: e.target.value };
                                setCvData({ ...cvData, education: newEducation });
                                if (localStatus === 'saved' || localStatus === 'published') {
                                  setLocalStatus('draft');
                                }
                              }}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Percentage</label>
                            <input
                              type="number"
                              value={edu.percentage || ''}
                              onChange={(e) => {
                                const newEducation = [...(cvData.education || [])];
                                newEducation[index] = { ...edu, percentage: parseFloat(e.target.value) || 0 };
                                setCvData({ ...cvData, education: newEducation });
                                if (localStatus === 'saved' || localStatus === 'published') {
                                  setLocalStatus('draft');
                                }
                              }}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="e.g., 85.5"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">CGPA</label>
                            <input
                              type="number"
                              step="0.01"
                              value={edu.cgpa || ''}
                              onChange={(e) => {
                                const newEducation = [...(cvData.education || [])];
                                newEducation[index] = { ...edu, cgpa: parseFloat(e.target.value) || 0 };
                                setCvData({ ...cvData, education: newEducation });
                                if (localStatus === 'saved' || localStatus === 'published') {
                                  setLocalStatus('draft');
                                }
                              }}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="e.g., 8.5"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
                          <textarea
                            value={edu.description || ''}
                            onChange={(e) => {
                              const newEducation = [...(cvData.education || [])];
                              newEducation[index] = { ...edu, description: e.target.value };
                              setCvData({ ...cvData, education: newEducation });
                              if (localStatus === 'saved' || localStatus === 'published') {
                                setLocalStatus('draft');
                              }
                            }}
                            rows={2}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Additional details about your education..."
                          />
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => {
                              const newEducation = (cvData.education || []).filter((_: any, i: number) => i !== index);
                              setCvData({ ...cvData, education: newEducation });
                              if (localStatus === 'saved' || localStatus === 'published') {
                                setLocalStatus('draft');
                              }
                            }}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience Section */}
                <div className="border-t border-secondary-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-semibold text-secondary-900">Work Experience</h3>
                    <button
                      onClick={() => {
                        const newExperience = {
                          id: `temp-${Date.now()}`,
                          cv_id: cvData.cv.id,
                          organization_name: '',
                          position: '',
                          joining_location: '',
                          ctc: '',
                          joining_date: '',
                          leaving_date: '',
                          is_current: false,
                          technologies: [],
                          description: ''
                        };
                        setCvData({
                          ...cvData,
                          experience: [...(cvData.experience || []), newExperience]
                        });
                        if (localStatus === 'saved' || localStatus === 'published') {
                          setLocalStatus('draft');
                        }
                      }}
                      className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Add Experience
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {(cvData.experience || []).map((exp: any, index: number) => (
                      <div key={exp.id || index} className="border border-secondary-200 rounded-lg p-4 bg-secondary-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Organization</label>
                            <input
                              type="text"
                              value={exp.organization_name || ''}
                              onChange={(e) => {
                                const newExperience = [...(cvData.experience || [])];
                                newExperience[index] = { ...exp, organization_name: e.target.value };
                                setCvData({ ...cvData, experience: newExperience });
                                if (localStatus === 'saved' || localStatus === 'published') {
                                  setLocalStatus('draft');
                                }
                              }}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="e.g., Company Name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Position</label>
                            <input
                              type="text"
                              value={exp.position || ''}
                              onChange={(e) => {
                                const newExperience = [...(cvData.experience || [])];
                                newExperience[index] = { ...exp, position: e.target.value };
                                setCvData({ ...cvData, experience: newExperience });
                                if (localStatus === 'saved' || localStatus === 'published') {
                                  setLocalStatus('draft');
                                }
                              }}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="e.g., Software Developer"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Joining Date</label>
                            <input
                              type="date"
                              value={exp.joining_date || ''}
                              onChange={(e) => {
                                const newExperience = [...(cvData.experience || [])];
                                newExperience[index] = { ...exp, joining_date: e.target.value };
                                setCvData({ ...cvData, experience: newExperience });
                                if (localStatus === 'saved' || localStatus === 'published') {
                                  setLocalStatus('draft');
                                }
                              }}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Leaving Date</label>
                            <input
                              type="date"
                              value={exp.leaving_date || ''}
                              onChange={(e) => {
                                const newExperience = [...(cvData.experience || [])];
                                newExperience[index] = { ...exp, leaving_date: e.target.value };
                                setCvData({ ...cvData, experience: newExperience });
                                if (localStatus === 'saved' || localStatus === 'published') {
                                  setLocalStatus('draft');
                                }
                              }}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Location</label>
                            <input
                              type="text"
                              value={exp.joining_location || ''}
                              onChange={(e) => {
                                const newExperience = [...(cvData.experience || [])];
                                newExperience[index] = { ...exp, joining_location: e.target.value };
                                setCvData({ ...cvData, experience: newExperience });
                                if (localStatus === 'saved' || localStatus === 'published') {
                                  setLocalStatus('draft');
                                }
                              }}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="e.g., New York, NY"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">CTC</label>
                            <input
                              type="text"
                              value={exp.ctc || ''}
                              onChange={(e) => {
                                const newExperience = [...(cvData.experience || [])];
                                newExperience[index] = { ...exp, ctc: e.target.value };
                                setCvData({ ...cvData, experience: newExperience });
                                if (localStatus === 'saved' || localStatus === 'published') {
                                  setLocalStatus('draft');
                                }
                              }}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="e.g., $80,000"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
                          <textarea
                            value={exp.description || ''}
                            onChange={(e) => {
                              const newExperience = [...(cvData.experience || [])];
                              newExperience[index] = { ...exp, description: e.target.value };
                              setCvData({ ...cvData, experience: newExperience });
                              if (localStatus === 'saved' || localStatus === 'published') {
                                setLocalStatus('draft');
                              }
                            }}
                            rows={3}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Describe your role and achievements..."
                          />
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => {
                              const newExperience = (cvData.experience || []).filter((_: any, i: number) => i !== index);
                              setCvData({ ...cvData, experience: newExperience });
                              if (localStatus === 'saved' || localStatus === 'published') {
                                setLocalStatus('draft');
                              }
                            }}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills Section */}
                <div className="border-t border-secondary-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-semibold text-secondary-900">Skills</h3>
                    <button
                      onClick={() => {
                        const newSkill = {
                          id: `temp-${Date.now()}`,
                          cv_id: cvData.cv.id,
                          skill_name: '',
                          proficiency_percentage: 0,
                          category: 'technical'
                        };
                        setCvData({
                          ...cvData,
                          skills: [...(cvData.skills || []), newSkill]
                        });
                        if (localStatus === 'saved' || localStatus === 'published') {
                          setLocalStatus('draft');
                        }
                      }}
                      className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Add Skill
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {(cvData.skills || []).map((skill: any, index: number) => (
                      <div key={skill.id || index} className="border border-secondary-200 rounded-lg p-4 bg-secondary-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Skill Name</label>
                            <input
                              type="text"
                              value={skill.skill_name || ''}
                              onChange={(e) => {
                                const newSkills = [...(cvData.skills || [])];
                                newSkills[index] = { ...skill, skill_name: e.target.value };
                                setCvData({ ...cvData, skills: newSkills });
                                if (localStatus === 'saved' || localStatus === 'published') {
                                  setLocalStatus('draft');
                                }
                              }}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="e.g., JavaScript"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Category</label>
                            <select
                              value={skill.category || 'technical'}
                              onChange={(e) => {
                                const newSkills = [...(cvData.skills || [])];
                                newSkills[index] = { ...skill, category: e.target.value };
                                setCvData({ ...cvData, skills: newSkills });
                                if (localStatus === 'saved' || localStatus === 'published') {
                                  setLocalStatus('draft');
                                }
                              }}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                              <option value="technical">Technical</option>
                              <option value="interpersonal">Interpersonal</option>
                              <option value="language">Language</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Proficiency (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={skill.proficiency_percentage || ''}
                              onChange={(e) => {
                                const newSkills = [...(cvData.skills || [])];
                                newSkills[index] = { ...skill, proficiency_percentage: parseInt(e.target.value) || 0 };
                                setCvData({ ...cvData, skills: newSkills });
                                if (localStatus === 'saved' || localStatus === 'published') {
                                  setLocalStatus('draft');
                                }
                              }}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="e.g., 85"
                            />
                          </div>
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => {
                              const newSkills = (cvData.skills || []).filter((_: any, i: number) => i !== index);
                              setCvData({ ...cvData, skills: newSkills });
                              if (localStatus === 'saved' || localStatus === 'published') {
                                setLocalStatus('draft');
                              }
                            }}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Projects Section */}
                <div className="border-t border-secondary-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-semibold text-secondary-900">Projects</h3>
                    <button
                      onClick={() => {
                        const newProject = {
                          id: `temp-${Date.now()}`,
                          cv_id: cvData.cv.id,
                          title: '',
                          team_size: 1,
                          duration: '',
                          technologies: [],
                          description: '',
                          project_url: '',
                          github_url: ''
                        };
                        setCvData({
                          ...cvData,
                          projects: [...(cvData.projects || []), newProject]
                        });
                        if (localStatus === 'saved' || localStatus === 'published') {
                          setLocalStatus('draft');
                        }
                      }}
                      className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Add Project
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {(cvData.projects || []).map((project: any, index: number) => (
                      <div key={project.id || index} className="border border-secondary-200 rounded-lg p-4 bg-secondary-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Project Title</label>
                            <input
                              type="text"
                              value={project.title || ''}
                              onChange={(e) => {
                                const newProjects = [...(cvData.projects || [])];
                                newProjects[index] = { ...project, title: e.target.value };
                                setCvData({ ...cvData, projects: newProjects });
                                if (localStatus === 'saved' || localStatus === 'published') {
                                  setLocalStatus('draft');
                                }
                              }}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="e.g., E-commerce Website"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Team Size</label>
                            <input
                              type="number"
                              min="1"
                              value={project.team_size || ''}
                              onChange={(e) => {
                                const newProjects = [...(cvData.projects || [])];
                                newProjects[index] = { ...project, team_size: parseInt(e.target.value) || 1 };
                                setCvData({ ...cvData, projects: newProjects });
                                if (localStatus === 'saved' || localStatus === 'published') {
                                  setLocalStatus('draft');
                                }
                              }}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="e.g., 3"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Duration</label>
                            <input
                              type="text"
                              value={project.duration || ''}
                              onChange={(e) => {
                                const newProjects = [...(cvData.projects || [])];
                                newProjects[index] = { ...project, duration: e.target.value };
                                setCvData({ ...cvData, projects: newProjects });
                                if (localStatus === 'saved' || localStatus === 'published') {
                                  setLocalStatus('draft');
                                }
                              }}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="e.g., 3 months"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Project URL</label>
                            <input
                              type="url"
                              value={project.project_url || ''}
                              onChange={(e) => {
                                const newProjects = [...(cvData.projects || [])];
                                newProjects[index] = { ...project, project_url: e.target.value };
                                setCvData({ ...cvData, projects: newProjects });
                                if (localStatus === 'saved' || localStatus === 'published') {
                                  setLocalStatus('draft');
                                }
                              }}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="e.g., https://project.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">GitHub URL</label>
                            <input
                              type="url"
                              value={project.github_url || ''}
                              onChange={(e) => {
                                const newProjects = [...(cvData.projects || [])];
                                newProjects[index] = { ...project, github_url: e.target.value };
                                setCvData({ ...cvData, projects: newProjects });
                                if (localStatus === 'saved' || localStatus === 'published') {
                                  setLocalStatus('draft');
                                }
                              }}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="e.g., https://github.com/user/project"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
                          <textarea
                            value={project.description || ''}
                            onChange={(e) => {
                              const newProjects = [...(cvData.projects || [])];
                              newProjects[index] = { ...project, description: e.target.value };
                              setCvData({ ...cvData, projects: newProjects });
                              if (localStatus === 'saved' || localStatus === 'published') {
                                setLocalStatus('draft');
                              }
                            }}
                            rows={3}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Describe your project..."
                          />
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => {
                              const newProjects = (cvData.projects || []).filter((_: any, i: number) => i !== index);
                              setCvData({ ...cvData, projects: newProjects });
                              if (localStatus === 'saved' || localStatus === 'published') {
                                setLocalStatus('draft');
                              }
                            }}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Social Profiles Section */}
                <div className="border-t border-secondary-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-semibold text-secondary-900">Social Profiles</h3>
                    <button
                      onClick={() => {
                        const newSocialProfile = {
                          id: `temp-${Date.now()}`,
                          cv_id: cvData.cv.id,
                          platform_name: '',
                          profile_url: '',
                          is_public: true
                        };
                        setCvData({
                          ...cvData,
                          social_profiles: [...(cvData.social_profiles || []), newSocialProfile]
                        });
                        if (localStatus === 'saved' || localStatus === 'published') {
                          setLocalStatus('draft');
                        }
                      }}
                      className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Add Social Profile
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {(cvData.social_profiles || []).map((profile: any, index: number) => (
                      <div key={profile.id || index} className="border border-secondary-200 rounded-lg p-4 bg-secondary-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Platform</label>
                            <input
                              type="text"
                              value={profile.platform_name || ''}
                              onChange={(e) => {
                                const newSocialProfiles = [...(cvData.social_profiles || [])];
                                newSocialProfiles[index] = { ...profile, platform_name: e.target.value };
                                setCvData({ ...cvData, social_profiles: newSocialProfiles });
                                if (localStatus === 'saved' || localStatus === 'published') {
                                  setLocalStatus('draft');
                                }
                              }}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="e.g., LinkedIn"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">Profile URL</label>
                            <input
                              type="url"
                              value={profile.profile_url || ''}
                              onChange={(e) => {
                                const newSocialProfiles = [...(cvData.social_profiles || [])];
                                newSocialProfiles[index] = { ...profile, profile_url: e.target.value };
                                setCvData({ ...cvData, social_profiles: newSocialProfiles });
                                if (localStatus === 'saved' || localStatus === 'published') {
                                  setLocalStatus('draft');
                                }
                              }}
                              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="e.g., https://linkedin.com/in/username"
                            />
                          </div>
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => {
                              const newSocialProfiles = (cvData.social_profiles || []).filter((_: any, i: number) => i !== index);
                              setCvData({ ...cvData, social_profiles: newSocialProfiles });
                              if (localStatus === 'saved' || localStatus === 'published') {
                                setLocalStatus('draft');
                              }
                            }}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1" id="cv-preview">
            <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">Preview</h3>
              <div className="border border-secondary-200 rounded-lg p-4 bg-secondary-50">
                <div className="text-center">
                  <div className="text-4xl mb-2">
                  {cvData.cv.layout === 'modern' && '🎨'}
                  {cvData.cv.layout === 'classic' && '📄'}
                  {cvData.cv.layout === 'creative' && '✨'}
                  </div>
                  <h4 className="font-semibold text-secondary-900">{cvData.cv.title}</h4>
                  <p className="text-sm text-secondary-600 mt-1">{cvData.cv.layout} Layout</p>
                  
                  {/* Contact Information Preview */}
                  <div className="mt-4 p-3 bg-white rounded border border-secondary-200">
                    <h5 className="text-sm font-semibold text-secondary-700 mb-2">Contact Information</h5>
                    <div className="text-xs text-secondary-600 text-left space-y-1">
                      <p><strong>Name:</strong> {cvData.basic_details.full_name || 'Not provided'}</p>
                      <p><strong>Email:</strong> {cvData.basic_details.email || 'Not provided'}</p>
                      {cvData.basic_details.phone && <p><strong>Phone:</strong> {cvData.basic_details.phone}</p>}
                      {cvData.basic_details.address && <p><strong>Address:</strong> {cvData.basic_details.address}</p>}
                    </div>
                  </div>

                  {/* Personal Summary Preview */}
                  {cvData.basic_details.introduction && (
                    <div className="mt-4 p-3 bg-white rounded border border-secondary-200">
                      <h5 className="text-sm font-semibold text-secondary-700 mb-2">Personal Summary</h5>
                      <p className="text-xs text-secondary-600 text-left leading-relaxed">
                        {cvData.basic_details.introduction}
                      </p>
                    </div>
                  )}

                  {/* Education Preview */}
                  {cvData.education && cvData.education.length > 0 && (
                    <div className="mt-4 p-3 bg-white rounded border border-secondary-200">
                      <h5 className="text-sm font-semibold text-secondary-700 mb-2">Education</h5>
                      <div className="text-xs text-secondary-600 text-left space-y-2">
                        {cvData.education.map((edu: any, index: number) => (
                          <div key={index} className="border-l-2 border-primary-200 pl-2">
                            <p><strong>{edu.degree_name || 'Degree'}</strong></p>
                            <p>{edu.institution || 'Institution'}</p>
                            {(edu.percentage || edu.cgpa) && (
                              <p>{edu.percentage ? `${edu.percentage}%` : `CGPA: ${edu.cgpa}`}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience Preview */}
                  {cvData.experience && cvData.experience.length > 0 && (
                    <div className="mt-4 p-3 bg-white rounded border border-secondary-200">
                      <h5 className="text-sm font-semibold text-secondary-700 mb-2">Work Experience</h5>
                      <div className="text-xs text-secondary-600 text-left space-y-2">
                        {cvData.experience.map((exp: any, index: number) => (
                          <div key={index} className="border-l-2 border-primary-200 pl-2">
                            <p><strong>{exp.position || 'Position'}</strong></p>
                            <p>{exp.organization_name || 'Organization'}</p>
                            {exp.description && <p className="italic">{exp.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills Preview */}
                  {cvData.skills && cvData.skills.length > 0 && (
                    <div className="mt-4 p-3 bg-white rounded border border-secondary-200">
                      <h5 className="text-sm font-semibold text-secondary-700 mb-2">Skills</h5>
                      <div className="text-xs text-secondary-600 text-left">
                        <div className="flex flex-wrap gap-1">
                          {cvData.skills.map((skill: any, index: number) => (
                            <span key={index} className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-xs">
                              {skill.skill_name || 'Skill'} ({skill.proficiency_percentage || 0}%)
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Projects Preview */}
                  {cvData.projects && cvData.projects.length > 0 && (
                    <div className="mt-4 p-3 bg-white rounded border border-secondary-200">
                      <h5 className="text-sm font-semibold text-secondary-700 mb-2">Projects</h5>
                      <div className="text-xs text-secondary-600 text-left space-y-2">
                        {cvData.projects.map((project: any, index: number) => (
                          <div key={index} className="border-l-2 border-primary-200 pl-2">
                            <p><strong>{project.title || 'Project Title'}</strong></p>
                            {project.description && <p className="italic">{project.description}</p>}
                            {project.project_url && <p className="text-primary-600">🔗 Project Link</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Social Profiles Preview */}
                  {cvData.social_profiles && cvData.social_profiles.length > 0 && (
                    <div className="mt-4 p-3 bg-white rounded border border-secondary-200">
                      <h5 className="text-sm font-semibold text-secondary-700 mb-2">Social Profiles</h5>
                      <div className="text-xs text-secondary-600 text-left">
                        <div className="flex flex-wrap gap-1">
                          {cvData.social_profiles.map((profile: any, index: number) => (
                            <span key={index} className="px-2 py-1 bg-secondary-100 text-secondary-800 rounded text-xs">
                              {profile.platform_name || 'Platform'}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 text-xs text-secondary-500">
                    <p>Status: {localStatus === 'saved' ? 'Saved' : localStatus === 'draft' ? 'In Draft' : localStatus === 'published' ? 'Published' : localStatus}</p>
                    <p>Created: {new Date(cvData.cv.created_at).toLocaleDateString()}</p>
                    {cvData.cv.download_count > 0 && (
                      <p>Downloads: {cvData.cv.download_count}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVEditorPage;
