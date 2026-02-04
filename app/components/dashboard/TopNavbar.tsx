'use client';

import { usePathname } from 'next/navigation';

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/overview')) return 'Overview';
  if (pathname.startsWith('/discovery')) return 'Discovery';
  if (pathname.startsWith('/settings')) return 'Settings';
  return 'Dashboard';
}

export default function TopNavbar() {
  const pathname = usePathname();
  const currentTitle = getPageTitle(pathname);

  return (
    <nav className="navbar bg-base-100 border-b border-base-200 shadow-sm sticky top-0 z-40">
      <div className="navbar-start">
        <label
          htmlFor="dashboard-drawer"
          className="btn btn-ghost btn-circle lg:hidden"
          aria-label="Open menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
        </label>
        <span className="text-xl font-bold ml-2 lg:ml-0">{currentTitle}</span>
      </div>

      <div className="navbar-end">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-8 rounded-full bg-primary text-primary-content flex items-center justify-center">
              <span className="text-sm font-semibold">U</span>
            </div>
          </div>
          <span className="text-sm hidden sm:inline text-base-content">User Name</span>
        </div>
      </div>
    </nav>
  );
}