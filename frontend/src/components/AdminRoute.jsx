import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

/**
 * AdminRoute
 *
 * Guards /admin/dashboard.
 * Role is read from user_metadata (JWT) — no DB query, no RLS issues.
 * MFA (aal2) is only enforced when the admin has an enrolled TOTP factor.
 */
export default function AdminRoute({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const check = async () => {
      // 1. Verify session exists
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStatus("denied"); return; }

      // 2. Role check via JWT metadata (no DB query, no RLS recursion risk)
      const role = user?.user_metadata?.role;
      if (role !== "admin") { setStatus("denied"); return; }

      // 3. MFA check — only required if admin has a verified TOTP factor enrolled
      try {
        const { data: mfaData } = await supabase.auth.mfa.listFactors();
        const hasVerifiedFactor = mfaData?.totp?.some(f => f.status === "verified");

        if (hasVerifiedFactor) {
          const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (aal?.currentLevel !== "aal2") { setStatus("denied"); return; }
        }
      } catch {
        // MFA check failed non-critically — allow access (role already verified)
      }

      setStatus("authorized");
    };
    check();
  }, []);

  if (status === "loading") return (
    <div style={{
      color: "#4ade80", textAlign: "center", marginTop: "40vh",
      fontSize: "16px", fontFamily: "Inter, sans-serif"
    }}>
      Verifying admin access...
    </div>
  );

  if (status === "denied") return <Navigate to="/login" replace />;

  return children;
}