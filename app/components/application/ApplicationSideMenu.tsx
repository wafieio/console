'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  AiFillSignal,
  AiFillLock,
  AiFillRobot,
  AiFillSafetyCertificate,
  AiFillIdcard,
  AiFillSecurityScan,
  AiOutlineArrowLeft,
  AiOutlineClose
} from 'react-icons/ai';
import type { Application, ApplicationNavigationItem } from '@/app/types/applications';

interface ProtectionResponse {
  protection: {
    id: number;
    applicationId: number;
    protectionMode: 'PROTECTION_MODE_ON' | 'PROTECTION_MODE_OFF';
    desiredState: object;
  };
}

interface ProtectionStatus {
  isProtected: boolean;
  loading: boolean;
  error: boolean;
}

interface ApplicationSideMenuProps {
  application: Application;
  onClose?: () => void;
}

const getApplicationMenuItems = (applicationId: number): ApplicationNavigationItem[] => [
  { href: `/applications/${applicationId}/overview`, label: 'Overview', icon: AiFillSignal },
  { href: `/applications/${applicationId}/client-ip`, label: 'Client IP', icon: AiFillSecurityScan },
  { href: `/applications/${applicationId}/antibot`, label: 'AntiBot', icon: AiFillRobot },
  { href: `/applications/${applicationId}/basic-auth`, label: 'Basic Authentication', icon: AiFillSafetyCertificate },
  { href: `/applications/${applicationId}/token-auth`, label: 'Token Authentication', icon: AiFillIdcard },
  { href: `/applications/${applicationId}/ip-rules`, label: 'IP Rules', icon: AiFillLock },
];

async function fetchProtectionStatus(applicationId: number): Promise<{ success: boolean; isProtected: boolean }> {
  try {
    const response = await fetch('/api/wafie.v1.ProtectionService/GetProtection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: applicationId }),
    });

    if (response.status === 404) {
      return { success: true, isProtected: false };
    }

    if (!response.ok) {
      console.error('Protection API call failed:', response.status);
      return { success: false, isProtected: false };
    }

    const data: ProtectionResponse = await response.json();
    return {
      success: true,
      isProtected: data.protection.protectionMode === 'PROTECTION_MODE_ON'
    };
  } catch (error) {
    console.error('Error fetching protection status:', error);
    return { success: false, isProtected: false };
  }
}

export function ApplicationSideMenu({ application, onClose }: ApplicationSideMenuProps) {
  const pathname = usePathname();
  const menuItems = getApplicationMenuItems(application.id);

  const [protectionStatus, setProtectionStatus] = useState<ProtectionStatus>({
    isProtected: false,
    loading: true,
    error: false
  });

  useEffect(() => {
    const loadProtectionStatus = async () => {
      setProtectionStatus(prev => ({ ...prev, loading: true, error: false }));

      const result = await fetchProtectionStatus(application.id);

      setProtectionStatus({
        isProtected: result.isProtected,
        loading: false,
        error: !result.success
      });
    };

    loadProtectionStatus();
  }, [application.id]);

  return (
    <aside className="w-64 bg-base-100 border-r border-base-200 shadow-xl h-screen overflow-y-auto">
      {/* Header with Close Button */}
      <div className="p-4 border-b border-base-200 flex items-center justify-between">
        <Link
          href="/discovery"
          className="flex items-center gap-2 text-sm text-base-content/70 hover:text-base-content transition-colors"
        >
          <AiOutlineArrowLeft className="text-base" />
          <span>Back to Discovery</span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm lg:hidden"
            aria-label="Close application menu"
          >
            <AiOutlineClose className="text-base" />
          </button>
        )}
      </div>

      {/* Application Header */}
      <div className="p-6 border-b border-base-200">
        <h1 className="text-xl font-bold text-base-content">{application.name}</h1>
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`badge ${
              protectionStatus.loading
                ? 'badge-neutral'
                : protectionStatus.isProtected
                  ? 'badge-success'
                  : 'badge-error'
            } text-xs`}
          >
            {protectionStatus.loading
              ? 'Loading...'
              : protectionStatus.isProtected
                ? 'Protected'
                : 'Unprotected'}
          </span>
        </div>
        <p className="text-sm text-base-content/60 mt-2">Security Configuration</p>
      </div>

      {/* Navigation Menu */}
      <ul className="px-4 py-4 space-y-2 w-full">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = pathname === item.href;

          return (
            <li key={item.href} className="w-full">
              <Link
                href={item.href}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors hover:bg-base-300 ${
                  isActive ? 'bg-primary text-primary-content' : 'text-base-content'
                }`}
              >
                <IconComponent className="text-lg flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}