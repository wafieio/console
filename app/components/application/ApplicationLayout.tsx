'use client';

import { ApplicationSideMenu } from './ApplicationSideMenu';
import type { Application } from '@/app/types/applications';
import { useState, useEffect } from 'react';

interface ApplicationLayoutProps {
  children: React.ReactNode;
  application: Application;
}

export function ApplicationLayout({ children, application }: ApplicationLayoutProps) {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const newIsMobile = window.innerWidth < 1024; // lg breakpoint is 1024px
      setIsMobile(newIsMobile);

      // Auto-open sub-menu on desktop, auto-close on mobile
      if (!newIsMobile && !isSubMenuOpen) {
        setIsSubMenuOpen(true);
      } else if (newIsMobile && isSubMenuOpen) {
        setIsSubMenuOpen(false);
      }
    };

    const handleToggleApplicationMenu = () => {
      setIsSubMenuOpen(prev => !prev);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    window.addEventListener('toggleApplicationMenu', handleToggleApplicationMenu);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('toggleApplicationMenu', handleToggleApplicationMenu);
    };
  }, [isSubMenuOpen]);

  return (
    <>
      {/* Application Sub-Menu Overlay */}
      <div
        className={`fixed left-0 top-0 z-50 h-screen transition-transform duration-300 ${
          isSubMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <ApplicationSideMenu
          application={application}
          onClose={() => setIsSubMenuOpen(false)}
        />
      </div>

      {/* Mobile backdrop for sub-menu - only on small screens */}
      {isSubMenuOpen && isMobile && (
        <div
          className="fixed left-64 top-0 right-0 h-screen z-40 bg-black bg-opacity-30"
          onClick={() => setIsSubMenuOpen(false)}
          aria-label="Close application menu"
        />
      )}

      {/* Floating Action Button for Application Menu - shows when collapsed */}
      {!isSubMenuOpen && (
        <div className="tooltip tooltip-right fixed left-4 bottom-6 z-30 lg:hidden" data-tip={application.name}>
          <button
            onClick={() => setIsSubMenuOpen(true)}
            className="btn btn-primary btn-circle shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 relative"
            aria-label={`Open ${application.name} menu`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 713.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <div className="badge badge-secondary badge-sm absolute -top-1 -right-1 text-xs px-1">
              {application.id}
            </div>
          </button>
        </div>
      )}



      {/* Just render children - they will be displayed in the existing DashboardLayout */}
      {children}
    </>
  );
}