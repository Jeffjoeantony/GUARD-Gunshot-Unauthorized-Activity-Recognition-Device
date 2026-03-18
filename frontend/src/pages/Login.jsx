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

  const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault(); 

  if (action === "Login") {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const role = signInData?.user?.user_metadata?.role;
    if (role === "admin") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
    return; 
  }

  if (action === "Sign Up") {
    if (!email || !password || !name) {
      alert("Please fill all fields");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          role: email.startsWith("admin") ? "admin" : "user",
        },
      },
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (data?.user && data.user.identities?.length === 0) {
      alert("User already exists. Please login instead.");
      return;
    }

    alert("Signup successful! Please check your email.");
    setAction("Login");
    return;
  }
}

const [cooldown, setCooldown] = useState(false);

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
        <div className="text">{action}</div>
        <div className="underline"></div>
      </div>

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
            Forgot password? 
            <span
  onClick={!cooldown ? handleForgotPassword : undefined}
  style={{
    cursor: cooldown ? "not-allowed" : "pointer",
    color: cooldown ? "gray" : "rgb(40,182,12)"
  }}
>
Click here
</span>
          </div>
        )}

        <div className="submit-container">
          {action === "Login" ? (
            <>
              <div
                className="submit gray"
                onClick={() => setAction("Sign Up")}
              >
                Sign Up
              </div>

              <button type="submit" className="submit">
                Login
              </button>
            </>
          ) : (
            <>
              <button type="submit" className="submit">
                Sign Up
              </button>

              <div
                className="submit gray"
                onClick={() => setAction("Login")}
              >
                Login
              </div>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default Login;
