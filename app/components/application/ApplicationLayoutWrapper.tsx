'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { ApplicationLayout } from './ApplicationLayout';
import type { Application } from '@/app/types/applications';

interface ApplicationLayoutWrapperProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

// Mock function to fetch application data - replace with actual API call
function getApplication(id: string): Application | null {
  const mockApplications: Application[] = [
    {
      id: 1,
      name: 'E-commerce Frontend',
      ingress: [
        {
          name: 'ecommerce-ingress',
          namespace: 'production',
          host: 'shop.example.com',
          path: '/',
          discoveryStatus: 'protected'
        }
      ]
    },
    {
      id: 2,
      name: 'User Authentication API',
      ingress: [
        {
          name: 'auth-api-ingress',
          namespace: 'auth',
          host: 'api.example.com',
          path: '/auth',
          discoveryStatus: 'unprotected'
        }
      ]
    },
    {
      id: 3,
      name: 'Payment Processing Service',
      ingress: [
        {
          name: 'payment-ingress',
          namespace: 'payments',
          host: 'payments.example.com',
          path: '/',
          discoveryStatus: 'protected'
        }
      ]
    }
  ];

  const numericId = parseInt(id, 10);
  return mockApplications.find(app => app.id === numericId) || null;
}

export function ApplicationLayoutWrapper({ children, params }: ApplicationLayoutWrapperProps) {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadApplication = async () => {
      try {
        const resolvedParams = await params;
        const app = getApplication(resolvedParams.id);
        if (!app) {
          setError('Application not found');
          setLoading(false);
          return;
        }
        setApplication(app);
        setLoading(false);
      } catch (err) {
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