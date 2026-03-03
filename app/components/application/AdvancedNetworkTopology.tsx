'use client';

import { useState, useEffect } from 'react';

// Network topology visualization component
interface NetworkTopologyProps {
  selectedApp: any | null;
  protectionEnabled: boolean;
}

export function AdvancedNetworkTopology({ selectedApp, protectionEnabled }: NetworkTopologyProps) {
  if (!selectedApp) {
    return (
      <div className="h-full flex items-center justify-center text-base-content/60">
        <div className="text-center">
          <div className="text-6xl mb-4">🌐</div>
          <h3 className="text-xl font-semibold mb-2">Network Topology</h3>
          <p>No application data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="min-w-0">
        <TrafficFlow application={selectedApp} protectionEnabled={protectionEnabled} />
      </div>
    </div>
  );
}

// Traffic flow animation component
interface TrafficFlowProps {
  application: any;
  protectionEnabled: boolean;
}

function TrafficFlow({ application, protectionEnabled }: TrafficFlowProps) {
  // Extract real network data from API response
  const firstIngress = application.ingress?.[0];
  const upstream = firstIngress?.upstream;

  // Build network data from API response
  const networkData = {
    ingress: {
      type: firstIngress?.ingressType || 'nginx',
      name: firstIngress?.name || `nginx-ingress`,
      host: firstIngress?.host || application.name,
    },
    service: {
      fqdn: upstream?.svcFqdn || `${application.name}.default.svc`,
    },
    endpoints: upstream?.endpoints?.map((endpoint: any) => ({
      ip: endpoint.ip,
      port: '80', // Default port since it's not in the API response
    })) || [
      { ip: '10.244.1.15', port: '80' }, // Fallback if no API data
    ],
    pods: upstream?.endpoints?.filter((endpoint: any) => endpoint.kind === 'Pod').map((endpoint: any) => ({
      name: endpoint.name,
      namespace: endpoint.namespace,
      node: endpoint.nodeName,
    })) || [
      {
        name: `${application.name}-pod`,
        namespace: application.namespace || 'default',
        node: 'worker-node',
      },
    ],
  };

  // Define colors - orange for unprotected traffic, green for protected traffic
  const unprotectedColors = {
    stroke: '#f97316',      // orange-500
    packet1: '#f97316',     // orange-500
    packet2: '#fb923c',     // orange-400
    packet3: '#ea580c'      // orange-600
  };

  const protectedColors = {
    stroke: '#10b981',      // green-500
    packet1: '#10b981',     // green-500
    packet2: '#22c55e',     // green-400
    packet3: '#16a34a'      // green-600
  };

  return (
    <>
      <div className="flex items-start justify-center py-2 min-w-0">
        <div className="flex items-center overflow-x-auto min-w-0">
        {/* Ingress */}
        <NetworkComponent
          title=""
          subtitle=""
          iconUrl="https://raw.githubusercontent.com/kubernetes/community/master/icons/png/resources/unlabeled/ing-128.png"
          type="ingress"
          label="nginx"
          badges={[application.name]}
        />

        {/* Arrow with animated packages */}
        <div className="flex items-center relative">
          <div className="w-16 h-16">
            <svg className="w-full h-full" viewBox="0 0 64 64">
              <defs>
                <path
                  id="ingress-service-path"
                  d="M 0,32 L 64,32"
                  stroke="none"
                  fill="none"
                />
              </defs>
              <line
                x1="0"
                y1="32"
                x2="64"
                y2="32"
                stroke={unprotectedColors.stroke}
                strokeWidth="2"
                strokeDasharray="4,4"
              />

              {/* Animated packages - always orange (unprotected) */}
              <circle r="3" fill={unprotectedColors.packet1}>
                <animateMotion dur="3s" repeatCount="indefinite" begin="0s">
                  <mpath href="#ingress-service-path" />
                </animateMotion>
              </circle>
              <circle r="3" fill={unprotectedColors.packet2}>
                <animateMotion dur="3s" repeatCount="indefinite" begin="1s">
                  <mpath href="#ingress-service-path" />
                </animateMotion>
              </circle>
              <circle r="3" fill={unprotectedColors.packet3}>
                <animateMotion dur="3s" repeatCount="indefinite" begin="2s">
                  <mpath href="#ingress-service-path" />
                </animateMotion>
              </circle>
            </svg>
          </div>
        </div>

        {/* Service to Endpoints - Direct or L-shaped based on endpoint count, with optional protection-proxy */}
        <div className="flex items-center relative">
          {/* Service */}
          <NetworkComponent
            title=""
            subtitle=""
            iconUrl="https://raw.githubusercontent.com/kubernetes/community/master/icons/png/resources/unlabeled/svc-128.png"
            type="service"
            label={networkData.service.fqdn}
            badges={[`Service: ${networkData.service.fqdn}`, `Endpoints: ${networkData.endpoints.length}`]}
          />

          {/* Protection Proxy (when protection is enabled) - ONLY SHOW WHEN PROTECTION IS ON */}
          {protectionEnabled === true ? (
            <>
              {/* Arrow from Service to Protection Proxy */}
              <div className="flex items-center relative">
                <div className="w-16 h-16">
                  <svg className="w-full h-full" viewBox="0 0 64 64">
                    <defs>
                      <path
                        id="service-proxy-path"
                        d="M 0,32 L 64,32"
                        stroke="none"
                        fill="none"
                      />
                    </defs>
                    <line
                      x1="0"
                      y1="32"
                      x2="64"
                      y2="32"
                      stroke={unprotectedColors.stroke}
                      strokeWidth="2"
                      strokeDasharray="4,4"
                    />

                    {/* Animated packages - orange (still unprotected until proxy) */}
                    <circle r="3" fill={unprotectedColors.packet1}>
                      <animateMotion dur="3s" repeatCount="indefinite" begin="0s">
                        <mpath href="#service-proxy-path" />
                      </animateMotion>
                    </circle>
                    <circle r="3" fill={unprotectedColors.packet2}>
                      <animateMotion dur="3s" repeatCount="indefinite" begin="1s">
                        <mpath href="#service-proxy-path" />
                      </animateMotion>
                    </circle>
                    <circle r="3" fill={unprotectedColors.packet3}>
                      <animateMotion dur="3s" repeatCount="indefinite" begin="2s">
                        <mpath href="#service-proxy-path" />
                      </animateMotion>
                    </circle>
                  </svg>
                </div>
              </div>

              {/* Protection Proxy Component */}
              <NetworkComponent
                title=""
                subtitle=""
                iconUrl="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMxMGI5ODEiIHN0cm9rZS13aWR0aD0iMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik05IDEybDIgMiA0LTRtNS42MTgtNC4wMTZBMTEuOTU1IDExLjk1NSAwIDAgMSAxMiAyLjk0NGExMS45NTUgMTEuOTU1IDAgMCAxLTguNjE4IDMuMDRBMTIuMDIgMTIuMDIgMCAwIDAgMyA5YzAgNS41OTEgMy44MjQgMTAuMjkgOSAxMS42MjIgNS4xNzYtMS4zMzIgOS02LjAzMSA5LTExLjYyMiAwLTEuMDQyLS4xMzMtMi4wNTItLjM4Mi0zLjAxNloiLz4KPC9zdmc+Cg=="
                type="protection-proxy"
                label="Wafie Secure Gateway"
                badges={[`Protection: Active`, `Type: WAF Gateway`]}
              />
            </>
          ) : null}

          {networkData.endpoints.length === 1 ? (
            // Single endpoint - direct horizontal connection
            <>
              {/* Direct horizontal arrow from Service/Protection-Proxy to Endpoint */}
              <div className="flex items-center relative">
                <div className="w-16 h-16">
                  <svg className="w-full h-full" viewBox="0 0 64 64">
                    <defs>
                      <path
                        id={protectionEnabled ? "proxy-endpoint-direct-path" : "service-endpoint-direct-path"}
                        d="M 0,32 L 64,32"
                        stroke="none"
                        fill="none"
                      />
                    </defs>
                    <line
                      x1="0"
                      y1="32"
                      x2="64"
                      y2="32"
                      stroke={protectionEnabled ? protectedColors.stroke : unprotectedColors.stroke}
                      strokeWidth="2"
                      strokeDasharray="4,4"
                    />

                    {/* Animated packages - green if from proxy (protected), orange if from service (unprotected) */}
                    <circle r="3" fill={protectionEnabled ? protectedColors.packet1 : unprotectedColors.packet1}>
                      <animateMotion dur="3s" repeatCount="indefinite" begin={protectionEnabled ? "0.3s" : "0s"}>
                        <mpath href={protectionEnabled ? "#proxy-endpoint-direct-path" : "#service-endpoint-direct-path"} />
                      </animateMotion>
                    </circle>
                    <circle r="3" fill={protectionEnabled ? protectedColors.packet2 : unprotectedColors.packet2}>
                      <animateMotion dur="3s" repeatCount="indefinite" begin={protectionEnabled ? "1.3s" : "1s"}>
                        <mpath href={protectionEnabled ? "#proxy-endpoint-direct-path" : "#service-endpoint-direct-path"} />
                      </animateMotion>
                    </circle>
                    <circle r="3" fill={protectionEnabled ? protectedColors.packet3 : unprotectedColors.packet3}>
                      <animateMotion dur="3s" repeatCount="indefinite" begin={protectionEnabled ? "2.3s" : "2s"}>
                        <mpath href={protectionEnabled ? "#proxy-endpoint-direct-path" : "#service-endpoint-direct-path"} />
                      </animateMotion>
                    </circle>
                  </svg>
                </div>
              </div>

              {/* Single Endpoint and Pod */}
              <div className="flex items-center">
                {/* Endpoint */}
                <NetworkComponent
                  title=""
                  subtitle=""
                  iconUrl="https://raw.githubusercontent.com/kubernetes/community/master/icons/png/resources/unlabeled/ep-128.png"
                  type="endpoint"
                  label={`${networkData.endpoints[0].ip}:${networkData.endpoints[0].port}`}
                  badges={[`Endpoint: ${networkData.endpoints[0].ip}:${networkData.endpoints[0].port}`]}
                />

                {/* Horizontal arrow from Endpoint to Pod */}
                <div className="flex items-center relative">
                  <div className="w-16 h-16">
                    <svg className="w-full h-full" viewBox="0 0 64 64">
                      <defs>
                        <path
                          id="endpoint-pod-direct-path"
                          d="M 0,32 L 64,32"
                          stroke="none"
                          fill="none"
                        />
                      </defs>
                      <line
                        x1="0"
                        y1="32"
                        x2="64"
                        y2="32"
                        stroke={protectionEnabled ? protectedColors.stroke : unprotectedColors.stroke}
                        strokeWidth="2"
                        strokeDasharray="4,4"
                      />

                      {/* Animated packages - green if protected, orange if unprotected */}
                      <circle r="3" fill={protectionEnabled ? protectedColors.packet1 : unprotectedColors.packet1}>
                        <animateMotion dur="3s" repeatCount="indefinite" begin={protectionEnabled ? "0.7s" : "0.4s"}>
                          <mpath href="#endpoint-pod-direct-path" />
                        </animateMotion>
                      </circle>
                      <circle r="3" fill={protectionEnabled ? protectedColors.packet2 : unprotectedColors.packet2}>
                        <animateMotion dur="3s" repeatCount="indefinite" begin={protectionEnabled ? "1.7s" : "1.4s"}>
                          <mpath href="#endpoint-pod-direct-path" />
                        </animateMotion>
                      </circle>
                      <circle r="3" fill={protectionEnabled ? protectedColors.packet3 : unprotectedColors.packet3}>
                        <animateMotion dur="3s" repeatCount="indefinite" begin={protectionEnabled ? "2.7s" : "2.4s"}>
                          <mpath href="#endpoint-pod-direct-path" />
                        </animateMotion>
                      </circle>
                    </svg>
                  </div>
                </div>

                {/* Pod */}
                <NetworkComponent
                  title=""
                  subtitle=""
                  iconUrl="https://raw.githubusercontent.com/kubernetes/community/master/icons/png/resources/unlabeled/pod-128.png"
                  type="pod"
                  badges={[
                    `${networkData.pods[0]?.name || 'Pod'}`,
                    `${networkData.pods[0]?.namespace || application.namespace || 'default'}`,
                    `${networkData.pods[0]?.node || 'worker-node'}`
                  ]}
                />
              </div>
            </>
          ) : (
            // Multiple endpoints - Tree-style connectivity
            <>
              {(() => {
                const endpointCount = networkData.endpoints.length;
                const maxEndpoints = 5; // Limit to prevent overcrowding
                const displayEndpoints = networkData.endpoints.slice(0, maxEndpoints);
                const timingInterval = Math.max(0.4, 2.5 / displayEndpoints.length); // Ensure minimum 0.4s spacing

                return (
                  <>
                    {/* Protection Proxy to tree junction - Tree-style connectivity */}
                    <div className="relative flex items-center">
                      {/* Horizontal line from Service/Protection-Proxy + Vertical distribution + Branches to endpoints */}
                      <div className="w-24 relative" style={{ height: '600px' }}>
                        <svg className="w-full h-full" viewBox="0 0 96 600">
                          <defs>
                            {/* Main horizontal path from Service/Protection-Proxy to junction */}
                            <path
                              id={protectionEnabled ? "proxy-junction-path" : "service-junction-path"}
                              d="M 0,300 L 48,300"
                              stroke="none"
                              fill="none"
                            />
                            {/* Individual paths from junction to each endpoint */}
                            {displayEndpoints.map((_endpoint: any, index: number) => {
                              // Calculate endpoint Y positions with massive spacing
                              const totalEndpoints = displayEndpoints.length;
                              const spacing = 180; // Massive spacing for giant container
                              const startY = 300 - (totalEndpoints - 1) * (spacing / 2); // Distribute around new center (300)
                              const endpointY = startY + (index * spacing);
                              const pathId = `junction-endpoint-path-${index}`;
                              return (
                                <path
                                  key={pathId}
                                  id={pathId}
                                  d={`M 48,300 L 48,${endpointY} L 96,${endpointY}`}
                                  stroke="none"
                                  fill="none"
                                />
                              );
                            })}
                          </defs>

                          {/* Draw horizontal line from Service/Proxy to junction */}
                          <line
                            x1="0"
                            y1="300"
                            x2="48"
                            y2="300"
                            stroke={protectionEnabled ? protectedColors.stroke : unprotectedColors.stroke}
                            strokeWidth="2"
                            strokeDasharray="4,4"
                          />

                          {/* Draw vertical distribution line */}
                          <line
                            x1="48"
                            y1={300 - (displayEndpoints.length - 1) * 90}
                            x2="48"
                            y2={300 + (displayEndpoints.length - 1) * 90}
                            stroke={protectionEnabled ? protectedColors.stroke : unprotectedColors.stroke}
                            strokeWidth="2"
                            strokeDasharray="4,4"
                          />

                          {/* Draw horizontal lines from vertical line to each endpoint */}
                          {displayEndpoints.map((_endpoint: any, index: number) => {
                            const totalEndpoints = displayEndpoints.length;
                            const spacing = 180; // Same as above - massive spacing
                            const startY = 300 - (totalEndpoints - 1) * (spacing / 2);
                            const endpointY = startY + (index * spacing);
                            return (
                              <line
                                key={`branch-${index}`}
                                x1="48"
                                y1={endpointY}
                                x2="96"
                                y2={endpointY}
                                stroke={protectionEnabled ? protectedColors.stroke : unprotectedColors.stroke}
                                strokeWidth="2"
                                strokeDasharray="4,4"
                              />
                            );
                          })}

                          {/* Animated packets: Service/Protection-Proxy to junction */}
                          <circle r="3" fill={protectionEnabled ? protectedColors.packet1 : unprotectedColors.packet1}>
                            <animateMotion dur="3s" repeatCount="indefinite" begin={protectionEnabled ? "0.3s" : "0s"}>
                              <mpath href={protectionEnabled ? "#proxy-junction-path" : "#service-junction-path"} />
                            </animateMotion>
                          </circle>
                          <circle r="3" fill={protectionEnabled ? protectedColors.packet2 : unprotectedColors.packet2}>
                            <animateMotion dur="3s" repeatCount="indefinite" begin={protectionEnabled ? "1.3s" : "1s"}>
                              <mpath href={protectionEnabled ? "#proxy-junction-path" : "#service-junction-path"} />
                            </animateMotion>
                          </circle>
                          <circle r="3" fill={protectionEnabled ? protectedColors.packet3 : unprotectedColors.packet3}>
                            <animateMotion dur="3s" repeatCount="indefinite" begin={protectionEnabled ? "2.3s" : "2s"}>
                              <mpath href={protectionEnabled ? "#proxy-junction-path" : "#service-junction-path"} />
                            </animateMotion>
                          </circle>

                          {/* Animated packets: Junction to each endpoint */}
                          {displayEndpoints.map((_endpoint: any, index: number) => {
                            const baseDelay = protectionEnabled ? 0.8 : 0.5; // Extra delay if protection enabled
                            const startDelay1 = (index * timingInterval + baseDelay).toFixed(1);
                            const startDelay2 = (index * timingInterval + baseDelay + 1).toFixed(1);
                            return (
                              <g key={`endpoint-animation-${index}`}>
                                <circle r="3" fill={protectionEnabled ? protectedColors.packet1 : unprotectedColors.packet1}>
                                  <animateMotion dur="3s" repeatCount="indefinite" begin={`${startDelay1}s`}>
                                    <mpath href={`#junction-endpoint-path-${index}`} />
                                  </animateMotion>
                                </circle>
                                <circle r="3" fill={protectionEnabled ? protectedColors.packet2 : unprotectedColors.packet2}>
                                  <animateMotion dur="3s" repeatCount="indefinite" begin={`${startDelay2}s`}>
                                    <mpath href={`#junction-endpoint-path-${index}`} />
                                  </animateMotion>
                                </circle>
                              </g>
                            );
                          })}
                        </svg>
                      </div>

                      {/* Endpoints positioned to align with tree branch lines */}
                      <div className="relative" style={{ minWidth: '600px', height: '600px' }}>
                        {displayEndpoints.map((endpoint: any, index: number) => {
                          // Calculate Y position to match SVG branch lines exactly
                          const totalEndpoints = displayEndpoints.length;
                          const spacing = 180; // Same as SVG - massive spacing
                          const startY = 300 - (totalEndpoints - 1) * (spacing / 2); // Same calculation as SVG (new center 300)
                          const endpointY = startY + (index * spacing); // Same spacing as SVG

                          // Convert SVG Y coordinate to CSS positioning (new height 600)
                          const topPercent = (endpointY / 600) * 100;

                          return (
                            <div
                              key={index}
                              className="absolute flex items-center"
                              style={{
                                top: `${topPercent}%`,
                                transform: 'translateY(-50%)', // Center on the line
                                left: '0'
                              }}
                            >
                            {/* Endpoint */}
                            <NetworkComponent
                              title=""
                              subtitle=""
                              iconUrl="https://raw.githubusercontent.com/kubernetes/community/master/icons/png/resources/unlabeled/ep-128.png"
                              type="endpoint"
                              label={`${endpoint.ip}:${endpoint.port}`}
                              badges={[`Endpoint: ${endpoint.ip}:${endpoint.port}`]}
                            />

                            {/* Horizontal arrow from Endpoint to Pod */}
                            <div className="flex items-center relative">
                              <div className="w-16 h-16">
                                <svg className="w-full h-full" viewBox="0 0 64 64">
                                  <defs>
                                    <path
                                      id={`endpoint-pod-path-${index}`}
                                      d="M 0,32 L 64,32"
                                      stroke="none"
                                      fill="none"
                                    />
                                  </defs>
                                  <line
                                    x1="0"
                                    y1="32"
                                    x2="64"
                                    y2="32"
                                    stroke={protectionEnabled ? protectedColors.stroke : unprotectedColors.stroke}
                                    strokeWidth="2"
                                    strokeDasharray="4,4"
                                  />

                                  {/* Synchronized endpoint-to-pod animation */}
                                  <circle r="3" fill={protectionEnabled ? protectedColors.packet1 : unprotectedColors.packet1}>
                                    <animateMotion
                                      dur="3s"
                                      repeatCount="indefinite"
                                      begin={`${(index * timingInterval + (protectionEnabled ? 0.9 : 0.6)).toFixed(1)}s`}
                                    >
                                      <mpath href={`#endpoint-pod-path-${index}`} />
                                    </animateMotion>
                                  </circle>
                                  <circle r="3" fill={protectionEnabled ? protectedColors.packet2 : unprotectedColors.packet2}>
                                    <animateMotion
                                      dur="3s"
                                      repeatCount="indefinite"
                                      begin={`${(index * timingInterval + (protectionEnabled ? 1.9 : 1.6)).toFixed(1)}s`}
                                    >
                                      <mpath href={`#endpoint-pod-path-${index}`} />
                                    </animateMotion>
                                  </circle>
                                </svg>
                              </div>
                            </div>

                            {/* Pod */}
                            <NetworkComponent
                              title=""
                              subtitle=""
                              iconUrl="https://raw.githubusercontent.com/kubernetes/community/master/icons/png/resources/unlabeled/pod-128.png"
                              type="pod"
                              badges={[`${networkData.pods[index]?.name || `Pod-${index + 1}`}`,
                                `${networkData.pods[index]?.namespace || application.namespace || 'default'}`,
                                `${networkData.pods[index]?.node || `worker-node-${index + 1}`}`
                              ]}
                            />
                            </div>
                          );
                        })}

                        {/* Show indicator if there are more endpoints than displayed */}
                        {endpointCount > maxEndpoints && (
                          <div className="absolute bottom-0 left-0 w-full text-center text-base-content/60 text-sm py-2">
                            + {endpointCount - maxEndpoints} more endpoint{endpointCount - maxEndpoints !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

// Individual network component
interface NetworkComponentProps {
  title: string;
  subtitle: string;
  details?: string;
  iconUrl: string;
  type: string;
  label?: string;
  badges?: string[];
}

function NetworkComponent({ title, subtitle, details, iconUrl, type, label, badges }: NetworkComponentProps) {
  const noBorder = type === 'ingress' || type === 'service' || type === 'endpoint' || type === 'pod';
  const isDottedBorder = type === 'protection-proxy';

  // Check if we have valid badges
  const hasBadges = badges && Array.isArray(badges) && badges.length > 0;
  const tooltipText = hasBadges ? badges.join(' | ') : '';

  // Component content
  const componentContent = (
    <div
      className={`bg-base-200 rounded-lg p-4 transition-all duration-300 hover:shadow-lg ${
        noBorder
          ? ''
          : isDottedBorder
          ? 'border-2 border-dashed border-white'
          : 'border-2 border-primary/20 hover:border-primary/50'
      }`}
    >
      <div className="text-center">
        <div className="mb-2">
          <img
            src={iconUrl}
            alt={`${type} icon`}
            className="w-12 h-12 mx-auto"
          />
        </div>
        <div className="mb-1">
          {title && <h4 className="font-bold text-base-content mb-1">{title}</h4>}
          {label && (
            <div className="flex justify-center">
              <span className={`badge ${
                type === 'ingress'
                  ? 'badge-sm ' + (label?.includes('NGINX') ? 'badge-secondary' : 'badge-info')
                  : type === 'service'
                  ? 'badge-sm badge-primary text-xs px-2 py-1 max-w-full break-all'
                  : type === 'endpoint'
                  ? 'badge-sm badge-accent text-xs'
                  : type === 'protection-proxy'
                  ? 'badge-sm badge-success text-xs px-2 py-1 max-w-full break-all'
                  : 'badge-sm badge-outline'
              }`}>
                {label}
              </span>
            </div>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-base-content/70 mt-1">{subtitle}</p>
        )}
        {details && (
          <p className="text-xs text-base-content/50 mt-2">{details}</p>
        )}

        {/* Display badges in column for pod components */}
        {type === 'pod' && hasBadges && (
          <div className="mt-2 flex flex-col gap-1 items-center">
            {badges.map((badge, index) => (
              <span key={index} className="badge badge-sm badge-info text-xs px-2 py-1 max-w-full break-all">
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Custom CSS tooltip approach (exclude pods since they show badges directly)
  if (hasBadges && tooltipText && type !== 'pod') {
    return (
      <div className="relative group">
        {componentContent}
        <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-neutral text-neutral-content text-xs rounded py-1 px-2 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-10">
          {tooltipText}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral"></div>
        </div>
      </div>
    );
  }

  return componentContent;
}