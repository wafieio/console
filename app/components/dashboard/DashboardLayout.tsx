'use client';

import TopNavbar from './TopNavbar';
import SideMenu from './SideMenu';
import type { DashboardLayoutProps } from '@/app/types/dashboard';

export default function DashboardLayout({ children }: DashboardLayoutProps) {
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
    </div>
  );
}