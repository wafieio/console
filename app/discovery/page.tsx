'use client';

import { useState } from 'react';
import { RiCompassDiscoverLine } from "react-icons/ri";
import { FiShield } from "react-icons/fi";
import { VscSymbolEvent } from "react-icons/vsc";
import { FiShieldOff } from "react-icons/fi";
import ApplicationsSection from "./components/ApplicationsSection";
import { Application } from '@/app/types/applications';

export default function DiscoveryPage() {
  const [applications, setApplications] = useState<Application[]>([]);

  // Calculate statistics from applications data
  const totalApplications = applications.length;
  const protectedApplications = applications.filter(
    app => app.protectionMode === 'PROTECTION_MODE_ON'
  ).length;
  const unprotectedApplications = totalApplications - protectedApplications;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-base-content">Discovery</h1>
        <p className="text-base-content/60 mt-2">Discover and analyze your application assets and APIs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="card-title">Discovered Applications</h2>
                <p className="text-3xl font-bold text-base-content mt-2">{totalApplications}</p>
                <p className="text-base-content/70 text-sm">Total discovered applications</p>
              </div>
              <RiCompassDiscoverLine className="text-4xl text-primary" />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="card-title">Protected Applications</h2>
                <p className="text-3xl font-bold text-base-content mt-2">{protectedApplications}</p>
                <p className="text-base-content/70 text-sm">Total protected applications</p>
              </div>
              <FiShield className="text-4xl text-success" />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="card-title">Unprotected Applications</h2>
                <p className="text-3xl font-bold text-base-content mt-2">{unprotectedApplications}</p>
                <p className="text-base-content/70 text-sm">Total unprotected applications</p>
              </div>
              <FiShieldOff className="text-4xl text-error" />
            </div>
          </div>
        </div>
      </div>

      <ApplicationsSection onApplicationsLoaded={setApplications} />
    </div>
  );
}