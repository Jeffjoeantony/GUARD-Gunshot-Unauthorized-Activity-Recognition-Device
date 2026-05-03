import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

/**
 * ProtectedRoute
 *
 * Guards user-facing routes (e.g. /dashboard).
 * - Redirects unauthenticated users to /login.
 * - Redirects admin users away from user routes to /admin/dashboard.
 *   Admins must use the admin-specific routes guarded by AdminRoute.
 */
function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading"); // "loading" | "user" | "admin" | "denied"

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        setStatus("denied");
        return;
      }

      // Check role — admins should not use the user-facing dashboard
      const role = session.user?.user_metadata?.role;
      if (role === "admin") {
        setStatus("admin");
        return;
      }

      setStatus("user");
    };

    checkSession();
  }, []);

  if (status === "loading") return null;
  if (status === "denied") return <Navigate to="/login" replace />;
  if (status === "admin") return <Navigate to="/admin/dashboard" replace />;

  return children;
}

export default ProtectedRoute;