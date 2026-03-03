'use client';

import React, { useState, useEffect, use, useCallback } from 'react';

// Metadata moved to layout since this is now a client component

// IP Rule interface matching API requirements
interface IpRule {
  cidr: string;  // IP address or CIDR notation (e.g., "192.168.1.0/24" or "10.0.0.1")
}

// Configuration state (what user sees in UI)
interface IpRulesConfig {
  allow: IpRule[];    // Rules that allow traffic
  block: IpRule[];    // Rules that block traffic
}

// Operations that accumulate and are sent to API on Save
interface IpRulesOperations {
  ip_rules_to_add: {
    allow: IpRule[];
    block: IpRule[];
  };
  ip_rules_to_remove: {
    allow: IpRule[];
    block: IpRule[];
  };
}

// New rule form state
interface NewRuleForm {
  cidr: string;
  action: 'allow' | 'block';
}

// Response from GetProtection API
interface ProtectionResponse {
  protection: {
    id: number;
    applicationId: number;
    protectionMode: 'PROTECTION_MODE_ON' | 'PROTECTION_MODE_OFF';
    desiredState: {
      ipRules?: {
        allow?: IpRule[];
        block?: IpRule[];
      };
      auth: object;
      antiBot?: object;
    };
  };
}

export default function IPRulesPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const applicationId = parseInt(resolvedParams.id);

  // Protection and API states
  const [protectionId, setProtectionId] = useState<number | null>(null);
  const [protectionMode, setProtectionMode] = useState<'PROTECTION_MODE_ON' | 'PROTECTION_MODE_OFF' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Configuration (UI display) - loaded from backend
  const [config, setConfig] = useState<IpRulesConfig>({
    allow: [],
    block: []
  });

  // Operations (accumulates, sent to API on Save)
  const [operations, setOperations] = useState<IpRulesOperations>({
    ip_rules_to_add: { allow: [], block: [] },
    ip_rules_to_remove: { allow: [], block: [] }
  });

  // Form state
  const [newRule, setNewRule] = useState<NewRuleForm>({
    cidr: '',
    action: 'allow'
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    cidr: '',
    action: '' as 'allow' | 'block' | ''
  });

  // CIDR validation and normalization function
  const validateAndNormalizeCIDR = (cidr: string): { cidr: string; error: string | null } => {
    const trimmedCidr = cidr.trim();

    if (!trimmedCidr) {
      return { cidr: '', error: 'IP/CIDR is required' };
    }

    // IPv4 regex with optional CIDR mask
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(\/(\d|[1-2]\d|3[0-2]))?$/;
    const match = trimmedCidr.match(ipv4Regex);

    if (!match) {
      return { cidr: '', error: 'Invalid IP address or CIDR notation (e.g., 192.168.1.0/24 or 10.0.0.1)' };
    }

    // Check each octet is 0-255
    for (let i = 1; i <= 4; i++) {
      const octet = parseInt(match[i]);
      if (octet < 0 || octet > 255) {
        return { cidr: '', error: 'IP octets must be between 0 and 255' };
      }
    }

    // Normalize: add /32 if no CIDR mask provided
    const normalizedCidr = match[5] ? trimmedCidr : `${trimmedCidr}/32`;

    // Check for duplicates across both allow and block lists (each IP/CIDR must be unique)
    const allRules = [...config.allow, ...config.block];
    const existingRule = allRules.find(rule => rule.cidr === normalizedCidr);
    if (existingRule) {
      const existingType = config.allow.some(r => r.cidr === normalizedCidr) ? 'Allow' : 'Block';
      return { cidr: '', error: `This IP/CIDR already exists in the ${existingType} rules` };
    }

    return { cidr: normalizedCidr, error: null };
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
        // Protection not yet created
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

      // Load IP rules from desiredState
      if (data.protection.desiredState?.ipRules) {
        const ipRules = data.protection.desiredState.ipRules;

        setConfig({
          allow: ipRules.allow || [],
          block: ipRules.block || []
        });

        // CRITICAL: Do NOT reset operations (operations accumulate across page loads)
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

  // Save configuration (only called when user clicks Save Configuration button)
  const saveConfiguration = async () => {
    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      // Check if there are any operations to send
      const hasOperations =
        operations.ip_rules_to_add.allow.length > 0 ||
        operations.ip_rules_to_add.block.length > 0 ||
        operations.ip_rules_to_remove.allow.length > 0 ||
        operations.ip_rules_to_remove.block.length > 0;

      if (!hasOperations) {
        setSaveError('No changes to save. Please add or remove rules first.');
        setSaving(false);
        return;
      }

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

      // Build request body with only non-empty nested objects at root level
      const requestBody: any = { id: currentProtectionId };

      // Only include ip_rules_to_add if it has rules (allow or block non-empty)
      if (operations.ip_rules_to_add.allow.length > 0 ||
          operations.ip_rules_to_add.block.length > 0) {
        requestBody.ip_rules_to_add = {};
        if (operations.ip_rules_to_add.allow.length > 0) {
          requestBody.ip_rules_to_add.allow = operations.ip_rules_to_add.allow;
        }
        if (operations.ip_rules_to_add.block.length > 0) {
          requestBody.ip_rules_to_add.block = operations.ip_rules_to_add.block;
        }
      }

      // Only include ip_rules_to_remove if it has rules (allow or block non-empty)
      if (operations.ip_rules_to_remove.allow.length > 0 ||
          operations.ip_rules_to_remove.block.length > 0) {
        requestBody.ip_rules_to_remove = {};
        if (operations.ip_rules_to_remove.allow.length > 0) {
          requestBody.ip_rules_to_remove.allow = operations.ip_rules_to_remove.allow;
        }
        if (operations.ip_rules_to_remove.block.length > 0) {
          requestBody.ip_rules_to_remove.block = operations.ip_rules_to_remove.block;
        }
      }

      // Save configuration
      const response = await fetch('/api/wafie.v1.ProtectionService/PutProtection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Failed to save configuration: ${response.status}`);
      }

      // CRITICAL: Operations accumulate - do NOT reset operations after save

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  // Add rule handler (does NOT call saveConfiguration)
  const handleAddRule = () => {
    const { cidr: normalizedCidr, error } = validateAndNormalizeCIDR(newRule.cidr);

    if (error) {
      setFormError(error);
      return;
    }

    const ruleToAdd: IpRule = { cidr: normalizedCidr };

    // Update config (for UI display)
    setConfig(prev => ({
      ...prev,
      [newRule.action]: [...prev[newRule.action], ruleToAdd]
    }));

    // Update operations (accumulates)
    setOperations(prev => ({
      ...prev,
      ip_rules_to_add: {
        ...prev.ip_rules_to_add,
        [newRule.action]: [...prev.ip_rules_to_add[newRule.action], ruleToAdd]
      }
    }));

    // Clear form and errors
    setNewRule({ cidr: '', action: 'allow' });
    setFormError(null);

    // DO NOT call saveConfiguration (user must click Save Configuration button)
  };

  // Delete rule handler (does NOT call saveConfiguration)
  const handleDeleteRule = () => {
    const { cidr, action } = deleteModal;

    // Update config (for UI display)
    setConfig(prev => ({
      ...prev,
      [action]: prev[action as 'allow' | 'block'].filter(rule => rule.cidr !== cidr)
    }));

    // Update operations (accumulates)
    setOperations(prev => ({
      ...prev,
      ip_rules_to_remove: {
        ...prev.ip_rules_to_remove,
        [action]: [...prev.ip_rules_to_remove[action as 'allow' | 'block'], { cidr }]
      }
    }));

    // Close modal
    setDeleteModal({ isOpen: false, cidr: '', action: '' });

    // DO NOT call saveConfiguration (user must click Save Configuration button)
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">IP Rules</h1>
          <p className="text-base-content/60 mt-2">Loading IP rules configuration...</p>
        </div>
        <div className="card bg-base-100 shadow-md">
          <div className="card-body flex items-center justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">IP Rules</h1>
          <p className="text-base-content/60 mt-2">Configure IP-based access control rules and restrictions</p>
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

  // Main UI
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">IP Rules</h1>
        <p className="text-base-content/60 mt-2">Configure IP-based access control rules and restrictions</p>
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
                IP Rules require application protection to be enabled. Please enable protection first to use this feature.
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
          <span>IP rules configuration saved successfully!</span>
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

      {/* Row 1: Add New Rule Card */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">Add New Rule</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-control">
              <input
                type="text"
                className={`input input-bordered w-full ${formError ? 'input-error' : ''}`}
                placeholder="192.168.1.0/24 or 10.0.0.1"
                value={newRule.cidr}
                onChange={(e) => setNewRule(prev => ({ ...prev, cidr: e.target.value }))}
                disabled={saving}
              />
              {formError && (
                <label className="label">
                  <span className="label-text-alt text-error">{formError}</span>
                </label>
              )}
            </div>

            <div className="form-control">
              <select
                className="select select-bordered w-full"
                value={newRule.action}
                onChange={(e) => setNewRule(prev => ({ ...prev, action: e.target.value as 'allow' | 'block' }))}
                disabled={saving}
              >
                <option value="allow">Allow</option>
                <option value="block">Block</option>
              </select>
            </div>

            <div className="form-control">
              <button
                className="btn btn-primary"
                onClick={handleAddRule}
                disabled={saving || !newRule.cidr.trim()}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: IP Rules Table Card */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">IP Rules</h2>

          {config.allow.length === 0 && config.block.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-lg">No IP rules configured</p>
              <p className="text-sm mt-2">Add your first rule using the form above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>IP/CIDR</th>
                    <th>Type</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Allow rules */}
                  {config.allow.map((rule) => (
                    <tr key={`allow-${rule.cidr}`}>
                      <td className="font-mono">{rule.cidr}</td>
                      <td>
                        <span className="badge badge-success">Allow</span>
                      </td>
                      <td className="text-right">
                        <button
                          className="btn btn-sm btn-ghost text-error"
                          onClick={() => setDeleteModal({ isOpen: true, cidr: rule.cidr, action: 'allow' })}
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
                  {/* Block rules */}
                  {config.block.map((rule) => (
                    <tr key={`block-${rule.cidr}`}>
                      <td className="font-mono">{rule.cidr}</td>
                      <td>
                        <span className="badge badge-error">Block</span>
                      </td>
                      <td className="text-right">
                        <button
                          className="btn btn-sm btn-ghost text-error"
                          onClick={() => setDeleteModal({ isOpen: true, cidr: rule.cidr, action: 'block' })}
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

      {/* Bottom: Save Configuration Button */}
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

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Delete IP Rule</h3>

            <div className="alert alert-warning mb-4">
              <svg className="w-6 h-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <span>This action cannot be undone.</span>
            </div>

            <p className="mb-4">
              Are you sure you want to delete the IP rule <code className="font-mono bg-base-200 px-2 py-1 rounded">{deleteModal.cidr}</code>?
            </p>

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setDeleteModal({ isOpen: false, cidr: '', action: '' })}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={handleDeleteRule}
              >
                Delete Rule
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
