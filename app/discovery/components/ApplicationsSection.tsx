'use client';

import { useState, useEffect } from 'react';
import { Application, ApplicationsResponse } from '@/app/types/applications';
import SearchCard from './SearchCard';
import ApplicationCard from './ApplicationCard';

interface ApplicationsSectionProps {
  onApplicationsLoaded?: (applications: Application[]) => void;
}

export default function ApplicationsSection({ onApplicationsLoaded }: ApplicationsSectionProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/wafie.v1.ApplicationService/ListApplications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          options: {
            include_ingress: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch applications: ${response.status}`);
      }

      const data: ApplicationsResponse = await response.json();
      const apps = data.applications || [];

      // Fetch protection status for each application
      const appsWithProtection = await Promise.all(
        apps.map(async (app) => {
          try {
            const protectionResponse = await fetch('/api/wafie.v1.ProtectionService/GetProtection', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ application_id: app.id })
            });

            if (protectionResponse.ok) {
              const protectionData = await protectionResponse.json();
              return {
                ...app,
                protectionMode: protectionData.protection?.protectionMode
              };
            }

            // If protection not found (404) or error, app is unprotected
            return app;
          } catch (error) {
            console.error(`Error fetching protection for app ${app.id}:`, error);
            return app;
          }
        })
      );

      setApplications(appsWithProtection);

      // Notify parent component about loaded applications
      if (onApplicationsLoaded) {
        onApplicationsLoaded(appsWithProtection);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch applications');
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const filteredApplications = applications.filter((app) =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRetry = () => {
    fetchApplications();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="skeleton h-12 w-full"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="skeleton h-6 w-3/4 mb-3"></div>
                <div className="skeleton h-4 w-full mb-2"></div>
                <div className="skeleton h-4 w-2/3 mb-2"></div>
                <div className="skeleton h-6 w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <SearchCard
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <div className="card bg-base-100 shadow-md">
          <div className="card-body text-center">
            <h3 className="card-title text-error justify-center mb-2">
              Error Loading Applications
            </h3>
            <p className="text-base-content/70 mb-4">{error}</p>
            <button
              className="btn btn-primary"
              onClick={handleRetry}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SearchCard
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {filteredApplications.length === 0 ? (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body text-center">
            <h3 className="card-title justify-center mb-2">
              {searchTerm ? 'No Applications Found' : 'No Applications Available'}
            </h3>
            <p className="text-base-content/70">
              {searchTerm
                ? `No applications match "${searchTerm}". Try a different search term.`
                : 'No applications have been discovered yet.'
              }
            </p>
            {searchTerm && (
              <button
                className="btn btn-outline mt-4"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              Applications
              <span className="text-sm font-normal text-base-content/70 ml-2">
                ({filteredApplications.length} {searchTerm && `of ${applications.length}`})
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApplications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}