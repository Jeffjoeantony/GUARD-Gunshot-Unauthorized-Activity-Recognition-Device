import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

export default function AdminRoute({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const verify = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setStatus("denied"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile?.role !== "admin") { setStatus("denied"); return; }

      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel !== "aal2") { setStatus("denied"); return; }

      setStatus("authorized");
    };

    verify();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => verify());
    return () => subscription.unsubscribe();
  }, []);

  if (status === "loading") return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", display:"flex", alignItems:"center", justifyContent:"center", color:"#22c55e" }}>
      Verifying admin access...
    </div>
  );

  if (status === "denied") return <Navigate to="/admin/login" replace />;
  return children;
}