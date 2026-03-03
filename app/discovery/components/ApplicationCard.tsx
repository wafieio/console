import Link from 'next/link';
import { Application } from '@/app/types/applications';

interface ApplicationCardProps {
  application: Application;
}

export default function ApplicationCard({ application }: ApplicationCardProps) {
  const getProtectionStatus = () => {
    // Check if application has protection mode set to ON
    return application.protectionMode === 'PROTECTION_MODE_ON' ? 'protected' : 'unprotected';
  };

  const protectionStatus = getProtectionStatus();

  return (
    <Link href={`/applications/${application.id}/overview`}>
      <div className="card bg-base-100 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]">
        <div className="card-body">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">{application.name}</h3>
            <span
              className={`badge ${
                protectionStatus === 'protected' ? 'badge-success' : 'badge-error'
              } text-xs`}
            >
              {protectionStatus === 'protected' ? 'Protected' : 'Unprotected'}
            </span>
          </div>

          <div className="space-y-3">
            {application.ingress.map((ingress, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">Namespace</span>
                  <span className="badge badge-accent text-xs">
                    {ingress.namespace}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">Ingress controller</span>
                  <span className="badge badge-primary text-xs">
                    nginx
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}