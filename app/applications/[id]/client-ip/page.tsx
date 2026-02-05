'use client';

import React, { useState, useEffect, use } from 'react';

// Metadata moved to layout since this is now a client component

interface Application {
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
}

interface ApplicationResponse {
  application: Application;
}

interface XFFResponse {
  'x-forwarded-for': string;
}

interface NetworkHop {
  ip: string;
  index: number;
  isSelected: boolean;
}

export default function ClientIPPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const applicationId = parseInt(resolvedParams.id);

  const [application, setApplication] = useState<Application | null>(null);
  const [networkHops, setNetworkHops] = useState<NetworkHop[]>([]);
  const [selectedHopIndex, setSelectedHopIndex] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingXFF, setLoadingXFF] = useState(false);

  useEffect(() => {
    fetchApplicationData();
  }, [applicationId]);

  const fetchApplicationData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/wafie.v1.ApplicationService/GetApplication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: applicationId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch application: ${response.status}`);
      }

      const data: ApplicationResponse = await response.json();
      setApplication(data.application);

      // Fetch XFF data once we have application info
      if (data.application.ingress?.[0]) {
        await fetchXFFData(data.application);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch application data');
      console.error('Error fetching application:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchXFFData = async (app: Application) => {
    try {
      setLoadingXFF(true);
      const ingress = app.ingress[0];

      const response = await fetch('/api/wafie/cip/xff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheme: ingress.scheme,
          host: ingress.host
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch XFF data: ${response.status}`);
      }

      const data: XFFResponse = await response.json();
      const xffValue = data['x-forwarded-for'] || '';

      // Parse XFF header into network hops
      if (xffValue) {
        const ips = xffValue.split(',').map(ip => ip.trim()).filter(ip => ip.length > 0);
        const hops: NetworkHop[] = ips.reverse().map((ip, index) => ({
          ip,
          index: index + 1,
          isSelected: index + 1 === selectedHopIndex
        }));
        setNetworkHops(hops);
      }
    } catch (err) {
      console.error('Error fetching XFF data:', err);
      // Don't set main error state for XFF failures
    } finally {
      setLoadingXFF(false);
    }
  };

  const handleHopSelection = (hopIndex: number) => {
    setSelectedHopIndex(hopIndex);
    setNetworkHops(hops =>
      hops.map(hop => ({
        ...hop,
        isSelected: hop.index === hopIndex
      }))
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Trusted Proxy Configuration</h1>
          <p className="text-base-content/60 mt-2">Loading client IP detection settings...</p>
        </div>
        <div className="card bg-base-100 shadow-md">
          <div className="card-body flex items-center justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Trusted Proxy Configuration</h1>
          <p className="text-base-content/60 mt-2">Client IP detection settings</p>
        </div>
        <div className="card bg-base-100 shadow-md">
          <div className="card-body text-center py-12">
            <div className="text-error mb-4">
              <h3 className="text-lg font-semibold mb-2">Error Loading Configuration</h3>
              <p>{error}</p>
            </div>
            <button onClick={fetchApplicationData} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trusted Proxy Configuration</h1>
        <p className="text-base-content/60 mt-2">
          Configure how to extract the real client IP from X-Forwarded-For header
        </p>
      </div>

      {/* Main Content */}
      {!loading && !error && networkHops.length > 0 && (
        <NetworkFlowDiagram
          xffIps={networkHops.map(hop => hop.ip)}
          selectedIndex={selectedHopIndex}
          onIndexChange={handleHopSelection}
          onRefresh={() => application && fetchXFFData(application)}
          isRefreshing={loadingXFF}
        />
      )}

      {/* No Data State */}
      {!loading && !error && networkHops.length === 0 && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="text-center py-8">
              <div className="text-base-content/30 text-4xl mb-4">📡</div>
              <h3 className="text-lg font-semibold mb-2">No XFF Data Available</h3>
              <p className="text-base-content/70 mb-4">
                Unable to retrieve X-Forwarded-For header information.
              </p>
              <button
                onClick={() => application && fetchXFFData(application)}
                className="btn btn-primary"
                disabled={loadingXFF}
              >
                {loadingXFF && <span className="loading loading-spinner loading-sm"></span>}
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Network Flow Diagram Component
interface NetworkFlowDiagramProps {
  xffIps: string[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

function NetworkFlowDiagram({ xffIps, selectedIndex, onIndexChange, onRefresh, isRefreshing }: NetworkFlowDiagramProps) {
  // State for manual editing
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [manualIndexInput, setManualIndexInput] = useState<string>('');

  return (
    <div className="card bg-base-100 shadow-md">
      <div className="card-body p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="card-title text-lg">Automatic Trusted Proxy Configuration</h3>
          <button
            onClick={onRefresh}
            className="btn btn-outline btn-sm"
            disabled={isRefreshing}
          >
            {isRefreshing && <span className="loading loading-spinner loading-sm"></span>}
            Refresh
          </button>
        </div>

        <p className="text-base-content/60 mb-6">
          Shows the path of a request through proxies and load balancers. Select which hop you trust as the client IP provider.
        </p>

        <div className="overflow-x-auto">
          <div className="flex items-center justify-center py-4 min-w-max">
            {/* User Icon */}
            <NetworkHop
              title="User"
              ip="Client"
              type="user"
              isSelected={false}
              index={0}
            />

            {/* XFF Hops (rendered right to left as per indexing) */}
            {xffIps.map((ip, arrayIndex) => {
              // Calculate reverse index (right to left, starting from 1)
              const reverseIndex = xffIps.length - arrayIndex;
              const isSelected = reverseIndex === selectedIndex;

              return (
                <React.Fragment key={arrayIndex}>
                  {/* Arrow */}
                  <NetworkArrow isSelected={isSelected} />

                  {/* Hop */}
                  <NetworkHop
                    title={`Hop ${reverseIndex}`}
                    ip={ip}
                    type="proxy"
                    isSelected={isSelected}
                    index={reverseIndex}
                    onClick={() => onIndexChange(reverseIndex)}
                  />
                </React.Fragment>
              );
            })}

            {/* Final Arrow */}
            <NetworkArrow isSelected={false} />

            {/* Application */}
            <NetworkHop
              title="Application"
              ip="Destination"
              type="application"
              isSelected={false}
              index={0}
            />
          </div>
        </div>

        <div className="mt-6 p-6 bg-base-200 rounded-lg">
          {/* Index Selection */}
          <div>
            <h4 className="font-semibold mb-3">Select Trusted Proxy</h4>
            <div className="space-y-2">
              {xffIps.map((ip, arrayIndex) => {
                const reverseIndex = xffIps.length - arrayIndex;
                return (
                  <label key={arrayIndex} className="flex items-center gap-3 cursor-pointer hover:bg-base-100 p-2 rounded">
                    <input
                      type="radio"
                      name="trustedProxy"
                      value={reverseIndex}
                      checked={selectedIndex === reverseIndex}
                      onChange={() => onIndexChange(reverseIndex)}
                      className="radio radio-primary border-2 border-white"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-outline badge-sm">Hop {reverseIndex}</span>
                        <span className="font-mono text-sm">{ip}</span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Security Note */}
            <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="text-sm">
                  <p className="font-semibold">Security Note</p>
                  <p className="text-base-content/70">
                    Only trust proxies you control. Malicious clients can forge X-Forwarded-For headers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Trusted Proxy Display Card */}
        <div className="card bg-base-200 shadow-sm mt-6">
          <div className="card-body p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Selected Trusted Proxy</h4>
              <button
                className="btn btn-info"
                onClick={() => {
                  setIsManualEdit(!isManualEdit);
                  setManualIndexInput(String(selectedIndex));
                }}
              >
                {isManualEdit ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {!isManualEdit ? (
              <div className="flex items-center gap-2">
                <span className="badge badge-primary">Hop {selectedIndex}</span>
                <span className="font-mono">{xffIps[xffIps.length - selectedIndex]}</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="label">
                    <span className="label-text font-semibold">Hop Index:</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={xffIps.length}
                    value={manualIndexInput}
                    onChange={(e) => setManualIndexInput(e.target.value)}
                    className="input input-sm input-bordered w-20"
                    placeholder="1"
                  />
                  <span className="text-sm text-base-content/60">
                    (1-{xffIps.length})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-sm btn-primary"
                    disabled={
                      !manualIndexInput ||
                      Number(manualIndexInput) < 1 ||
                      Number(manualIndexInput) > xffIps.length
                    }
                    onClick={() => {
                      const newIndex = Number(manualIndexInput);
                      if (newIndex >= 1 && newIndex <= xffIps.length) {
                        onIndexChange(newIndex);
                        setIsManualEdit(false);
                      }
                    }}
                  >
                    Apply
                  </button>
                  <span className="text-sm text-base-content/60">
                    Preview: {manualIndexInput && Number(manualIndexInput) >= 1 && Number(manualIndexInput) <= xffIps.length
                      ? xffIps[xffIps.length - Number(manualIndexInput)]
                      : 'Invalid index'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button className="btn btn-primary">
            Save Configuration
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Network Hop Component
interface NetworkHopProps {
  title: string;
  ip: string;
  type: 'user' | 'proxy' | 'application';
  isSelected: boolean;
  index: number;
  onClick?: () => void;
}

function NetworkHop({ title, ip, type, isSelected, onClick }: NetworkHopProps) {
  const getIcon = () => {
    switch (type) {
      case 'user':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'proxy':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12l4-4m-4 4l4 4" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12l-4-4m4 4l-4 4" />
          </svg>
        );
      case 'application':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`flex flex-col items-center p-4 rounded-lg transition-all ${
        isSelected
          ? 'bg-primary text-primary-content shadow-lg scale-105'
          : 'bg-base-200 hover:bg-base-300'
      } ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="mb-2">
        {getIcon()}
      </div>
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs opacity-70 font-mono">{ip}</div>
    </div>
  );
}

// Network Arrow Component
interface NetworkArrowProps {
  isSelected: boolean;
}

function NetworkArrow({ isSelected }: NetworkArrowProps) {
  return (
    <div className="flex items-center px-4">
      <svg
        className={`w-8 h-8 ${isSelected ? 'text-primary' : 'text-base-content/40'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    </div>
  );
}