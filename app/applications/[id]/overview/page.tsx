'use client';

import { useState, useEffect, use } from 'react';
import { CiCircleInfo } from "react-icons/ci";
import { IoShieldOutline } from "react-icons/io5";
import { IoSettingsOutline } from "react-icons/io5";
import { AdvancedNetworkTopology } from '@/app/components/application/AdvancedNetworkTopology';
import { SecurityEventsSection } from '@/app/components/application/SecurityEventsSection';

// Metadata moved to layout.tsx since this is now a client component

// API Types
interface ApplicationResponse {
  application: {
    id: number;
    name: string;
    ingress: Array<{
      name: string;
      namespace: string;
      host: string;
      path: string;
      applicationId: number;
      ingressType: string;
      discoveryStatus: string;
      upstream: object;
      scheme: string;
    }>;
  };
}

interface ProtectionResponse {
  protection: {
    id: number;
    applicationId: number;
    protectionMode: 'PROTECTION_MODE_ON' | 'PROTECTION_MODE_OFF';
    desiredState: {
      ipRules: object;
      auth: {
        basicAuth: object;
        tokenAuth: object;
      };
      antiBot: {
        captchaV2: object;
      };
    };
  };
}

interface ProtectionData {
  isProtected: boolean;
  protectionId: string;
  isEnabled: boolean;
  badgeColor: string;
  badgeText: string;
}

// API Functions - Real API calls
async function fetchApplicationData(id: string): Promise<ApplicationResponse['application'] | null> {
  try {
    const response = await fetch(`/api/wafie.v1.ApplicationService/GetApplication`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: parseInt(id) }),
    });

    if (!response.ok) {
      console.error('Application API call failed:', response.status);
      return null;
    }

    const data: ApplicationResponse = await response.json();
    return data.application;
  } catch (error) {
    console.error('Error fetching application data:', error);
    return null;
  }
}

async function fetchProtectionData(applicationId: number): Promise<{ success: boolean; data?: ProtectionResponse['protection'] }> {
  try {
    const response = await fetch(`/api/wafie.v1.ProtectionService/GetProtection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ application_id: applicationId }),
    });

    if (response.status === 404) {
      // Protection not found - return unsuccessful result as per prompt requirements
      return { success: false };
    }

    if (!response.ok) {
      console.error('Protection API call failed:', response.status);
      return { success: false };
    }

    const data: ProtectionResponse = await response.json();
    return { success: true, data: data.protection };
  } catch (error) {
    console.error('Error fetching protection data:', error);
    return { success: false };
  }
}

function processProtectionData(protectionResult: { success: boolean; data?: ProtectionResponse['protection'] }): ProtectionData {
  // If API call failed (404 or error), return unprotected status
  if (!protectionResult.success || !protectionResult.data) {
    return {
      isProtected: false,
      protectionId: '-',
      isEnabled: false,
      badgeColor: 'badge-error',
      badgeText: 'Unprotected'
    };
  }

  const protection = protectionResult.data;
  const isProtectionOn = protection.protectionMode === 'PROTECTION_MODE_ON';

  return {
    isProtected: isProtectionOn,
    protectionId: protection.id === -1 ? '-' : protection.id.toString(),
    isEnabled: isProtectionOn,
    badgeColor: isProtectionOn ? 'badge-success' : 'badge-error',
    badgeText: isProtectionOn ? 'Protected' : 'Unprotected'
  };
}

export default function ApplicationOverviewPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const applicationId = parseInt(resolvedParams.id);

  // State management
  const [application, setApplication] = useState<ApplicationResponse['application'] | null>(null);
  const [protection, setProtection] = useState<ProtectionData>({
    isProtected: false,
    protectionId: '-',
    isEnabled: false,
    badgeColor: 'badge-error',
    badgeText: 'Unprotected'
  });
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [toggleSuccess, setToggleSuccess] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [appData, protectionResult] = await Promise.all([
          fetchApplicationData(resolvedParams.id),
          fetchProtectionData(applicationId),
        ]);

        setApplication(appData);
        setProtection(processProtectionData(protectionResult));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id, applicationId]);

  // Toggle protection handler
  const handleProtectionToggle = async (enabled: boolean) => {
    try {
      setToggleLoading(true);
      setToggleError(null);
      setToggleSuccess(null);

      // Scenario 1: Protection doesn't exist (ID is '-') and user enables → Call CreateProtection API
      if (protection.protectionId === '-' && enabled) {
        const response = await fetch('/api/wafie.v1.ProtectionService/CreateProtection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            application_id: applicationId
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create protection: ${response.status}`);
        }

        const data = await response.json();
        const newProtection = data.protection;

        // Update local state with new protection ID and enabled status
        setProtection(prev => ({
          ...prev,
          protectionId: newProtection.id.toString(),
          isEnabled: true,
          isProtected: true,
          badgeColor: 'badge-success',
          badgeText: 'Protected'
        }));

        setToggleSuccess('Protection created and enabled successfully');
        setTimeout(() => setToggleSuccess(null), 3000);
        return;
      }

      // Scenario 2: Protection doesn't exist (ID is '-') and user disables → Show error
      if (protection.protectionId === '-' && !enabled) {
        setToggleError('Cannot disable protection that does not exist');
        setTimeout(() => setToggleError(null), 5000);
        return;
      }

      // Scenario 3: Protection exists (ID is not '-') → Use existing PutProtection logic
      const response = await fetch('/api/wafie.v1.ProtectionService/PutProtection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: parseInt(protection.protectionId),
          protection_mode: enabled ? 'PROTECTION_MODE_ON' : 'PROTECTION_MODE_OFF'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update protection: ${response.status}`);
      }

      // Update local state to reflect the change
      setProtection(prev => ({
        ...prev,
        isEnabled: enabled,
        isProtected: enabled,
        badgeColor: enabled ? 'badge-success' : 'badge-error',
        badgeText: enabled ? 'Protected' : 'Unprotected'
      }));

      // Show success message
      setToggleSuccess(`Protection ${enabled ? 'enabled' : 'disabled'} successfully`);

      // Auto-hide success message after 3 seconds
      setTimeout(() => setToggleSuccess(null), 3000);

    } catch (error) {
      console.error('Error toggling protection:', error);
      setToggleError(error instanceof Error ? error.message : 'Failed to update protection');

      // Auto-hide error message after 5 seconds
      setTimeout(() => setToggleError(null), 5000);
    } finally {
      setToggleLoading(false);
    }
  };

  // Fallback data if API fails
  const appData = application || {
    id: applicationId,
    name: `Application ${applicationId}`,
    ingress: [{ namespace: 'default' }]
  };

  // Extract namespace from ingress array (as per prompt requirements)
  const namespace = application?.ingress?.[0]?.namespace || 'default';

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Application Overview</h1>
          <p className="text-base-content/60 mt-2">Loading application data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="skeleton h-6 w-3/4 mb-4"></div>
                <div className="skeleton h-4 w-full mb-2"></div>
                <div className="skeleton h-4 w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Application Overview</h1>
        <p className="text-base-content/60 mt-2">Security overview and protection status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Basic Information Card */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title text-lg">Basic Information</h2>
              <CiCircleInfo className="text-4xl text-info" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">Application Name</span>
                <span className="text-sm font-semibold">{appData.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">Application Namespace</span>
                <span className="badge badge-accent text-xs">{namespace}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">Application ID</span>
                <span className="badge badge-neutral text-xs">{appData.id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Active Protections Card */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title text-lg">Active Protections</h2>
              <IoShieldOutline className="text-4xl text-success" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">Protections Enabled</span>
                <span className="text-sm font-semibold">
                  {protection.isEnabled ? '1' : '0'}/5
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">Type</span>
                <span className="badge badge-primary text-xs">nginx</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">Status</span>
                <span className="badge badge-success text-xs">healthy</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Protection Status Card */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h2 className="card-title text-lg">Protection Status</h2>
              <IoSettingsOutline className="text-4xl text-warning" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">Protection</span>
                <span className={`badge ${protection.badgeColor} text-xs`}>
                  {protection.badgeText}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">Protection ID</span>
                <span className="badge badge-neutral text-xs">{protection.protectionId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">Enable Protection</span>
                <div className="flex items-center space-x-2">
                  {toggleLoading && (
                    <span className="loading loading-spinner loading-sm"></span>
                  )}
                  <input
                    type="checkbox"
                    className="toggle toggle-success toggle-lg"
                    checked={protection.isEnabled}
                    disabled={toggleLoading}
                    onChange={(e) => handleProtectionToggle(e.target.checked)}
                  />
                </div>
              </div>
              {toggleError && (
                <div className="mt-3 p-2 bg-error/10 border border-error/20 rounded text-error text-sm">
                  {toggleError}
                </div>
              )}
              {toggleSuccess && (
                <div className="mt-3 p-2 bg-success/10 border border-success/20 rounded text-success text-sm">
                  {toggleSuccess}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Network Topology Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Network Topology</h2>
          <p className="text-base-content/60 mt-2">Application network topology</p>
        </div>
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <AdvancedNetworkTopology
              selectedApp={application}
              protectionEnabled={protection.isEnabled}
            />
          </div>
        </div>
      </div>

      {/* Security Events Section */}
      <SecurityEventsSection
        protectionId={protection.protectionId}
        isProtectionEnabled={protection.isEnabled}
      />
    </div>
  );
}