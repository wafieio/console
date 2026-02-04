export const metadata = {
  title: 'Application Overview - Wafie Console',
  description: 'Application security overview and configuration status'
};

export default async function ApplicationOverviewPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Application Overview</h1>
        <p className="text-base-content/60 mt-2">Security overview and protection status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">Security Status</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Client IP Protection</span>
                <div className="badge badge-success">Active</div>
              </div>
              <div className="flex justify-between">
                <span>AntiBot Protection</span>
                <div className="badge badge-warning">Disabled</div>
              </div>
              <div className="flex justify-between">
                <span>Authentication</span>
                <div className="badge badge-error">Not Configured</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">Traffic Statistics</h2>
            <div className="space-y-2">
              <div className="stat">
                <div className="stat-title">Total Requests</div>
                <div className="stat-value text-2xl">12.4K</div>
              </div>
              <div className="stat">
                <div className="stat-title">Blocked Requests</div>
                <div className="stat-value text-2xl text-error">248</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">Recent Activity</h2>
            <div className="space-y-2">
              <div className="text-sm">
                <div className="font-semibold">IP Rule Triggered</div>
                <div className="text-base-content/60">2 minutes ago</div>
              </div>
              <div className="text-sm">
                <div className="font-semibold">Configuration Updated</div>
                <div className="text-base-content/60">1 hour ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}