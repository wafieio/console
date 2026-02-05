'use client';

import { usePathname } from 'next/navigation';
import TopNavbar from './TopNavbar';
import SideMenu from './SideMenu';
import type { DashboardLayoutProps } from '@/app/types/dashboard';

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const isApplicationPage = pathname.startsWith('/applications/');

  return (
    <div className="drawer lg:drawer-open">
      <input id="dashboard-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col min-h-screen">
        <TopNavbar />
        <main className="flex-1 overflow-auto p-6 bg-base-200">
          <div className="max-w-8xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <div className="drawer-side">
        <label htmlFor="dashboard-drawer" className="drawer-overlay"></label>
        <SideMenu />
      </div>

      {/* Floating Action Button for Main Menu - shows when collapsed and NOT in application pages */}
      {!isApplicationPage && (
        <div className="tooltip tooltip-left fixed right-4 bottom-6 z-30 lg:hidden" data-tip="Main Menu">
          <label
            htmlFor="dashboard-drawer"
            className="btn btn-secondary btn-circle shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 cursor-pointer"
            aria-label="Open main menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </label>
        </div>
      )}
    </div>
  );
}