import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { GIGWHeader } from './GIGWHeader';
import { GIGWFooter } from './GIGWFooter';

export const AppShell: React.FC = () => {
  const { user, loading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-warm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-teal-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-navy-900">Loading FINTRAC...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-warm antialiased">
      {/* Desktop Sidebar & Mobile Drawer */}
      <Sidebar
        isOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Backdrop for mobile */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-navy-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* National Accessibility & Compliance Header (GIGW 3.0) */}
        <GIGWHeader />

        {/* Operational Top Bar */}
        <TopNav onToggleMobile={() => setMobileSidebarOpen(true)} />

        {/* Primary Page Landmark */}
        <main
          id="main-content"
          role="main"
          tabIndex={-1}
          className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto focus:outline-none"
        >
          <Outlet />
        </main>

        {/* National Institutional Footer (GIGW 3.0) */}
        <GIGWFooter />
      </div>
    </div>
  );
};
