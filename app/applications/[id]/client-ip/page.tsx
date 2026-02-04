export const metadata = {
  title: 'Client IP Protection - Wafie Console',
  description: 'Configure client IP protection settings and rules'
};

export default async function ClientIPPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Client IP Protection</h1>
        <p className="text-base-content/60 mt-2">Configure IP-based access controls and rate limiting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">Protection Status</h2>
            <div className="form-control">
              <label className="cursor-pointer label">
                <span className="label-text">Enable Client IP Protection</span>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </label>
            </div>
            <div className="form-control">
              <label className="cursor-pointer label">
                <span className="label-text">Enable Rate Limiting</span>
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
              </label>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">Rate Limiting Settings</h2>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Requests per minute</span>
              </label>
              <input type="number" className="input input-bordered" defaultValue="100" />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Burst limit</span>
              </label>
              <input type="number" className="input input-bordered" defaultValue="20" />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md lg:col-span-2">
          <div className="card-body">
            <h2 className="card-title">IP Whitelist</h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Add IP Address or CIDR</span>
                </label>
                <div className="input-group">
                  <input type="text" placeholder="192.168.1.0/24" className="input input-bordered flex-1" />
                  <button className="btn btn-primary">Add</button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>IP/CIDR</th>
                      <th>Description</th>
                      <th>Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>192.168.1.0/24</td>
                      <td>Internal network</td>
                      <td>2 days ago</td>
                      <td>
                        <button className="btn btn-sm btn-error">Remove</button>
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