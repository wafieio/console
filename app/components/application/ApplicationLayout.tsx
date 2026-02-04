'use client';

import { ApplicationSideMenu } from './ApplicationSideMenu';
import type { Application } from '@/app/types/applications';
import { useState } from 'react';

interface ApplicationLayoutProps {
  children: React.ReactNode;
  application: Application;
}

export function ApplicationLayout({ children, application }: ApplicationLayoutProps) {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(true);

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

      {/* Sub-menu toggle button - shows when sub-menu is closed */}
      <button
        onClick={() => setIsSubMenuOpen(true)}
        className={`fixed left-4 top-20 z-30 btn btn-primary btn-sm gap-2 ${
          isSubMenuOpen ? 'hidden' : 'flex'
        }`}
        aria-label="Open application menu"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
        <span className="text-xs hidden sm:inline">App Menu</span>
      </button>

      {/* Mobile overlay when sub-menu is open - only on mobile screens */}
      {isSubMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSubMenuOpen(false)}
        />
      )}

      {/* Just render children - they will be displayed in the existing DashboardLayout */}
      {children}
    </>
  );
}