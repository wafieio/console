export const metadata = {
  title: 'AntiBot Protection - Wafie Console',
  description: 'Configure bot detection and mitigation settings'
};

export default async function AntiBotPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AntiBot Protection</h1>
        <p className="text-base-content/60 mt-2">Configure bot detection and automated traffic filtering</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">Protection Mode</h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text">Enable AntiBot Protection</span>
                  <input type="checkbox" className="toggle toggle-primary" />
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Protection Level</span>
                </label>
                <select className="select select-bordered">
                  <option>Low - Basic bot detection</option>
                  <option>Medium - Enhanced detection</option>
                  <option>High - Strict validation</option>
                </select>
              </div>

              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text">JavaScript Challenge</span>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">Detection Settings</h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Sensitivity Score</span>
                </label>
                <input type="range" min="1" max="10" defaultValue="5" className="range range-primary" />
                <div className="flex justify-between text-xs px-2">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              </div>

              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text">User Agent Analysis</span>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                </label>
              </div>

              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text">Behavioral Analysis</span>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md lg:col-span-2">
          <div className="card-body">
            <h2 className="card-title">Recent Bot Detection Activity</h2>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>IP Address</th>
                    <th>User Agent</th>
                    <th>Detection Reason</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>5 min ago</td>
                    <td>203.0.113.45</td>
                    <td className="max-w-xs truncate">Mozilla/5.0 Bot Scanner</td>
                    <td>Suspicious User Agent</td>
                    <td><span className="badge badge-error">Blocked</span></td>
                  </tr>
                  <tr>
                    <td>12 min ago</td>
                    <td>198.51.100.23</td>
                    <td className="max-w-xs truncate">curl/7.68.0</td>
                    <td>Automated Tool</td>
                    <td><span className="badge badge-error">Blocked</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}