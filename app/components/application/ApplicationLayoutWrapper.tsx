'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { ApplicationLayout } from './ApplicationLayout';
import type { Application } from '@/app/types/applications';

interface ApplicationLayoutWrapperProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

// Real API function to fetch application data
async function getApplication(id: string): Promise<Application | null> {
  try {
    const response = await fetch(`/api/wafie.v1.ApplicationService/GetApplication`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: parseInt(id, 10) }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`API call failed: ${response.status}`);
    }

    const data = await response.json();
    return data.application || null;
  } catch (error) {
    console.error('Error fetching application:', error);
    throw error;
  }
}

export function ApplicationLayoutWrapper({ children, params }: ApplicationLayoutWrapperProps) {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadApplication = async () => {
      try {
        const resolvedParams = await params;
        const app = await getApplication(resolvedParams.id);
        if (!app) {
          setError('Application not found');
          setLoading(false);
          return;
        }
        setApplication(app);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load application:', error);
        setError('Failed to load application');
        setLoading(false);
      }
    };

    loadApplication();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Application Not Found</h1>
          <p className="text-base-content/60 mb-6">The requested application could not be found.</p>
          <a href="/discovery" className="btn btn-primary">
            Back to Discovery
          </a>
        </div>
      </div>
    );
  }

  return (
    <ApplicationLayout application={application}>
      {children}
    </ApplicationLayout>
  );
}