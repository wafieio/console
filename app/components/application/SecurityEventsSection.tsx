'use client';

import { useState, useEffect, Fragment } from 'react';
import { AiOutlineAlert } from "react-icons/ai";

interface SecurityEvent {
  tag: string;
  time: string;
  data: {
    time: number;
    transaction: {
      client_ip: string;
      client_port: number;
      host_ip: string;
      host_port: number;
      messages: Array<{
        details: {
          accuracy: string;
          data: string;
          file: string;
          lineNumber: string;
          match: string;
          maturity: string;
          reference: string;
          rev: string;
          ruleId: string;
          severity: string;
          tags: string[];
          ver: string;
        };
        message: string;
      }>;
      producer: {
        components: string[];
        connector: string;
        modsecurity: string;
        secrules_engine: string;
      };
      request: {
        headers: Record<string, string>;
        hostname: string;
        http_version: string;
        method: string;
        uri: string;
      };
      response: {
        body: string;
        headers: Record<string, string>;
        http_code: number;
      };
      server_id: string;
      time_stamp: string;
      unique_id: string;
    };
  };
}

interface SecurityEventsResponse {
  events: SecurityEvent[];
}

interface SecurityEventsSectionProps {
  protectionId: string;
  isProtectionEnabled: boolean;
}

export function SecurityEventsSection({ protectionId, isProtectionEnabled }: SecurityEventsSectionProps) {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const eventsPerPage = 10;
  const totalPages = Math.ceil(events.length / eventsPerPage);
  const startIndex = (currentPage - 1) * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const currentEvents = events.slice(startIndex, endIndex);

  useEffect(() => {
    if (isProtectionEnabled && protectionId !== '-') {
      fetchEvents();
    }
  }, [isProtectionEnabled, protectionId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/wafie.v1.EventService/ListEvents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protection_id: parseInt(protectionId)
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const data: SecurityEventsResponse = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch security events');
      console.error('Error fetching security events:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpansion = (index: number) => {
    const globalIndex = startIndex + index;
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(globalIndex)) {
        newSet.delete(globalIndex);
      } else {
        newSet.add(globalIndex);
      }
      return newSet;
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Don't render if protection is not enabled
  if (!isProtectionEnabled) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">

          <div>
            <h2 className="text-2xl font-bold">Security Events</h2>
            <p className="text-base-content/60">Real-time security events and alerts</p>
          </div>
        </div>
        <button
          onClick={fetchEvents}
          className="btn btn-outline btn-sm"
          disabled={loading}
        >
          {loading && <span className="loading loading-spinner loading-sm"></span>}
          Refresh
        </button>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-error mb-4">
                <AiOutlineAlert className="text-4xl mx-auto mb-2" />
                <p>{error}</p>
              </div>
              <button
                onClick={fetchEvents}
                className="btn btn-primary btn-sm"
              >
                Try Again
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <AiOutlineAlert className="text-4xl text-base-content/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Security Events</h3>
              <p className="text-base-content/60">No security events have been recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Events Table */}
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th><span className="badge badge-info">Time</span></th>
                      <th><span className="badge badge-info">Client IP</span></th>
                      <th><span className="badge badge-info">Message</span></th>
                      <th><span className="badge badge-info">Rule ID</span></th>
                      <th><span className="badge badge-info">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEvents.map((event, index) => {
                      const globalIndex = startIndex + index;
                      const isExpanded = expandedRows.has(globalIndex);
                      const firstMessage = event.data.transaction.messages?.[0];

                      return (
                        <Fragment key={globalIndex}>
                          <tr className="hover">
                            <td className="font-mono text-sm">
                              {formatTime(event.data.time)}
                            </td>
                            <td className="font-mono">
                              {event.data.transaction.client_ip}
                            </td>
                            <td className="max-w-xs truncate">
                              {firstMessage?.message || 'No message'}
                            </td>
                            <td className="font-mono">
                              <span className="badge badge-neutral">
                                {firstMessage?.details?.ruleId || 'N/A'}
                              </span>
                            </td>
                            <td>
                              <button
                                onClick={() => toggleRowExpansion(index)}
                                className="btn btn-ghost btn-sm"
                              >
                                {isExpanded ? 'Hide Details' : 'Details'}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={5} className="bg-base-200">
                                <div className="p-4">
                                  <h4 className="font-semibold mb-3">Event Details</h4>
                                  <div className="mockup-code">
                                    <pre className="text-sm overflow-x-auto">
                                      {JSON.stringify(event, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center">
                  <div className="text-sm text-base-content/70">
                    Showing {startIndex + 1}-{Math.min(endIndex, events.length)} of {events.length} events
                  </div>
                  <div className="join">
                    <button
                      className="join-item btn btn-sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                    >
                      First
                    </button>
                    <button
                      className="join-item btn btn-sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                      Previous
                    </button>
                    <button className="join-item btn btn-sm btn-active">
                      {currentPage}
                    </button>
                    <button
                      className="join-item btn btn-sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                      Next
                    </button>
                    <button
                      className="join-item btn btn-sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}