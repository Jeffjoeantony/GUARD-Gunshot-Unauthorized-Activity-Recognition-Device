import React, { useState } from "react";
import "../styles/Login.css";
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useNavigate } from "react-router-dom";

const Login = () => {
  // 🔹 Login shown FIRST
  const [action, setAction] = useState("Login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }
    navigate("/dashboard");
  };

  return (
    <div className="container">
      <div className="header">
        <div className="text">{action}</div>
        <div className="underline"></div>
      </div>

      <div className="inputs">
        {/* Name field only for Sign Up */}
        {action === "Sign Up" && (
          <div className="input">
            <PersonIcon className="icon" />
            <input type="text" placeholder="Name" />
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

        <div className="input">
          <VisibilityIcon className="icon" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Forgot password only for Login */}
        {action === "Login" && (
          <div className="forgot-password">
            Forgot password? <span>Click here</span>
          </div>
        )}

        <div className="submit-container">
          {/* Sign Up Button */}
          <div
            className={action === "Sign Up" ? "submit gray" : "submit"}
            onClick={() => setAction("Sign Up")}
          >
            Sign Up
          </div>

          {/* Login Button */}
          <div
            className={action === "Login" ? "submit gray" : "submit"}
            onClick={() => {
              if (action === "Login") {
                handleLogin();
              } else {
                setAction("Login");
              }
            }}
          >
            Login
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
