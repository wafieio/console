'use client';

import React, { useState, useEffect, use, useCallback } from 'react';

// Metadata moved to layout since this is now a client component

// User interface matching API requirements
interface BasicAuthUser {
  user: string;      // Changed from 'username'
  pass: string;      // Changed from 'password'
}

// Display state (what user sees in UI)
interface BasicAuthConfig {
  enabled: boolean;
  users: BasicAuthUser[];
  whitelistPaths: string[];
}

// Operation tracking (what gets sent to API)
interface BasicAuthOperations {
  users_to_add: BasicAuthUser[];
  users_to_remove: string[];           // Just usernames
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
        basicAuth?: {
          enabled?: boolean;
          users?: BasicAuthUser[];
          whitelistPaths?: string[];
        };
        tokenAuth: object;
      };
      antiBot?: object;
    };
  };
}

export default function BasicAuthPage({
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
  const [config, setConfig] = useState<BasicAuthConfig>({
    enabled: false,
    users: [],
    whitelistPaths: []
  });

  // Operation tracking (accumulates, never resets)
  const [operations, setOperations] = useState<BasicAuthOperations>({
    users_to_add: [],
    users_to_remove: [],
    path_whitelist_to_add: [],
    path_whitelist_to_remove: []
  });

  // Form states (updated field names)
  const [newUser, setNewUser] = useState({
    user: '',           // Changed from 'username'
    pass: '',           // Changed from 'password'
    confirmPass: ''     // Changed from 'confirmPassword'
  });

  // New whitelist path
  const [newWhitelistPath, setNewWhitelistPath] = useState('');
  const [whitelistPathError, setWhitelistPathError] = useState<string | null>(null);

  // Modal states (updated field names)
  const [editModal, setEditModal] = useState({
    isOpen: false,
    user: '',           // Changed from 'username'
    newPass: '',        // Changed from 'newPassword'
    confirmPass: ''     // Changed from 'confirmPassword'
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    user: ''            // Changed from 'username'
  });

  // Delete whitelist path modal state
  const [deleteWhitelistModal, setDeleteWhitelistModal] = useState({
    isOpen: false,
    path: ''
  });

  // Form error states (updated field names)
  const [formErrors, setFormErrors] = useState<{
    user?: string;
    pass?: string;
    confirmPass?: string;
  }>({});

  const [editModalErrors, setEditModalErrors] = useState<{
    pass?: string;
    confirmPass?: string;
  }>({});

  // Validation functions
  const validateUser = (user: string): string | undefined => {
    if (!user) return 'Username is required';
    if (user.length < 3) return 'Username must be at least 3 characters';
    if (user.length > 50) return 'Username must be less than 50 characters';
    if (!/^[a-zA-Z0-9_-]+$/.test(user)) return 'Username can only contain letters, numbers, underscores, and dashes';
    if (config.users.some(u => u.user === user)) return 'Username already exists';
    return undefined;
  };

  const validatePass = (pass: string): string | undefined => {
    if (!pass) return 'Password is required';
    return undefined;
  };

  const validateConfirmPass = (pass: string, confirm: string): string | undefined => {
    if (pass !== confirm) return 'Passwords do not match';
    return undefined;
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

      // Load basic auth config (for UI display)
      if (data.protection.desiredState?.auth?.basicAuth) {
        const basicAuth = data.protection.desiredState.auth.basicAuth;

        setConfig({
          enabled: basicAuth.enabled || false,
          users: basicAuth.users || [],
          whitelistPaths: basicAuth.whitelistPaths || []
        });

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
  const saveConfiguration = async () => {
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
      const basicAuthPayload: any = {
        enabled: config.enabled
      };

      // Only include non-empty arrays
      if (operations.users_to_add.length > 0) {
        basicAuthPayload.users_to_add = operations.users_to_add;
      }
      if (operations.users_to_remove.length > 0) {
        basicAuthPayload.users_to_remove = operations.users_to_remove;
      }
      if (operations.path_whitelist_to_add.length > 0) {
        basicAuthPayload.path_whitelist_to_add = operations.path_whitelist_to_add;
      }
      if (operations.path_whitelist_to_remove.length > 0) {
        basicAuthPayload.path_whitelist_to_remove = operations.path_whitelist_to_remove;
      }

      const requestBody = {
        id: currentProtectionId,
        basic_auth: basicAuthPayload
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

  // User management functions
  const handleAddUser = () => {
    // Validate form
    const errors = {
      user: validateUser(newUser.user),
      pass: validatePass(newUser.pass),
      confirmPass: validateConfirmPass(newUser.pass, newUser.confirmPass)
    };

    setFormErrors(errors);

    if (errors.user || errors.pass || errors.confirmPass) {
      return;
    }

    const newUserObj = {
      user: newUser.user,
      pass: newUser.pass
    };

    // Update config (for UI display)
    setConfig(prev => ({
      ...prev,
      users: [...prev.users, newUserObj]
    }));

    // Append to operations (accumulates)
    setOperations(prev => ({
      ...prev,
      users_to_add: [...prev.users_to_add, newUserObj]
    }));

    // Clear form
    setNewUser({ user: '', pass: '', confirmPass: '' });
    setFormErrors({});

    // Save immediately
    saveConfiguration();
  };

  const handlePasswordUpdate = () => {
    const passError = validatePass(editModal.newPass);
    const confirmError = validateConfirmPass(editModal.newPass, editModal.confirmPass);

    const errors = {
      pass: passError,
      confirmPass: confirmError
    };

    setEditModalErrors(errors);

    if (passError || confirmError) {
      return;
    }

    const username = editModal.user;
    const newPassword = editModal.newPass;

    // Update config (for UI display)
    setConfig(prev => ({
      ...prev,
      users: prev.users.map(u =>
        u.user === username
          ? { ...u, pass: newPassword }
          : u
      )
    }));

    // Append to operations: remove old + add new (accumulates)
    setOperations(prev => ({
      ...prev,
      users_to_remove: [...prev.users_to_remove, username],
      users_to_add: [...prev.users_to_add, { user: username, pass: newPassword }]
    }));

    // Close modal
    setEditModal({ isOpen: false, user: '', newPass: '', confirmPass: '' });
    setEditModalErrors({});

    // Save configuration
    saveConfiguration();
  };

  const handleDeleteUser = () => {
    const username = deleteModal.user;

    // Update config (for UI display)
    setConfig(prev => ({
      ...prev,
      users: prev.users.filter(u => u.user !== username)
    }));

    // Append to operations (accumulates)
    setOperations(prev => ({
      ...prev,
      users_to_remove: [...prev.users_to_remove, username]
    }));

    setDeleteModal({ isOpen: false, user: '' });
    saveConfiguration();
  };

  const handleClearForm = () => {
    setNewUser({ user: '', pass: '', confirmPass: '' });
    setFormErrors({});
  };

  // Whitelist path management functions
  const validateWhitelistPath = (path: string): string | null => {
    if (!path) return 'Path is required';
    if (!path.startsWith('/')) return 'Path must start with /';
    if (config.whitelistPaths.includes(path)) return 'Path already exists in whitelist';
    return null;
  };

  const handleAddWhitelistPath = () => {
    const error = validateWhitelistPath(newWhitelistPath);
    setWhitelistPathError(error);

    if (error) {
      return;
    }

    // Update config (for UI display)
    setConfig(prev => ({
      ...prev,
      whitelistPaths: [...prev.whitelistPaths, newWhitelistPath]
    }));

    // Append to operations (accumulates)
    setOperations(prev => ({
      ...prev,
      path_whitelist_to_add: [...prev.path_whitelist_to_add, newWhitelistPath]
    }));

    // Clear form
    setNewWhitelistPath('');
    setWhitelistPathError(null);

    // Save immediately
    saveConfiguration();
  };

  const handleDeleteWhitelistPath = () => {
    const pathToRemove = deleteWhitelistModal.path;

    // Update config (for UI display)
    setConfig(prev => ({
      ...prev,
      whitelistPaths: prev.whitelistPaths.filter(p => p !== pathToRemove)
    }));

    // Append to operations (accumulates)
    setOperations(prev => ({
      ...prev,
      path_whitelist_to_remove: [...prev.path_whitelist_to_remove, pathToRemove]
    }));

    setDeleteWhitelistModal({ isOpen: false, path: '' });
    saveConfiguration();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Basic Authentication</h1>
          <p className="text-base-content/60 mt-2">Loading basic authentication configuration...</p>
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
          <h1 className="text-3xl font-bold">Basic Authentication</h1>
          <p className="text-base-content/60 mt-2">Configure HTTP Basic Authentication for application access control</p>
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
        <h1 className="text-3xl font-bold">Basic Authentication</h1>
        <p className="text-base-content/60 mt-2">Configure HTTP Basic Authentication for application access control</p>
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
                Basic Authentication requires application protection to be enabled. Please enable protection first to use this feature.
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
          <span>Basic authentication configuration saved successfully!</span>
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
            <h2 className="card-title text-xl mb-4">Basic Auth Status</h2>
            <div className="form-control w-52">
              <label className="label cursor-pointer">
                <span className="label-text font-semibold">Enable Basic Auth</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-lg"
                  checked={config.enabled}
                  onChange={(e) => setConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                  disabled={saving}
                />
              </label>
            </div>
            <p className="text-base-content/70 text-sm mt-2">
              When enabled, users must provide valid credentials to access the application using HTTP Basic Authentication.
            </p>
          </div>
        </div>

        {/* Card 2: Add New User Form */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Add New User</h2>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Username</span>
              </label>
              <input
                type="text"
                className={`input input-bordered w-full ${formErrors.user ? 'input-error' : ''}`}
                value={newUser.user}
                onChange={(e) => setNewUser(prev => ({ ...prev, user: e.target.value }))}
                disabled={!config.enabled || saving}
              />
              {formErrors.user && (
                <label className="label">
                  <span className="label-text-alt text-error">{formErrors.user}</span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Password</span>
              </label>
              <input
                type="password"
                className={`input input-bordered w-full ${formErrors.pass ? 'input-error' : ''}`}
                value={newUser.pass}
                onChange={(e) => setNewUser(prev => ({ ...prev, pass: e.target.value }))}
                disabled={!config.enabled || saving}
              />
              {formErrors.pass && (
                <label className="label">
                  <span className="label-text-alt text-error">{formErrors.pass}</span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Confirm Password</span>
              </label>
              <input
                type="password"
                className={`input input-bordered w-full ${formErrors.confirmPass ? 'input-error' : ''}`}
                value={newUser.confirmPass}
                onChange={(e) => setNewUser(prev => ({ ...prev, confirmPass: e.target.value }))}
                disabled={!config.enabled || saving}
              />
              {formErrors.confirmPass && (
                <label className="label">
                  <span className="label-text-alt text-error">{formErrors.confirmPass}</span>
                </label>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                className="btn btn-primary flex-1"
                onClick={handleAddUser}
                disabled={!config.enabled || saving || !newUser.user || !newUser.pass || !newUser.confirmPass}
              >
                {saving && <span className="loading loading-spinner loading-sm"></span>}
                Add User
              </button>
              <button
                className="btn btn-ghost"
                onClick={handleClearForm}
                disabled={!config.enabled || saving}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 - Two Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Users Table */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Basic Auth Users</h2>

            {config.users.length === 0 ? (
              <div className="text-center py-12 text-base-content/60">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-lg">No users configured</p>
                <p className="text-sm mt-2">Add your first user using the form above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.users.map((user) => (
                      <tr key={user.user}>
                        <td className="font-medium">{user.user}</td>
                        <td className="text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              className="btn btn-sm btn-ghost"
                              onClick={() => {
                                setEditModal({
                                  isOpen: true,
                                  user: user.user,
                                  newPass: '',
                                  confirmPass: ''
                                });
                                setEditModalErrors({});
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
                              onClick={() => setDeleteModal({ isOpen: true, user: user.user })}
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
              Public paths that bypass basic authentication
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
                  placeholder="/public/assets"
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
              onClick={saveConfiguration}
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

      {/* Edit Password Modal */}
      {editModal.isOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Edit Password</h3>

            <div className="mb-4">
              <span className="badge badge-lg badge-primary">{editModal.user}</span>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">New Password</span>
              </label>
              <input
                type="password"
                className={`input input-bordered w-full ${editModalErrors.pass ? 'input-error' : ''}`}
                value={editModal.newPass}
                onChange={(e) => setEditModal(prev => ({ ...prev, newPass: e.target.value }))}
              />
              {editModalErrors.pass && (
                <label className="label">
                  <span className="label-text-alt text-error">{editModalErrors.pass}</span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Confirm New Password</span>
              </label>
              <input
                type="password"
                className={`input input-bordered w-full ${editModalErrors.confirmPass ? 'input-error' : ''}`}
                value={editModal.confirmPass}
                onChange={(e) => setEditModal(prev => ({ ...prev, confirmPass: e.target.value }))}
              />
              {editModalErrors.confirmPass && (
                <label className="label">
                  <span className="label-text-alt text-error">{editModalErrors.confirmPass}</span>
                </label>
              )}
            </div>

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setEditModal({ isOpen: false, user: '', newPass: '', confirmPass: '' });
                  setEditModalErrors({});
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePasswordUpdate}
                disabled={!editModal.newPass || !editModal.confirmPass}
              >
                Save Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Delete User</h3>

            <div className="alert alert-warning mb-4">
              <svg className="w-6 h-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <span>This action cannot be undone.</span>
            </div>

            <p className="mb-4">
              Are you sure you want to delete user <strong>{deleteModal.user}</strong>?
            </p>

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setDeleteModal({ isOpen: false, user: '' })}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={handleDeleteUser}
              >
                Delete User
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
