export const metadata = {
  title: 'IP Rules - Wafie Console',
  description: 'Configure IP-based access rules and restrictions'
};

export default async function IPRulesPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">IP Rules</h1>
        <p className="text-base-content/60 mt-2">Configure IP-based access control rules and restrictions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">Rule Configuration</h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text">Enable IP Rules</span>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Default Action</span>
                </label>
                <select className="select select-bordered">
                  <option>Allow All (Blacklist Mode)</option>
                  <option>Block All (Whitelist Mode)</option>
                </select>
              </div>

              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text">Log Blocked Requests</span>
                  <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">Add New Rule</h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">IP Address/CIDR</span>
                </label>
                <input type="text" className="input input-bordered" placeholder="192.168.1.0/24 or 10.0.0.1" />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Action</span>
                </label>
                <select className="select select-bordered">
                  <option>Allow</option>
                  <option>Block</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <input type="text" className="input input-bordered" placeholder="Rule description" />
              </div>

              <button className="btn btn-primary w-full">Add Rule</button>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md lg:col-span-2">
          <div className="card-body">
            <h2 className="card-title">Active IP Rules</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <div className="badge badge-success">5 Allow Rules</div>
                  <div className="badge badge-error">2 Block Rules</div>
                </div>
                <button className="btn btn-outline btn-sm">Import Rules</button>
              </div>

              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Priority</th>
                      <th>IP/CIDR</th>
                      <th>Action</th>
                      <th>Description</th>
                      <th>Hits</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td>192.168.1.0/24</td>
                      <td><span className="badge badge-success">Allow</span></td>
                      <td>Internal network</td>
                      <td>1,234</td>
                      <td>1 week ago</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-sm btn-outline">Edit</button>
                          <button className="btn btn-sm btn-error">Delete</button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>2</td>
                      <td>203.0.113.0/24</td>
                      <td><span className="badge badge-error">Block</span></td>
                      <td>Known malicious range</td>
                      <td>45</td>
                      <td>3 days ago</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-sm btn-outline">Edit</button>
                          <button className="btn btn-sm btn-error">Delete</button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td>3</td>
                      <td>10.0.0.0/8</td>
                      <td><span className="badge badge-success">Allow</span></td>
                      <td>Corporate VPN</td>
                      <td>567</td>
                      <td>2 weeks ago</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-sm btn-outline">Edit</button>
                          <button className="btn btn-sm btn-error">Delete</button>
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