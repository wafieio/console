export const metadata = {
  title: 'Token Authentication - Wafie Console',
  description: 'Configure API token and JWT authentication methods'
};

export default async function TokenAuthPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Token Authentication</h1>
        <p className="text-base-content/60 mt-2">Configure API token and JWT-based authentication</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">Authentication Method</h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text">Enable Token Authentication</span>
                  <input type="checkbox" className="toggle toggle-primary" />
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Authentication Type</span>
                </label>
                <select className="select select-bordered">
                  <option>API Key</option>
                  <option>Bearer Token</option>
                  <option>JWT Token</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Header Name</span>
                </label>
                <input type="text" className="input input-bordered" defaultValue="Authorization" />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Token Prefix</span>
                </label>
                <input type="text" className="input input-bordered" placeholder="Bearer, Api-Key, etc." defaultValue="Bearer" />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">JWT Configuration</h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">JWT Secret</span>
                </label>
                <div className="input-group">
                  <input type="password" className="input input-bordered flex-1" placeholder="Enter JWT secret" />
                  <button className="btn btn-outline">Generate</button>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Algorithm</span>
                </label>
                <select className="select select-bordered">
                  <option>HS256</option>
                  <option>HS384</option>
                  <option>HS512</option>
                  <option>RS256</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Token Expiry (minutes)</span>
                </label>
                <input type="number" className="input input-bordered" defaultValue="60" />
              </div>

              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text">Verify Issuer</span>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md lg:col-span-2">
          <div className="card-body">
            <h2 className="card-title">API Tokens</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Manage API Tokens</h3>
                <button className="btn btn-primary">Generate New Token</button>
              </div>

              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Token Name</th>
                      <th>Created</th>
                      <th>Last Used</th>
                      <th>Expires</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>API Client 1</td>
                      <td>1 week ago</td>
                      <td>2 hours ago</td>
                      <td>In 30 days</td>
                      <td><span className="badge badge-success">Active</span></td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-sm btn-outline">View</button>
                          <button className="btn btn-sm btn-warning">Revoke</button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>Mobile App</td>
                      <td>3 days ago</td>
                      <td>1 hour ago</td>
                      <td>In 90 days</td>
                      <td><span className="badge badge-success">Active</span></td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-sm btn-outline">View</button>
                          <button className="btn btn-sm btn-warning">Revoke</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}