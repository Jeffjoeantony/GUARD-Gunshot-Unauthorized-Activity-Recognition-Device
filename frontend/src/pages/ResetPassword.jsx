import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "../styles/Login.css";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("verifying"); // "verifying" | "ready" | "invalid"
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const restoreSession = async () => {
      // Only accept a PASSWORD_RECOVERY event — reject any plain logged-in session
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (event === "PASSWORD_RECOVERY" && session) {
            setStatus("ready");
          }
        }
      );

      // Also try exchanging a code/token from the URL (PKCE flow)
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (error) {
        // No valid recovery token in the URL and no PASSWORD_RECOVERY event
        setStatus("invalid");
      }

      return () => subscription.unsubscribe();
    };

    restoreSession();
  }, []);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      setMessage("Please fill in both fields.");
      return;
    }
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
    } else {
      await supabase.auth.signOut();
      navigate("/login");
    }
  };

  if (status === "verifying") {
    return (
      <div className="container">
        <div className="header">
          <div className="text">Verifying Reset Link…</div>
          <div className="underline"></div>
        </div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="container">
        <div className="header">
          <div className="text">Invalid Reset Link</div>
          <div className="underline"></div>
        </div>
        <p style={{ color: "#aaa", textAlign: "center", marginTop: 16, fontSize: 14 }}>
          This link is invalid or has expired. Please request a new password reset email.
        </p>
        <div className="submit-container" style={{ marginTop: 24 }}>
          <button className="submit" onClick={() => navigate("/login")}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <div className="text">Reset Password</div>
        <div className="underline"></div>
      </div>

      <div className="inputs">
        <div className="input">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="input">
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {message && (
          <p style={{ color: "#f87171", fontSize: 13, textAlign: "center", margin: "4px 0 0" }}>
            {message}
          </p>
        )}

        <div className="update-container">
          <button className="update" onClick={handleReset}>
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;