import React, { useState } from "react";
import "../styles/Login.css";
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { VisibilityOff, Block, HourglassEmpty, ErrorOutline } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

/* ── Status-specific block messages ──────────────────────────── */
const STATUS_MESSAGES = {
  inactive: {
    icon: "⏸️",
    title: "Account Inactive",
    body: "Your account has been deactivated. Please contact an administrator to re-enable access.",
  },
  banned: {
    icon: "🚫",
    title: "Account Banned",
    body: "Your account has been permanently banned due to a policy violation. Contact support if you believe this is an error.",
  },
  suspended: {
    icon: "⛔",
    title: "Account Suspended",
    body: "Your account has been temporarily suspended. Please contact an administrator for more information.",
  },
  pending: {
    icon: "⏳",
    title: "Account Pending Approval",
    body: "Your account is awaiting admin approval. You will be notified once access is granted.",
  },
};

/* ── Inline error/status banner ──────────────────────────────── */
const LoginBanner = ({ type = "error", title, body, onClose }) => {
  const colors = {
    error:     { bg: "rgba(255,71,87,0.08)",  border: "#ff4757", icon: "❌" },
    inactive:  { bg: "rgba(180,180,180,0.08)", border: "#888",    icon: "⏸️" },
    banned:    { bg: "rgba(255,71,87,0.08)",  border: "#ff4757", icon: "🚫" },
    suspended: { bg: "rgba(245,166,35,0.08)", border: "#f5a623", icon: "⛔" },
    pending:   { bg: "rgba(0,170,255,0.08)",  border: "#00aaff", icon: "⏳" },
  };
  const c = colors[type] || colors.error;
  return (
    <div style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      borderLeft: `4px solid ${c.border}`,
      borderRadius: 10,
      padding: "14px 16px",
      width: 390,
      boxSizing: "border-box",
      position: "relative",
      animation: "fadeSlideIn 0.25s ease",
    }}>
      <div style={{ fontWeight: 700, color: "#fff", fontSize: 14, marginBottom: 4 }}>
        {c.icon}&nbsp; {title}
      </div>
      <div style={{ color: "#aaa", fontSize: 12, lineHeight: 1.5 }}>{body}</div>
      {onClose && (
        <button onClick={onClose} style={{
          position: "absolute", top: 10, right: 12,
          background: "none", border: "none", color: "#666",
          cursor: "pointer", fontSize: 16, lineHeight: 1,
        }}>×</button>
      )}
    </div>
  );
};

const Login = () => {
  const [action, setAction] = useState("Login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Inline error/status state (replaces alert())
  const [loginError, setLoginError] = useState(null); // { type, title, body }

  // Admin MFA step
  const [mfaStep, setMfaStep]         = useState(false);
  const [totpCode, setTotpCode]       = useState("");
  const [mfaFactorId, setMfaFactorId] = useState(null);
  const [mfaError, setMfaError]       = useState("");
  const [cooldown, setCooldown]       = useState(false);

  const navigate = useNavigate();

  const clearError = () => setLoginError(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (action === "Login") {
      if (!email || !password) {
        setLoginError({ type: "error", title: "Missing Fields", body: "Please enter your email and password." });
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setLoginError({ type: "error", title: "Login Failed", body: error.message });
        return;
      }

      /* ── Status check — block non-active users immediately ── */
      const status = (data.user.user_metadata?.status || "active").toLowerCase();
      if (status !== "active") {
        // Sign them back out so no session is preserved
        await supabase.auth.signOut();
        const msg = STATUS_MESSAGES[status] || {
          icon: "⛔",
          title: "Access Denied",
          body: `Your account status is "${status}". Please contact an administrator.`,
        };
        setLoginError({ type: status, title: msg.title, body: msg.body });
        return;
      }

      /* ── Role routing ── */
      let role = data.user.user_metadata?.role;

      if (!role || role === "user") {
        // Fallback: check profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();
        if (profile?.role) role = profile.role;
      }

      if (role === "admin") {
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (aal?.currentLevel === "aal2") {
          navigate("/admin/dashboard");
          return;
        }
        const { data: mfaData } = await supabase.auth.mfa.listFactors();
        const totpFactor = mfaData?.totp?.[0];
        if (totpFactor && totpFactor.status === "verified") {
          setMfaFactorId(totpFactor.id);
          setMfaStep(true);
        } else {
          navigate("/admin/dashboard");
        }
        return;
      }

      navigate("/dashboard");
      return;
    }

    if (action === "Sign Up") {
      if (!email || !password || !name) {
        setLoginError({ type: "error", title: "Missing Fields", body: "Please fill in all fields to continue." });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, name, role: "user", status: "active" } },
      });

      if (error) {
        setLoginError({ type: "error", title: "Sign Up Failed", body: error.message });
        return;
      }
      if (data?.user && data.user.identities?.length === 0) {
        setLoginError({ type: "error", title: "Already Registered", body: "An account with this email already exists. Please log in instead." });
        return;
      }
      setLoginError({
        type: "pending",
        title: "Check Your Email",
        body: "Signup successful! Please check your inbox to confirm your email address.",
      });
      setAction("Login");
    }
  };

  /* ── Admin MFA verification ── */
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
      setLoginError({ type: "error", title: "Email Required", body: "Enter your email address above first." });
      return;
    }
    if (cooldown) {
      setLoginError({ type: "pending", title: "Please Wait", body: "A reset email was already sent. Please wait 1 minute before requesting another." });
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:5173/reset-password",
    });

    if (error) {
      setLoginError({ type: "error", title: "Reset Failed", body: error.message });
      return;
    }

    setLoginError({ type: "pending", title: "Reset Email Sent", body: "Check your inbox for a password reset link." });
    setCooldown(true);
    setTimeout(() => setCooldown(false), 60000);
  };

  return (
    <div className="container">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="header">
        <div className="text">{mfaStep ? "Admin Verification" : action}</div>
        <div className="underline"></div>
      </div>

      {/* ── Status / error banner ── */}
      {loginError && (
        <div style={{ marginTop: 20 }}>
          <LoginBanner
            type={loginError.type}
            title={loginError.title}
            body={loginError.body}
            onClose={clearError}
          />
        </div>
      )}

      {/* ── Admin MFA step ── */}
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
                placeholder="Full Name"
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
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
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
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
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
                <div className="submit gray" onClick={() => { setAction("Sign Up"); clearError(); }}>Sign Up</div>
                <button type="submit" className="submit">Login</button>
              </>
            ) : (
              <>
                <button type="submit" className="submit">Sign Up</button>
                <div className="submit gray" onClick={() => { setAction("Login"); clearError(); }}>Login</div>
              </>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default Login;
