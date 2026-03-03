'use client';

import React, { useState, useEffect, use, useCallback } from 'react';

// Metadata moved to layout since this is now a client component


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
      antiBot?: {
        enabled: boolean;
        blockPeriod: number;
        failThreshold: number;
        failWindow: number;
        responseStatuses: string;
        captchaV2: {
          enabled: boolean;
          redirectUrl: string;
          siteKey: string;
          secretKey: string;
        };
      };
    };
  };
}

interface AntiBotConfiguration {
  enabled: boolean;
  responseStatuses: string;
  blockPeriod: number;
  failThreshold: number;
  failWindow: number;
  captchaV2: {
    enabled: boolean;
    redirectUrl: string;
    siteKey: string;
    secretKey: string;
  };
}

const RESPONSE_STATUS_OPTIONS = [
  { value: '30X', label: '30X - Redirection', description: 'Block on redirection responses (300-399)' },
  { value: '40X', label: '40X - Client Error', description: 'Block on client error responses (400-499)' },
  { value: '50X', label: '50X - Server Error', description: 'Block on server error responses (500-599)' }
];

export default function AntiBotPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const applicationId = parseInt(resolvedParams.id);

  const [protectionId, setProtectionId] = useState<number | null>(null);
  const [protectionMode, setProtectionMode] = useState<'PROTECTION_MODE_ON' | 'PROTECTION_MODE_OFF' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [config, setConfig] = useState<AntiBotConfiguration>({
    enabled: false,
    responseStatuses: '',
    blockPeriod: 300,
    failThreshold: 5,
    failWindow: 60,
    captchaV2: {
      enabled: false,
      redirectUrl: '',
      siteKey: '',
      secretKey: ''
    }
  });


  const fetchProtectionData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/wafie.v1.ProtectionService/GetProtection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ application_id: applicationId }),
      });

      if (response.status === 404) {
        setProtectionId(null);
        setProtectionMode(null);
        return;
      }

      if (!response.ok) {
        console.error('Protection API call failed:', response.status);
        setError(`Failed to fetch protection data: ${response.status}`);
        return;
      }

      const data: ProtectionResponse = await response.json();
      setProtectionId(data.protection.id);
      setProtectionMode(data.protection.protectionMode);

      // Load existing antibot configuration if it exists
      if (data.protection.desiredState.antiBot) {
        const antiBot = data.protection.desiredState.antiBot;
        setConfig({
          enabled: antiBot.enabled || false,
          responseStatuses: antiBot.responseStatuses || '', // This will be the regex from API
          blockPeriod: antiBot.blockPeriod || 300,
          failThreshold: antiBot.failThreshold || 5,
          failWindow: antiBot.failWindow || 60,
          captchaV2: {
            enabled: antiBot.captchaV2?.enabled || false,
            redirectUrl: antiBot.captchaV2?.redirectUrl || '',
            siteKey: antiBot.captchaV2?.siteKey || '',
            secretKey: antiBot.captchaV2?.secretKey || ''
          }
        });
      } else {
        // If no antiBot configuration, assume disabled with default values
        setConfig({
          enabled: false,
          responseStatuses: '',
          blockPeriod: 300,
          failThreshold: 5,
          failWindow: 60,
          captchaV2: {
            enabled: false,
            redirectUrl: '',
            siteKey: '',
            secretKey: ''
          }
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch protection data');
      console.error('Error fetching protection data:', err);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchProtectionData();
  }, [fetchProtectionData]);

  const saveConfiguration = async () => {
    if (!protectionId) {
      setSaveError('Protection ID not available. Please refresh the page and try again.');
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      const response = await fetch('/api/wafie.v1.ProtectionService/PutProtection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: protectionId,
          anti_bot: {
            enabled: config.enabled,
            block_period: config.blockPeriod,
            fail_threshold: config.failThreshold,
            fail_window: config.failWindow,
            response_statuses: config.responseStatuses,
            captcha_v2: {
              enabled: config.captchaV2.enabled,
              redirect_url: config.captchaV2.redirectUrl,
              site_key: config.captchaV2.siteKey,
              secret_key: config.captchaV2.secretKey
            }
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save configuration: ${response.status}`);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save configuration');
      console.error('Error saving configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  // Convert status codes to regex patterns
  const statusToRegex = (status: string): string => {
    switch (status) {
      case '30X': return '3[0-9]{2}';
      case '40X': return '4[0-9]{2}';
      case '50X': return '5[0-9]{2}';
      default: return '';
    }
  };

  // Convert selected statuses to full regex
  const statusesToRegex = (statuses: string[]): string => {
    if (statuses.length === 0) return '';
    const regexParts = statuses.map(statusToRegex).filter(Boolean);
    return regexParts.length > 0 ? `^(${regexParts.join('|')})$` : '';
  };

  // Parse regex back to status codes (for loading existing config)
  const regexToStatuses = (regex: string): string[] => {
    if (!regex) return [];

    const statuses: string[] = [];
    if (regex.includes('3[0-9]{2}')) statuses.push('30X');
    if (regex.includes('4[0-9]{2}')) statuses.push('40X');
    if (regex.includes('5[0-9]{2}')) statuses.push('50X');

    return statuses;
  };

  const handleResponseStatusChange = (status: string, checked: boolean) => {
    setConfig(prev => {
      // Parse current statuses from regex
      const currentStatuses = regexToStatuses(prev.responseStatuses);

      let newStatuses: string[];
      if (checked) {
        // Add status if not already present
        if (!currentStatuses.includes(status)) {
          newStatuses = [...currentStatuses, status];
        } else {
          newStatuses = currentStatuses;
        }
      } else {
        // Remove status
        newStatuses = currentStatuses.filter(s => s !== status);
      }

      // Convert back to regex format
      const regexValue = statusesToRegex(newStatuses);

      return {
        ...prev,
        responseStatuses: regexValue
      };
    });
  };

  // Helper function to check if a status is selected
  const isStatusSelected = (status: string): boolean => {
    const selectedStatuses = regexToStatuses(config.responseStatuses);
    return selectedStatuses.includes(status);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AntiBot Protection</h1>
          <p className="text-base-content/60 mt-2">Loading antibot configuration...</p>
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
          <h1 className="text-3xl font-bold">AntiBot Protection</h1>
          <p className="text-base-content/60 mt-2">Configure bot detection and automated traffic filtering</p>
        </div>
        <div className="card bg-base-100 shadow-md">
          <div className="card-body text-center py-12">
            <div className="text-error mb-4">
              <h3 className="text-lg font-semibold mb-2">Error Loading Configuration</h3>
              <p>{error}</p>
            </div>
            <button onClick={() => { fetchProtectionData(); }} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isProtectionEnabled = protectionMode === 'PROTECTION_MODE_ON';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AntiBot Protection</h1>
        <p className="text-base-content/60 mt-2">Configure bot detection and automated traffic filtering</p>
      </div>

      {/* Protection Disabled Warning */}
      {!isProtectionEnabled && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-semibold mb-2">Protection Not Enabled</h3>
              <p className="text-base-content/70 mb-4">
                AntiBot protection requires application protection to be enabled. Please enable protection first to use this feature.
              </p>
              <a href={`/applications/${applicationId}/overview`} className="btn btn-primary">
                Go to Application Overview
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Section 1: Enable/Disable AntiBot Protection */}
      {isProtectionEnabled && (
      <>
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">AntiBot Protection Status</h2>
          <div className="form-control w-52">
            <label className="label cursor-pointer">
              <span className="label-text font-semibold">Enable AntiBot Protection</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={config.enabled}
                onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              />
            </label>
          </div>
          <p className="text-base-content/70 text-sm mt-2">
            When enabled, the system will analyze incoming traffic patterns and apply bot detection measures.
          </p>
        </div>
      </div>

      {/* Section 2: AntiBot Parameters */}
      {config.enabled && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-xl mb-6">AntiBot Parameters</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Response Status */}
              <div className="form-control">
                <div className="flex items-center gap-2 mb-3">
                  <label className="label-text font-semibold">Response Status for Blocking</label>
                  <div className="tooltip" data-tip="Select which HTTP response status codes should trigger bot detection analysis">
                    <svg className="w-4 h-4 text-base-content/60 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  {RESPONSE_STATUS_OPTIONS.map(option => (
                    <label key={option.value} className="flex items-center gap-3 cursor-pointer hover:bg-base-200 p-2 rounded">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={isStatusSelected(option.value)}
                        onChange={(e) => handleResponseStatusChange(option.value, e.target.checked)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-base-content/60">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {/* Show generated regex */}
                {config.responseStatuses && (
                  <div className="mt-3 p-2 bg-base-100 border border-base-300 rounded text-sm">
                    <span className="font-semibold text-base-content/80">Generated regex pattern: </span>
                    <code className="font-mono text-primary">{config.responseStatuses}</code>
                  </div>
                )}
              </div>

              {/* Block Period */}
              <div className="form-control">
                <div className="flex items-center gap-2 mb-3">
                  <label className="label-text font-semibold">Block Period (seconds)</label>
                  <div className="tooltip" data-tip="Duration for which detected bots will be blocked">
                    <svg className="w-4 h-4 text-base-content/60 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <input
                  type="number"
                  min="1"
                  className="input input-bordered w-full"
                  value={config.blockPeriod}
                  onChange={(e) => setConfig(prev => ({ ...prev, blockPeriod: parseInt(e.target.value) || 300 }))}
                  placeholder="300"
                />
                <div className="label">
                  <span className="label-text-alt text-base-content/60">Default: 300 seconds (5 minutes)</span>
                </div>
              </div>

              {/* Fail Threshold */}
              <div className="form-control">
                <div className="flex items-center gap-2 mb-3">
                  <label className="label-text font-semibold">Fail Threshold</label>
                  <div className="tooltip" data-tip="Number of suspicious requests before blocking is triggered">
                    <svg className="w-4 h-4 text-base-content/60 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <input
                  type="number"
                  min="1"
                  className="input input-bordered w-full"
                  value={config.failThreshold}
                  onChange={(e) => setConfig(prev => ({ ...prev, failThreshold: parseInt(e.target.value) || 5 }))}
                  placeholder="5"
                />
                <div className="label">
                  <span className="label-text-alt text-base-content/60">Default: 5 requests</span>
                </div>
              </div>

              {/* Fail Window */}
              <div className="form-control">
                <div className="flex items-center gap-2 mb-3">
                  <label className="label-text font-semibold">Fail Window (seconds)</label>
                  <div className="tooltip" data-tip="Time period for counting fail attempts - fail count resets after this window">
                    <svg className="w-4 h-4 text-base-content/60 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <input
                  type="number"
                  min="1"
                  className="input input-bordered w-full"
                  value={config.failWindow}
                  onChange={(e) => setConfig(prev => ({ ...prev, failWindow: parseInt(e.target.value) || 60 }))}
                  placeholder="60"
                />
                <div className="label">
                  <span className="label-text-alt text-base-content/60">Default: 60 seconds</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Action - Google Captcha V2 */}
      {config.enabled && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-xl mb-6">Blocking Action: Google Captcha V2</h2>

            <div className="form-control w-52 mb-6">
              <label className="label cursor-pointer">
                <span className="label-text font-semibold">Enable Captcha V2 Verification</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={config.captchaV2.enabled}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    captchaV2: { ...prev.captchaV2, enabled: e.target.checked }
                  }))}
                />
              </label>
            </div>

            {config.captchaV2.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Redirect URL */}
                <div className="form-control md:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <label className="label-text font-semibold">Redirect URL</label>
                    <div className="tooltip" data-tip="URL to redirect users to after successful captcha verification">
                      <svg className="w-4 h-4 text-base-content/60 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <input
                    type="url"
                    className="input input-bordered w-full"
                    value={config.captchaV2.redirectUrl}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      captchaV2: { ...prev.captchaV2, redirectUrl: e.target.value }
                    }))}
                    placeholder="https://example.com/success"
                  />
                </div>

                {/* Site Key */}
                <div className="form-control">
                  <div className="flex items-center gap-2 mb-3">
                    <label className="label-text font-semibold">Site Key</label>
                    <div className="tooltip" data-tip="Google reCAPTCHA v2 site key (public key)">
                      <svg className="w-4 h-4 text-base-content/60 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={config.captchaV2.siteKey}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      captchaV2: { ...prev.captchaV2, siteKey: e.target.value }
                    }))}
                    placeholder="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                  />
                </div>

                {/* Secret Key */}
                <div className="form-control">
                  <div className="flex items-center gap-2 mb-3">
                    <label className="label-text font-semibold">Secret Key</label>
                    <div className="tooltip" data-tip="Google reCAPTCHA v2 secret key (private key)">
                      <svg className="w-4 h-4 text-base-content/60 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <input
                    type="password"
                    className="input input-bordered w-full"
                    value={config.captchaV2.secretKey}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      captchaV2: { ...prev.captchaV2, secretKey: e.target.value }
                    }))}
                    placeholder="6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          {/* Success/Error Messages */}
          {saveSuccess && (
            <div className="alert alert-success mb-4">
              <svg className="w-6 h-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>AntiBot configuration saved successfully!</span>
            </div>
          )}

          {saveError && (
            <div className="alert alert-error mb-4">
              <svg className="w-6 h-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{saveError}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              className="btn btn-primary"
              onClick={saveConfiguration}
              disabled={saving || !protectionId}
            >
              {saving && <span className="loading loading-spinner loading-sm"></span>}
              {saving ? 'Saving...' : 'Save AntiBot Configuration'}
              {!saving && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}