import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import "../styles/Login.css";

function ResetPassword() {

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sessionReady, setSessionReady] = useState(false);

  // Restore recovery session from URL
  useEffect(() => {

    const restoreSession = async () => {

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error(error.message);
      }

      if (data.session) {
        setSessionReady(true);
      } else {
        // Try to read tokens from URL fragment
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (!error) {
          setSessionReady(true);
        }
      }

    };

    restoreSession();

  }, []);

  const handleReset = async () => {

    if (!password || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Password updated successfully");
      window.location.href = "/login";
    }

  };

  if (!sessionReady) {
    return (
      <div className="container">
        <div className="header">
          <div className="text">Verifying Reset Link...</div>
          <div className="underline"></div>
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

        {/* New Password */}
        <div className="input">
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Confirm Password */}
        <div className="input">
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <div className="update-container">
          <button
            className="update"
            onClick={handleReset}
          >
            Update Password
          </button>
        </div>

      </div>

    </div>

  );

}

export default ResetPassword;