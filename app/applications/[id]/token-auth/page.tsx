'use client';

import React, { useState, useEffect, use, useCallback } from 'react';

// Metadata moved to layout since this is now a client component

// Token interface matching API requirements
interface TokenAuthToken {
  token: string;              // Token string
  valid_after?: string;       // ISO 8601 timestamp (optional)
  valid_before?: string;      // ISO 8601 timestamp (optional, must be > valid_after if provided)
  description?: string;       // Token description (max 200 chars, optional)
}

// Display state (what user sees in UI)
interface TokenAuthConfig {
  enabled: boolean;
  header: string;             // HTTP header name (1-100 chars)
  tokens: TokenAuthToken[];
  whitelistPaths: string[];
}

// Operation tracking (what gets sent to API)
interface TokenAuthOperations {
  tokens_to_add: TokenAuthToken[];
  tokens_to_remove: TokenAuthToken[];
  path_whitelist_to_add: string[];
  path_whitelist_to_remove: string[];
}

// Response from GetProtection API
interface ProtectionResponse {
  protection: {
    id: number;
    applicationId: number;
    protectionMode: 'PROTECTION_MODE_ON' | 'PROTECTION_MODE_OFF';
    desiredState: {
      ipRules: object;
      auth: {
        basicAuth: object;
        tokenAuth?: {
          enabled?: boolean;
          header?: string;
          tokens?: TokenAuthToken[];
          whitelistPaths?: string[];
        };
      };
      antiBot?: object;
    };
  };
}

export default function TokenAuthPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const applicationId = parseInt(resolvedParams.id);

  // Protection and loading states
  const [protectionId, setProtectionId] = useState<number | null>(null);
  const [protectionMode, setProtectionMode] = useState<'PROTECTION_MODE_ON' | 'PROTECTION_MODE_OFF' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Current configuration (for UI display)
  const [config, setConfig] = useState<TokenAuthConfig>({
    enabled: false,
    header: 'Authorization',
    tokens: [],
    whitelistPaths: []
  });

  // Operation tracking (accumulates, never resets)
  const [operations, setOperations] = useState<TokenAuthOperations>({
    tokens_to_add: [],
    tokens_to_remove: [],
    path_whitelist_to_add: [],
    path_whitelist_to_remove: []
  });

  // Header edit state
  const [headerInput, setHeaderInput] = useState('Authorization');
  const [headerError, setHeaderError] = useState<string | null>(null);

  // New whitelist path
  const [newWhitelistPath, setNewWhitelistPath] = useState('');
  const [whitelistPathError, setWhitelistPathError] = useState<string | null>(null);

  // Modal states
  const [addTokenModal, setAddTokenModal] = useState({
    isOpen: false,
    token: '',
    valid_after: '',
    valid_before: '',
    description: ''
  });

  const [editTokenModal, setEditTokenModal] = useState({
    isOpen: false,
    originalToken: null as TokenAuthToken | null,
    token: '',
    valid_after: '',
    valid_before: '',
    description: ''
  });

  const [deleteTokenModal, setDeleteTokenModal] = useState({
    isOpen: false,
    token: null as TokenAuthToken | null
  });

  const [deleteWhitelistModal, setDeleteWhitelistModal] = useState({
    isOpen: false,
    path: ''
  });

  // Form error states
  const [addTokenErrors, setAddTokenErrors] = useState<{
    token?: string;
    valid_after?: string;
    valid_before?: string;
    description?: string;
  }>({});

  const [editTokenErrors, setEditTokenErrors] = useState<{
    token?: string;
    valid_after?: string;
    valid_before?: string;
    description?: string;
  }>({});

  // Utility functions
  const datetimeLocalToISO = (datetimeLocal: string): string => {
    // Convert YYYY-MM-DDTHH:mm to ISO 8601
    return new Date(datetimeLocal).toISOString();
  };

  const isoToDatetimeLocal = (iso: string): string => {
    // Convert ISO 8601 to YYYY-MM-DDTHH:mm
    const date = new Date(iso);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const maskToken = (token: string): string => {
    // Display token as abcd••••••••1234 (first 4 + dots + last 4)
    if (token.length <= 8) {
      return '••••••••';
    }
    const first4 = token.substring(0, 4);
    const last4 = token.substring(token.length - 4);
    const dotsCount = Math.min(token.length - 8, 10);
    const dots = '•'.repeat(dotsCount);
    return `${first4}${dots}${last4}`;
  };

  const formatDate = (iso: string): string => {
    // Format ISO date as "Jan 15, 2026, 02:30 PM"
    const date = new Date(iso);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Validation functions
  const validateToken = (token: string, isEdit = false, originalToken = ''): string | undefined => {
    if (!token) return 'Token is required';

    // Check for duplicates (except when editing the same token)
    if (config.tokens.some(t => t.token === token && token !== originalToken)) {
      return 'Token already exists';
    }

    return undefined;
  };

  const validateValidAfter = (validAfter: string): string | undefined => {
    // Optional field
    if (!validAfter) return undefined;

    try {
      new Date(validAfter);
      return undefined;
    } catch {
      return 'Invalid date format';
    }
  };

  const validateValidBefore = (validBefore: string, validAfter: string): string | undefined => {
    // Optional field
    if (!validBefore) return undefined;

    try {
      const beforeDate = new Date(validBefore);

      // Only validate relationship if both dates are provided
      if (validAfter) {
        const afterDate = new Date(validAfter);
        if (beforeDate <= afterDate) {
          return 'Valid before must be after valid after date';
        }
      }

      return undefined;
    } catch {
      return 'Invalid date format';
    }
  };

  const validateDescription = (description: string): string | undefined => {
    // Description is optional
    if (!description) return undefined;
    if (description.length > 200) return 'Description must be less than 200 characters';
    return undefined;
  };

  const validateHeaderName = (header: string): string | null => {
    if (!header) return 'Header name is required';
    if (header.length < 1 || header.length > 100) return 'Header name must be 1-100 characters';
    if (!/^[a-zA-Z0-9_-]+$/.test(header)) return 'Header name can only contain alphanumeric characters, hyphens, and underscores';
    return null;
  };

  const validateWhitelistPath = (path: string): string | null => {
    if (!path) return 'Path is required';
    if (!path.startsWith('/')) return 'Path must start with /';
    if (config.whitelistPaths.includes(path)) return 'Path already exists in whitelist';
    return null;
  };

  // Fetch protection data
  const fetchProtectionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/wafie.v1.ProtectionService/GetProtection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId })
      });

      if (response.status === 404) {
        setProtectionId(null);
        setProtectionMode(null);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError(`Failed to fetch protection data: ${response.status}`);
        setLoading(false);
        return;
      }

      const data: ProtectionResponse = await response.json();
      setProtectionId(data.protection.id);
      setProtectionMode(data.protection.protectionMode);

      // Load token auth config (for UI display)
      if (data.protection.desiredState?.auth?.tokenAuth) {
        const tokenAuth = data.protection.desiredState.auth.tokenAuth;

        const newConfig = {
          enabled: tokenAuth.enabled || false,
          header: tokenAuth.header || 'Authorization',
          tokens: tokenAuth.tokens || [],
          whitelistPaths: tokenAuth.whitelistPaths || []
        };

        setConfig(newConfig);
        setHeaderInput(newConfig.header);

        // Operations remain unchanged (accumulate across loads)
        // Do NOT reset operations here
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch protection data');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchProtectionData();
  }, [fetchProtectionData]);

  // Save configuration
  const saveConfiguration = async (
    configToSave: TokenAuthConfig = config,
    operationsToSave: TokenAuthOperations = operations
  ) => {
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      let currentProtectionId = protectionId;

      // Create protection if it doesn't exist
      if (!currentProtectionId) {
        const createResponse = await fetch('/api/wafie.v1.ProtectionService/CreateProtection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ application_id: applicationId })
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create protection');
        }

        const createData = await createResponse.json();
        currentProtectionId = createData.protection.id;
        setProtectionId(currentProtectionId);
      }

      // Build request body with only non-empty operation arrays
      const tokenAuthPayload: any = {
        enabled: configToSave.enabled,
        header: configToSave.header
      };

      // Only include non-empty arrays
      if (operationsToSave.tokens_to_add.length > 0) {
        tokenAuthPayload.tokens_to_add = operationsToSave.tokens_to_add;
      }
      if (operationsToSave.tokens_to_remove.length > 0) {
        tokenAuthPayload.tokens_to_remove = operationsToSave.tokens_to_remove;
      }
      if (operationsToSave.path_whitelist_to_add.length > 0) {
        tokenAuthPayload.path_whitelist_to_add = operationsToSave.path_whitelist_to_add;
      }
      if (operationsToSave.path_whitelist_to_remove.length > 0) {
        tokenAuthPayload.path_whitelist_to_remove = operationsToSave.path_whitelist_to_remove;
      }

      const requestBody = {
        id: currentProtectionId,
        token_auth: tokenAuthPayload
      };

      // Save configuration
      const response = await fetch('/api/wafie.v1.ProtectionService/PutProtection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Failed to save configuration: ${response.status}`);
      }

      // Operations accumulate - do NOT reset operations after save

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  // Toggle handler
  const handleToggleEnabled = (enabled: boolean) => {
    const updatedConfig = { ...config, enabled };
    setConfig(updatedConfig);
    saveConfiguration(updatedConfig, operations);
  };

  // Header management
  const handleHeaderBlur = () => {
    const error = validateHeaderName(headerInput);
    setHeaderError(error);

    if (!error && headerInput !== config.header) {
      const updatedConfig = { ...config, header: headerInput };
      setConfig(updatedConfig);
      saveConfiguration(updatedConfig, operations);
    }
  };

  // Token management functions
  const handleAddToken = () => {
    // Validate form
    const errors = {
      token: validateToken(addTokenModal.token),
      valid_after: validateValidAfter(addTokenModal.valid_after),
      valid_before: validateValidBefore(addTokenModal.valid_before, addTokenModal.valid_after),
      description: validateDescription(addTokenModal.description)
    };

    setAddTokenErrors(errors);

    if (errors.token || errors.valid_after || errors.valid_before || errors.description) {
      return;
    }

    const newToken: any = {
      token: addTokenModal.token
    };

    // Only include optional fields if they have values
    if (addTokenModal.description) {
      newToken.description = addTokenModal.description;
    }
    if (addTokenModal.valid_after) {
      newToken.valid_after = datetimeLocalToISO(addTokenModal.valid_after);
    }
    if (addTokenModal.valid_before) {
      newToken.valid_before = datetimeLocalToISO(addTokenModal.valid_before);
    }

    // Update config (for UI display)
    const updatedConfig = {
      ...config,
      tokens: [...config.tokens, newToken]
    };
    setConfig(updatedConfig);

    // Append to operations (accumulates)
    const updatedOperations = {
      ...operations,
      tokens_to_add: [...operations.tokens_to_add, newToken]
    };
    setOperations(updatedOperations);

    // Clear form and close modal
    setAddTokenModal({
      isOpen: false,
      token: '',
      valid_after: '',
      valid_before: '',
      description: ''
    });
    setAddTokenErrors({});

    // Save immediately with updated values
    saveConfiguration(updatedConfig, updatedOperations);
  };

  const handleUpdateToken = () => {
    if (!editTokenModal.originalToken) return;

    // Validate form
    const errors = {
      token: validateToken(editTokenModal.token, true, editTokenModal.originalToken.token),
      valid_after: validateValidAfter(editTokenModal.valid_after),
      valid_before: validateValidBefore(editTokenModal.valid_before, editTokenModal.valid_after),
      description: validateDescription(editTokenModal.description)
    };

    setEditTokenErrors(errors);

    if (errors.token || errors.valid_after || errors.valid_before || errors.description) {
      return;
    }

    const updatedToken: any = {
      token: editTokenModal.token
    };

    // Only include optional fields if they have values
    if (editTokenModal.description) {
      updatedToken.description = editTokenModal.description;
    }
    if (editTokenModal.valid_after) {
      updatedToken.valid_after = datetimeLocalToISO(editTokenModal.valid_after);
    }
    if (editTokenModal.valid_before) {
      updatedToken.valid_before = datetimeLocalToISO(editTokenModal.valid_before);
    }

    // Update config (for UI display)
    const updatedConfig = {
      ...config,
      tokens: config.tokens.map(t =>
        t.token === editTokenModal.originalToken!.token ? updatedToken : t
      )
    };
    setConfig(updatedConfig);

    // Append to operations: remove old + add new (accumulates)
    const updatedOperations = {
      ...operations,
      tokens_to_remove: [...operations.tokens_to_remove, editTokenModal.originalToken!],
      tokens_to_add: [...operations.tokens_to_add, updatedToken]
    };
    setOperations(updatedOperations);

    // Close modal
    setEditTokenModal({
      isOpen: false,
      originalToken: null,
      token: '',
      valid_after: '',
      valid_before: '',
      description: ''
    });
    setEditTokenErrors({});

    // Save configuration with updated values
    saveConfiguration(updatedConfig, updatedOperations);
  };

  const handleDeleteToken = () => {
    if (!deleteTokenModal.token) return;

    const tokenToDelete = deleteTokenModal.token;

    // Update config (for UI display)
    const updatedConfig = {
      ...config,
      tokens: config.tokens.filter(t => t.token !== tokenToDelete.token)
    };
    setConfig(updatedConfig);

    // Append to operations (accumulates)
    const updatedOperations = {
      ...operations,
      tokens_to_remove: [...operations.tokens_to_remove, tokenToDelete]
    };
    setOperations(updatedOperations);

    setDeleteTokenModal({ isOpen: false, token: null });
    saveConfiguration(updatedConfig, updatedOperations);
  };

  // Whitelist path management functions
  const handleAddWhitelistPath = () => {
    const error = validateWhitelistPath(newWhitelistPath);
    setWhitelistPathError(error);

    if (error) {
      return;
    }

    // Update config (for UI display)
    const updatedConfig = {
      ...config,
      whitelistPaths: [...config.whitelistPaths, newWhitelistPath]
    };
    setConfig(updatedConfig);

    // Append to operations (accumulates)
    const updatedOperations = {
      ...operations,
      path_whitelist_to_add: [...operations.path_whitelist_to_add, newWhitelistPath]
    };
    setOperations(updatedOperations);

    // Clear form
    setNewWhitelistPath('');
    setWhitelistPathError(null);

    // Save immediately with updated values
    saveConfiguration(updatedConfig, updatedOperations);
  };

  const handleDeleteWhitelistPath = () => {
    const pathToRemove = deleteWhitelistModal.path;

    // Update config (for UI display)
    const updatedConfig = {
      ...config,
      whitelistPaths: config.whitelistPaths.filter(p => p !== pathToRemove)
    };
    setConfig(updatedConfig);

    // Append to operations (accumulates)
    const updatedOperations = {
      ...operations,
      path_whitelist_to_remove: [...operations.path_whitelist_to_remove, pathToRemove]
    };
    setOperations(updatedOperations);

    setDeleteWhitelistModal({ isOpen: false, path: '' });
    saveConfiguration(updatedConfig, updatedOperations);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Token Authentication</h1>
          <p className="text-base-content/60 mt-2">Loading token authentication configuration...</p>
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
          <h1 className="text-3xl font-bold">Token Authentication</h1>
          <p className="text-base-content/60 mt-2">Configure API token-based authentication for application access</p>
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
        <h1 className="text-3xl font-bold">Token Authentication</h1>
        <p className="text-base-content/60 mt-2">Configure API token-based authentication for application access</p>
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
                Token Authentication requires application protection to be enabled. Please enable protection first to use this feature.
              </p>
              <a href={`/applications/${applicationId}/overview`} className="btn btn-primary">
                Go to Application Overview
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {isProtectionEnabled && (
      <>
      {saveSuccess && (
        <div className="alert alert-success">
          <svg className="w-6 h-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Token authentication configuration saved successfully!</span>
        </div>
      )}

      {saveError && (
        <div className="alert alert-error">
          <svg className="w-6 h-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>{saveError}</span>
        </div>
      )}

      {/* Row 1 - Two Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Enable/Disable Toggle */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Token Auth Status</h2>
            <div className="form-control w-52">
              <label className="label cursor-pointer">
                <span className="label-text font-semibold">Enable Token Auth</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-lg"
                  checked={config.enabled}
                  onChange={(e) => handleToggleEnabled(e.target.checked)}
                  disabled={saving}
                />
              </label>
            </div>
            <p className="text-base-content/70 text-sm mt-2">
              When enabled, users must provide a valid API token to access the application.
            </p>
          </div>
        </div>

        {/* Card 2: Header Configuration */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Authorization Header Configuration</h2>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Authorization Header Name</span>
              </label>
              <input
                type="text"
                className={`input input-bordered w-full ${headerError ? 'input-error' : ''}`}
                value={headerInput}
                onChange={(e) => setHeaderInput(e.target.value)}
                onBlur={handleHeaderBlur}
                placeholder="Authorization"
                disabled={!config.enabled || saving}
              />
              {headerError && (
                <label className="label">
                  <span className="label-text-alt text-error">{headerError}</span>
                </label>
              )}
              <label className="label">
                <span className="label-text-alt">The HTTP header that will contain the authentication token</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 - Two Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Tokens Table */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title text-xl">API Tokens</h2>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setAddTokenModal({
                  isOpen: true,
                  token: '',
                  valid_after: '',
                  valid_before: '',
                  description: ''
                })}
                disabled={!config.enabled || saving}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Token
              </button>
            </div>

            {config.tokens.length === 0 ? (
              <div className="text-center py-12 text-base-content/60">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <p className="text-lg">No tokens configured</p>
                <p className="text-sm mt-2">Add your first token to enable API access</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Valid After</th>
                      <th>Valid Before</th>
                      <th>Description</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.tokens.map((token, index) => (
                      <tr key={index}>
                        <td className="font-mono text-sm">{maskToken(token.token)}</td>
                        <td className="text-sm">{token.valid_after ? formatDate(token.valid_after) : <span className="text-base-content/60">N/A</span>}</td>
                        <td className="text-sm">{token.valid_before ? formatDate(token.valid_before) : <span className="text-base-content/60">N/A</span>}</td>
                        <td className="text-sm">{token.description || <span className="text-base-content/60">N/A</span>}</td>
                        <td className="text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={() => {
                                setEditTokenModal({
                                  isOpen: true,
                                  originalToken: token,
                                  token: token.token,
                                  valid_after: token.valid_after ? isoToDatetimeLocal(token.valid_after) : '',
                                  valid_before: token.valid_before ? isoToDatetimeLocal(token.valid_before) : '',
                                  description: token.description || ''
                                });
                                setEditTokenErrors({});
                              }}
                              disabled={saving}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-ghost text-error"
                              onClick={() => setDeleteTokenModal({ isOpen: true, token })}
                              disabled={saving}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Whitelist Paths */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Whitelist Paths</h2>
            <p className="text-base-content/70 text-sm mb-4">
              Public paths that bypass token authentication
            </p>

            {/* Add whitelist path form */}
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold">Add New Path</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className={`input input-bordered flex-1 ${whitelistPathError ? 'input-error' : ''}`}
                  value={newWhitelistPath}
                  onChange={(e) => setNewWhitelistPath(e.target.value)}
                  placeholder="/public/health"
                  disabled={!config.enabled || saving}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleAddWhitelistPath}
                  disabled={!config.enabled || saving || !newWhitelistPath}
                >
                  Add
                </button>
              </div>
              {whitelistPathError && (
                <label className="label">
                  <span className="label-text-alt text-error">{whitelistPathError}</span>
                </label>
              )}
            </div>

            {/* Whitelist paths table */}
            {config.whitelistPaths.length === 0 ? (
              <div className="text-center py-12 text-base-content/60">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-lg">No whitelist paths</p>
                <p className="text-sm mt-2">All paths require authentication</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Path</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.whitelistPaths.map((path) => (
                      <tr key={path}>
                        <td className="font-mono">{path}</td>
                        <td className="text-right">
                          <button
                            className="btn btn-sm btn-ghost text-error"
                            onClick={() => setDeleteWhitelistModal({ isOpen: true, path })}
                            disabled={saving}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Configuration Button */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <div className="flex justify-end">
            <button
              className="btn btn-primary"
              onClick={() => saveConfiguration()}
              disabled={saving}
            >
              {saving && <span className="loading loading-spinner loading-sm"></span>}
              {saving ? 'Saving...' : 'Save Configuration'}
              {!saving && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Add Token Modal */}
      {addTokenModal.isOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Add New Token</h3>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold">Token</span>
              </label>
              <input
                type="text"
                className={`input input-bordered w-full ${addTokenErrors.token ? 'input-error' : ''}`}
                value={addTokenModal.token}
                onChange={(e) => setAddTokenModal(prev => ({ ...prev, token: e.target.value }))}
                placeholder="Enter your API token"
              />
              {addTokenErrors.token && (
                <label className="label">
                  <span className="label-text-alt text-error">{addTokenErrors.token}</span>
                </label>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Valid After <span className="text-base-content/60 font-normal">(Optional)</span></span>
                </label>
                <input
                  type="datetime-local"
                  className={`input input-bordered w-full ${addTokenErrors.valid_after ? 'input-error' : ''}`}
                  value={addTokenModal.valid_after}
                  onChange={(e) => setAddTokenModal(prev => ({ ...prev, valid_after: e.target.value }))}
                />
                {addTokenErrors.valid_after && (
                  <label className="label">
                    <span className="label-text-alt text-error">{addTokenErrors.valid_after}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Valid Before <span className="text-base-content/60 font-normal">(Optional)</span></span>
                </label>
                <input
                  type="datetime-local"
                  className={`input input-bordered w-full ${addTokenErrors.valid_before ? 'input-error' : ''}`}
                  value={addTokenModal.valid_before}
                  onChange={(e) => setAddTokenModal(prev => ({ ...prev, valid_before: e.target.value }))}
                />
                {addTokenErrors.valid_before && (
                  <label className="label">
                    <span className="label-text-alt text-error">{addTokenErrors.valid_before}</span>
                  </label>
                )}
              </div>
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold">Description (Optional)</span>
              </label>
              <textarea
                className={`textarea textarea-bordered w-full ${addTokenErrors.description ? 'textarea-error' : ''}`}
                value={addTokenModal.description}
                onChange={(e) => setAddTokenModal(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the purpose of this token"
                rows={3}
              />
              {addTokenErrors.description && (
                <label className="label">
                  <span className="label-text-alt text-error">{addTokenErrors.description}</span>
                </label>
              )}
              <label className="label">
                <span className="label-text-alt">Maximum 200 characters</span>
              </label>
            </div>

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setAddTokenModal({
                    isOpen: false,
                    token: '',
                    valid_after: '',
                    valid_before: '',
                    description: ''
                  });
                  setAddTokenErrors({});
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddToken}
                disabled={!addTokenModal.token || !addTokenModal.description}
              >
                Add Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Token Modal */}
      {editTokenModal.isOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Edit Token</h3>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold">Token</span>
              </label>
              <input
                type="text"
                className={`input input-bordered w-full ${editTokenErrors.token ? 'input-error' : ''}`}
                value={editTokenModal.token}
                onChange={(e) => setEditTokenModal(prev => ({ ...prev, token: e.target.value }))}
                placeholder="Enter your API token"
              />
              {editTokenErrors.token && (
                <label className="label">
                  <span className="label-text-alt text-error">{editTokenErrors.token}</span>
                </label>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Valid After <span className="text-base-content/60 font-normal">(Optional)</span></span>
                </label>
                <input
                  type="datetime-local"
                  className={`input input-bordered w-full ${editTokenErrors.valid_after ? 'input-error' : ''}`}
                  value={editTokenModal.valid_after}
                  onChange={(e) => setEditTokenModal(prev => ({ ...prev, valid_after: e.target.value }))}
                />
                {editTokenErrors.valid_after && (
                  <label className="label">
                    <span className="label-text-alt text-error">{editTokenErrors.valid_after}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Valid Before <span className="text-base-content/60 font-normal">(Optional)</span></span>
                </label>
                <input
                  type="datetime-local"
                  className={`input input-bordered w-full ${editTokenErrors.valid_before ? 'input-error' : ''}`}
                  value={editTokenModal.valid_before}
                  onChange={(e) => setEditTokenModal(prev => ({ ...prev, valid_before: e.target.value }))}
                />
                {editTokenErrors.valid_before && (
                  <label className="label">
                    <span className="label-text-alt text-error">{editTokenErrors.valid_before}</span>
                  </label>
                )}
              </div>
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold">Description (Optional)</span>
              </label>
              <textarea
                className={`textarea textarea-bordered w-full ${editTokenErrors.description ? 'textarea-error' : ''}`}
                value={editTokenModal.description}
                onChange={(e) => setEditTokenModal(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the purpose of this token"
                rows={3}
              />
              {editTokenErrors.description && (
                <label className="label">
                  <span className="label-text-alt text-error">{editTokenErrors.description}</span>
                </label>
              )}
              <label className="label">
                <span className="label-text-alt">Maximum 200 characters</span>
              </label>
            </div>

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setEditTokenModal({
                    isOpen: false,
                    originalToken: null,
                    token: '',
                    valid_after: '',
                    valid_before: '',
                    description: ''
                  });
                  setEditTokenErrors({});
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpdateToken}
                disabled={!editTokenModal.token || !editTokenModal.description}
              >
                Update Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Token Confirmation Modal */}
      {deleteTokenModal.isOpen && deleteTokenModal.token && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Delete Token</h3>

            <div className="alert alert-warning mb-4">
              <svg className="w-6 h-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <span>This action cannot be undone.</span>
            </div>

            <div className="mb-4">
              <p className="mb-2">Are you sure you want to delete this token?</p>
              <div className="bg-base-200 p-4 rounded-lg">
                <p className="text-sm"><strong>Token:</strong> <span className="font-mono">{maskToken(deleteTokenModal.token.token)}</span></p>
                {deleteTokenModal.token.description && (
                  <p className="text-sm mt-1"><strong>Description:</strong> {deleteTokenModal.token.description}</p>
                )}
              </div>
            </div>

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setDeleteTokenModal({ isOpen: false, token: null })}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={handleDeleteToken}
              >
                Delete Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Whitelist Path Confirmation Modal */}
      {deleteWhitelistModal.isOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Delete Whitelist Path</h3>

            <div className="alert alert-warning mb-4">
              <svg className="w-6 h-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <span>This action cannot be undone.</span>
            </div>

            <p className="mb-4">
              Are you sure you want to delete the whitelist path <code className="font-mono bg-base-200 px-2 py-1 rounded">{deleteWhitelistModal.path}</code>?
            </p>

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setDeleteWhitelistModal({ isOpen: false, path: '' })}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={handleDeleteWhitelistPath}
              >
                Delete Path
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
