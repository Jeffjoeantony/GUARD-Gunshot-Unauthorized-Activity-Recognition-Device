import React, { useState } from "react";
import "../styles/Login.css";
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { VisibilityOff } from "@mui/icons-material";

const Login = () => {
  const [action, setAction] = useState("Login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      navigate("/dashboard");
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      alert("Please fill all fields");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          role: "user",
        },
      },
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Signup successful! Please check your email.");
      setAction("Login");
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div className="text">{action}</div>
        <div className="underline"></div>
      </div>

      <div className="inputs">
        {/* NAME (Only for Sign Up) */}
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





        {/* FORGOT PASSWORD */}
        {action === "Login" && (
          <div className="forgot-password">
            Forgot password? <span>Click here</span>
          </div>
        )}

        <div className="submit-container">

  {action === "Login" ? (
    <>
      <div className="submit gray" onClick={() => setAction("Sign Up")}>
        Sign Up
      </div>

      <div className="submit" onClick={handleLogin}>
        Login
      </div>
    </>
  ) : (
    <>
      <div className="submit" onClick={handleSignUp}>
        Sign Up
      </div>

      <div className="submit gray" onClick={() => setAction("Login")}>
        Login
      </div>
    </>
  )}

</div>

      </div>
    </div>
  );
};

export default Login;