import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

const AuthContext = createContext({});

/**
 * AuthProvider
 *
 * Role is read exclusively from user_metadata (JWT payload).
 * This avoids any database query and is immune to RLS issues.
 * To set admin role, run in Supabase SQL editor:
 *   UPDATE auth.users
 *   SET raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'
 *   WHERE email = 'your@email.com';
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser]         = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading]   = useState(true);

  const resolveRole = (supabaseUser) => {
    if (!supabaseUser) { setUserRole(null); return; }
    // user_metadata is part of the JWT — no DB query, no RLS
    setUserRole(supabaseUser.user_metadata?.role ?? "user");
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      resolveRole(u);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        resolveRole(u);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userRole, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
