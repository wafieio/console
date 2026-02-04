export const metadata = {
  title: 'Settings - Wafie Console',
  description: 'Configure your Wafie Console security platform settings',
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-base-content">Settings</h1>
        <p className="text-base-content/60 mt-2">Configure your Wafie Console security platform</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title text-primary">🔐 Security Configuration</h2>
              <div className="space-y-4 mt-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">API Key Rotation Interval</span>
                  </label>
                  <select className="select select-bordered w-full">
                    <option>30 days</option>
                    <option>60 days</option>
                    <option>90 days</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Security Scan Frequency</span>
                  </label>
                  <select className="select select-bordered w-full">
                    <option>Real-time</option>
                    <option>Every hour</option>
                    <option>Daily</option>
                    <option>Weekly</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                    <span className="label-text">Enable automatic threat blocking</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                    <span className="label-text">Send security alerts via email</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title text-primary">🌐 Network Configuration</h2>
              <div className="space-y-4 mt-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Allowed IP Ranges</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    placeholder="Enter IP ranges, one per line..."
                    defaultValue="192.168.1.0/24&#10;10.0.0.0/8&#10;172.16.0.0/12"
                  ></textarea>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Proxy Configuration</span>
                  </label>
                  <input
                    type="text"
                    placeholder="http://proxy.example.com:8080"
                    className="input input-bordered w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title text-primary">🔔 Notification Settings</h2>
              <div className="space-y-4 mt-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email Address</span>
                  </label>
                  <input
                    type="email"
                    placeholder="admin@example.com"
                    className="input input-bordered w-full"
                    defaultValue="admin@example.com"
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Webhook URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://hooks.slack.com/..."
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                    <span className="label-text">Critical alerts</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                    <span className="label-text">Daily summaries</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input type="checkbox" className="checkbox checkbox-primary" />
                    <span className="label-text">Weekly reports</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title text-primary">📊 System Status</h2>
              <div className="space-y-3 mt-4">
                <div className="flex justify-between items-center">
                  <span>Service Status</span>
                  <div className="badge badge-success">Online</div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Database</span>
                  <div className="badge badge-success">Connected</div>
                </div>
                <div className="flex justify-between items-center">
                  <span>API Gateway</span>
                  <div className="badge badge-success">Active</div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Scanner Engine</span>
                  <div className="badge badge-success">Running</div>
                </div>
              </div>

              <div className="divider"></div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>CPU Usage</span>
                  <span>23%</span>
                </div>
                <progress className="progress progress-primary w-full" value="23" max="100"></progress>

                <div className="flex justify-between items-center">
                  <span>Memory Usage</span>
                  <span>45%</span>
                </div>
                <progress className="progress progress-secondary w-full" value="45" max="100"></progress>

                <div className="flex justify-between items-center">
                  <span>Storage Usage</span>
                  <span>67%</span>
                </div>
                <progress className="progress progress-accent w-full" value="67" max="100"></progress>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title text-primary">🔧 Quick Actions</h2>
              <div className="space-y-3 mt-4">
                <button className="btn btn-outline btn-block">Export Configuration</button>
                <button className="btn btn-outline btn-block">Import Settings</button>
                <button className="btn btn-outline btn-block">Generate API Key</button>
                <button className="btn btn-outline btn-block">Download Logs</button>
              </div>

              <div className="divider"></div>

              <div className="space-y-3">
                <button className="btn btn-warning btn-block">Reset to Defaults</button>
                <button className="btn btn-error btn-block">Factory Reset</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6">
        <button className="btn btn-outline">Cancel</button>
        <button className="btn btn-primary">Save Settings</button>
      </div>
    </div>
  );
}