export const metadata = {
  title: 'Overview - Wafie Console',
  description: 'Dashboard overview of your security platform',
};

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-base-content">Overview</h1>
        <p className="text-base-content/60 mt-2">Monitor your application security status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-primary">🛡️ Security Status</h2>
            <p className="text-base-content/70">All systems operational</p>
            <div className="badge badge-success">Active</div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-primary">📈 Threat Detection</h2>
            <p className="text-base-content/70">No threats detected in the last 24h</p>
            <div className="badge badge-success">Secure</div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-primary">🔍 API Monitoring</h2>
            <p className="text-base-content/70">Monitoring 15 API endpoints</p>
            <div className="badge badge-info">Running</div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-primary">⚡ Performance</h2>
            <p className="text-base-content/70">Average response time: 120ms</p>
            <div className="badge badge-success">Optimal</div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-primary">🌐 Network Security</h2>
            <p className="text-base-content/70">All connections encrypted</p>
            <div className="badge badge-success">Protected</div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-primary">📊 Analytics</h2>
            <p className="text-base-content/70">Daily security report ready</p>
            <div className="badge badge-info">Available</div>
          </div>
        </div>
      </div>
    </div>
  );
}