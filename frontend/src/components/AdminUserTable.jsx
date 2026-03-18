import { useEffect, useState } from "react";
import { supabaseAdmin } from "../services/supabaseClient";

const AdminUserTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (!error && data?.users) {
      setUsers(data.users);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getStatus = (lastSignIn) => {
    if (!lastSignIn) return { text: "Offline", icon: "🔴" };
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const signInDate = new Date(lastSignIn);
    if (signInDate >= tenMinsAgo) {
      return { text: "Online", icon: "🟢" };
    }
    return { text: "Offline", icon: "🔴" };
  };

  return (
    <div className="alertlog-container">
      <h2 className="alertlog-title">Users Management</h2>
      
      {loading ? (
        <div className="flex justify-center my-8">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="alertlog-table-wrapper">
          <div className="alertlog-table-scroll">
            <table className="alert-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Email</th>
                  <th>Created At</th>
                  <th>Last Sign In</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const status = getStatus(user.last_sign_in_at);
                  return (
                    <tr key={user.id}>
                      <td style={{ fontFamily: "monospace", opacity: 0.8 }}>{user.id.substring(0, 8)}...</td>
                      <td>{user.email}</td>
                      <td>{new Date(user.created_at).toLocaleString()}</td>
                      <td>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "Never"}</td>
                      <td>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 8px",
                          borderRadius: "12px",
                          backgroundColor: status.text === "Online" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                          color: status.text === "Online" ? "#10b981" : "#ef4444",
                          fontWeight: "bold",
                          fontSize: "0.85rem"
                        }}>
                          {status.icon} {status.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-3 text-center text-gray-500">No users found.</td>
                </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserTable;
