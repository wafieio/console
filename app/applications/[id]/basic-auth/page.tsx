export const metadata = {
  title: 'Basic Authentication - Wafie Console',
  description: 'Configure basic HTTP authentication for application access'
};

export default async function BasicAuthPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Basic Authentication</h1>
        <p className="text-base-content/60 mt-2">Configure HTTP Basic Authentication for application access control</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">Authentication Status</h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text">Enable Basic Authentication</span>
                  <input type="checkbox" className="toggle toggle-primary" />
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Authentication Realm</span>
                </label>
                <input type="text" className="input input-bordered" placeholder="Enter realm name" defaultValue="Wafie Protected Area" />
              </div>

              <div className="alert alert-info">
                <div className="flex">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>Basic auth provides simple username/password protection.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">Add New User</h2>
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Username</span>
                </label>
                <input type="text" className="input input-bordered" placeholder="Enter username" />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <input type="password" className="input input-bordered" placeholder="Enter password" />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Confirm Password</span>
                </label>
                <input type="password" className="input input-bordered" placeholder="Confirm password" />
              </div>

              <button className="btn btn-primary w-full">Add User</button>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md lg:col-span-2">
          <div className="card-body">
            <h2 className="card-title">Authorized Users</h2>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Created</th>
                    <th>Last Login</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>admin</td>
                    <td>2 weeks ago</td>
                    <td>2 hours ago</td>
                    <td><span className="badge badge-success">Active</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-sm btn-outline">Edit</button>
                        <button className="btn btn-sm btn-error">Delete</button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>operator</td>
                    <td>1 week ago</td>
                    <td>Yesterday</td>
                    <td><span className="badge badge-success">Active</span></td>
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
  );
}