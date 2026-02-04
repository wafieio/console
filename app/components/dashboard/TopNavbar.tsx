'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/overview')) return 'Overview';
  if (pathname.startsWith('/discovery')) return 'Discovery';
  if (pathname.startsWith('/settings')) return 'Settings';
  if (pathname.startsWith('/applications')) return 'Application';
  return 'Dashboard';
}

function getApplicationPageTitle(subPath: string): string {
  switch (subPath) {
    case 'overview': return 'Overview';
    case 'client-ip': return 'Client IP';
    case 'antibot': return 'AntiBot';
    case 'basic-auth': return 'Basic Authentication';
    case 'token-auth': return 'Token Authentication';
    case 'ip-rules': return 'IP Rules';
    default: return 'Overview';
  }
}

async function getApplicationName(id: string): Promise<string> {
  // Mock function - in real implementation, this would fetch from API
  const mockApplications: Record<string, string> = {
    '1': 'E-commerce Frontend',
    '2': 'User Authentication API',
    '3': 'Payment Processing Service'
  };

  return mockApplications[id] || `Application ${id}`;
}

export function TopNavbar() {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    const buildBreadcrumbs = async () => {
      if (pathname.startsWith('/applications/')) {
        const pathParts = pathname.split('/').filter(Boolean);
        if (pathParts.length >= 2) {
          const applicationId = pathParts[1];
          const subPath = pathParts[2] || 'overview';

          const applicationName = await getApplicationName(applicationId);

          const newBreadcrumbs: BreadcrumbItem[] = [
            { label: 'Discovery', href: '/discovery' },
            { label: applicationName, href: `/applications/${applicationId}/overview` },
            { label: getApplicationPageTitle(subPath) }
          ];

          setBreadcrumbs(newBreadcrumbs);
        }
      } else {
        // For non-application pages, show simple title
        const title = getPageTitle(pathname);
        setBreadcrumbs([{ label: title }]);
      }
    };

    buildBreadcrumbs();
  }, [pathname]);

  const isApplicationPage = pathname.startsWith('/applications/');
  const currentTitle = isApplicationPage ? 'Application' : getPageTitle(pathname);

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
        {isApplicationPage ? (
          <div className="breadcrumbs text-sm ml-2 lg:ml-0">
            <ul>
              {breadcrumbs.map((crumb, index) => (
                <li key={index}>
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-primary">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-bold">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <span className="text-xl font-bold ml-2 lg:ml-0">{currentTitle}</span>
        )}
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

export default TopNavbar;