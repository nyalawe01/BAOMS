import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { X, Download, FileText } from 'lucide-react';
import DynamicSidebar from './DynamicSidebar';
import TopUtilityHeader from './TopUtilityHeader';
import DashboardContent from './DashboardContent';
import LoginView from '../views/LoginView';
import ErrorBoundary from './ErrorBoundary';

export default function AppShell() {
  const { user, loading } = useAuth();
  const { activePreviewDoc, setActivePreviewDoc } = useProject();
  const [activeTab, setActiveTab] = useState('profile');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('baoms_sidebar_collapsed') === 'true';
  });

  React.useEffect(() => {
    if (user) {
      if (user.role === 'HR Officer') {
        setActiveTab('hr_home');
      } else if (user.role === 'Project Manager') {
        setActiveTab('pm_dashboard');
      } else if (user.role === 'Finance Officer') {
        setActiveTab('fin_dashboard');
      } else if (user.role === 'System Administrator' || user.role === 'Administrator') {
        setActiveTab('admin_dashboard');
      } else if (user.role === 'M&E Officer' || user.role === 'Monitoring & Evaluation Officer') {
        setActiveTab('me_dashboard');
      } else {
        setActiveTab('profile');
      }
    }
  }, [user]);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const newVal = !prev;
      localStorage.setItem('baoms_sidebar_collapsed', String(newVal));
      return newVal;
    });
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 antialiased font-sans">
        {/* Sidebar Wireframe Skeleton */}
        <div className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col p-4 space-y-6 shrink-0">
          <div className="h-16 flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-9 h-9 bg-slate-800 rounded-lg animate-pulse"></div>
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 bg-slate-800 rounded w-24 animate-pulse"></div>
              <div className="h-2 bg-slate-800 rounded w-16 animate-pulse"></div>
            </div>
          </div>
          <div className="flex-1 space-y-4 pt-4">
            {[1, 2, 3, 4, 5, 6, 7].map(n => (
              <div key={n} className="flex items-center gap-3 px-3 py-2">
                <div className="w-5 h-5 bg-slate-800 rounded-lg animate-pulse"></div>
                <div className="h-3 bg-slate-800 rounded w-28 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Panel Wireframe Skeleton */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Skeleton */}
          <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-5 h-5 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded w-36 animate-pulse"></div>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-20 h-3 bg-slate-200 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Content Body Skeleton */}
          <div className="flex-1 bg-slate-50 p-6 md:p-8 space-y-6 overflow-y-auto no-scrollbar">
            {/* Top banner skeleton */}
            <div className="h-24 bg-slate-200 rounded-2xl animate-pulse"></div>

            {/* Metrics cards skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-3">
                  <div className="h-2 bg-slate-200 rounded w-16 animate-pulse"></div>
                  <div className="h-6 bg-slate-200 rounded w-8 animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Widgets grid skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm h-64 animate-pulse"></div>
              <div className="lg:col-span-2 bg-white border border-slate-200 p-5 rounded-xl shadow-sm h-64 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans transition-colors">
      {/* Sidebar Navigation */}
      <DynamicSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        collapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
      />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <TopUtilityHeader activeTab={activeTab} setActiveTab={setActiveTab} toggleSidebar={toggleSidebar} collapsed={sidebarCollapsed} />

        {/* Dynamic Center Screen Container */}
        <ErrorBoundary key={activeTab}>
          <DashboardContent activeTab={activeTab} setActiveTab={setActiveTab} />
        </ErrorBoundary>
      </div>

      {/* Global Document Preview Modal */}
      {activePreviewDoc && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActivePreviewDoc(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-slate-500" />
                <h3 className="font-extrabold text-slate-800 text-base">{activePreviewDoc.fileName}</h3>
                <span className="text-xs text-slate-400 font-mono">({activePreviewDoc.fileSize || 'N/A'})</span>
              </div>
              <div className="flex items-center gap-3">
                {(activePreviewDoc.downloadUrl || activePreviewDoc.dataUrl) && (
                  <button
                    onClick={() => {
                      if (activePreviewDoc.downloadUrl) {
                        window.open(activePreviewDoc.downloadUrl, '_blank');
                        return;
                      }
                      const link = document.createElement('a');
                      link.href = activePreviewDoc.dataUrl;
                      link.download = activePreviewDoc.fileName;
                      link.click();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </button>
                )}
                <button 
                  onClick={() => setActivePreviewDoc(null)}
                  className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6 bg-slate-100 flex items-center justify-center min-h-[400px]">
              {(() => {
                const previewUrl = activePreviewDoc.downloadUrl || activePreviewDoc.dataUrl;
                if (!previewUrl) {
                  return <div className="text-center text-slate-400 text-sm py-8">Document preview content not found.</div>;
                }
                const fileType = activePreviewDoc.fileType || '';
                const isImage = fileType.startsWith('image/') || previewUrl.startsWith('data:image/');
                const isPdf = fileType === 'application/pdf' || previewUrl.startsWith('data:application/pdf');

                if (isImage) {
                  return (
                    <img
                      src={previewUrl}
                      alt={activePreviewDoc.fileName}
                      className="max-w-full max-h-[65vh] object-contain rounded-lg border border-slate-200 shadow bg-white"
                    />
                  );
                }
                if (isPdf) {
                  return (
                    <iframe
                      src={previewUrl}
                      title={activePreviewDoc.fileName}
                      className="w-full h-[65vh] rounded-lg border border-slate-200 shadow bg-white"
                    />
                  );
                }
                return (
                  <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-xl space-y-4 text-center max-w-md w-full shadow">
                    <FileText size={48} className="text-slate-400" />
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-base">{activePreviewDoc.fileName}</h4>
                      <p className="text-slate-400 text-xs mt-1">{activePreviewDoc.fileSize || 'Unknown Size'}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (activePreviewDoc.downloadUrl) {
                          window.open(activePreviewDoc.downloadUrl, '_blank');
                          return;
                        }
                        const link = document.createElement('a');
                        link.href = activePreviewDoc.dataUrl;
                        link.download = activePreviewDoc.fileName;
                        link.click();
                      }}
                      className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-900 shadow"
                    >
                      Download Document File
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
