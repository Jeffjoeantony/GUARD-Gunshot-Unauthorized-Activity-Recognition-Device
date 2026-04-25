import React, { useState } from "react";
import "../styles/Login.css";
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

const Login = () => {
  const [action, setAction] = useState("Login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Admin MFA step — shown inline after credentials verified
  const [mfaStep, setMfaStep]         = useState(false);
  const [totpCode, setTotpCode]       = useState("");
  const [mfaFactorId, setMfaFactorId] = useState(null);
  const [mfaError, setMfaError]       = useState("");
  const [cooldown, setCooldown]       = useState(false); // forgot-password cooldown

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (action === "Login") {
      if (!email || !password) { alert("Please enter email and password"); return; }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { alert(error.message); return; }

      // ── Detect admin role ─────────────────────────────────────────
      // user_metadata.role is part of the JWT (returned by signInWithPassword)
      // — no extra DB query, no RLS timing issues.
      // Falls back to profiles table if metadata isn't set.
      let role = data.user.user_metadata?.role;

      if (!role || role === 'user') {
        // Fallback: check profiles table (covers manual SQL updates)
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();
        if (profileErr) console.error("Profile fetch error:", profileErr);
        if (profile?.role) role = profile.role;
      }

      if (role === "admin") {
        // Check whether this session is already at AAL2 (MFA already done)
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal?.currentLevel === "aal2") {
          navigate("/admin/dashboard");
          return;
        }

        // Check if the admin has a verified TOTP factor
        const { data: mfaData } = await supabase.auth.mfa.listFactors();
        const totpFactor = mfaData?.totp?.[0];

        if (totpFactor && totpFactor.status === "verified") {
          // MFA set up — show inline TOTP step
          setMfaFactorId(totpFactor.id);
          setMfaStep(true);
        } else {
          // First time / no MFA — go straight to admin dashboard
          navigate("/admin/dashboard");
        }
        return;
      }

      // Regular user
      navigate("/dashboard");
      return;
    }

    if (action === "Sign Up") {
      if (!email || !password || !name) { alert("Please fill all fields"); return; }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role: "user" } },
      });

      if (error) { alert(error.message); return; }
      if (data?.user && data.user.identities?.length === 0) {
        alert("User already exists. Please login instead.");
        return;
      }
      alert("Signup successful! Please check your email.");
      setAction("Login");
    }
  };

  // ── Admin MFA verification ─────────────────────────────────────────
  const handleMfaVerify = async (e) => {
    e.preventDefault();
    setMfaError("");
    if (!mfaFactorId) return;

    const { data: challenge, error: challengeErr } =
      await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
    if (challengeErr) { setMfaError(challengeErr.message); return; }

    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: challenge.id,
      code: totpCode,
    });

    if (verifyErr) { setMfaError("Invalid code. Try again."); return; }
    navigate("/admin/dashboard");
  };



const handleForgotPassword = async () => {

  if (!email) {
    alert("Enter your email first.");
    return;
  }

  if (cooldown) {
    alert("Please wait before requesting another reset email.");
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "http://localhost:5173/reset-password"
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Password reset email sent.");

  setCooldown(true);

  setTimeout(() => {
    setCooldown(false);
  }, 60000); // 1 minute
};


  return (
    <div className="container">
      <div className="header">
        <div className="text">{mfaStep ? "Admin Verification" : action}</div>
        <div className="underline"></div>
      </div>

      {/* ── Admin MFA step (shown after credentials confirmed) ── */}
      {mfaStep ? (
        <form className="inputs" onSubmit={handleMfaVerify}>
          <p style={{ color: "#aaa", fontSize: "13px", textAlign: "center", marginBottom: "12px" }}>
            Enter the 6-digit code from your authenticator app
          </p>
          <div className="input">
            <input
              type="text"
              placeholder="000000"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              maxLength={6}
              style={{ textAlign: "center", letterSpacing: "8px", fontSize: "20px" }}
              autoFocus
            />
          </div>
          {mfaError && (
            <p style={{ color: "#f87171", fontSize: "13px", textAlign: "center" }}>{mfaError}</p>
          )}
          <div className="submit-container">
            <button type="submit" className="submit">Verify</button>
            <div className="submit gray" onClick={() => setMfaStep(false)}>Back</div>
          </div>
        </form>
      ) : (
        /* ── Normal login / signup form ── */
        <form className="inputs" onSubmit={handleSubmit}>
          {action === "Sign Up" && (
            <div className="input">
              <PersonIcon className="icon" />
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="input">
            <EmailIcon className="icon" />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input password-input">
            <span
              className="toggle-password left"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <VisibilityOff /> : <VisibilityIcon />}
            </span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {action === "Login" && (
            <div className="forgot-password">
              Forgot password?{" "}
              <span
                onClick={!cooldown ? handleForgotPassword : undefined}
                style={{ cursor: cooldown ? "not-allowed" : "pointer", color: cooldown ? "gray" : "rgb(40,182,12)" }}
              >
                Click here
              </span>
            </div>
          )}

          <div className="submit-container">
            {action === "Login" ? (
              <>
                <div className="submit gray" onClick={() => setAction("Sign Up")}>Sign Up</div>
                <button type="submit" className="submit">Login</button>
              </>
            ) : (
              <>
                <button type="submit" className="submit">Sign Up</button>
                <div className="submit gray" onClick={() => setAction("Login")}>Login</div>
              </>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default Login;
