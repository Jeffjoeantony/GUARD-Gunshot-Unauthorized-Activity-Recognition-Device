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
  e.preventDefault(); // 🚫 stop page reload

  if (action === "Login") {
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
      return;
    }

    navigate("/dashboard");
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
          role: "user",
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
};



  return (
    <div className="container">
      <div className="header">
        <div className="text">{action}</div>
        <div className="underline"></div>
      </div>

      {/* ✅ FORM ENABLES ENTER KEY */}
      <form className="inputs" onSubmit={handleSubmit}>
        {/* NAME (Sign Up only) */}
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
            Forgot password? <span>Click here</span>
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

              {/* ✅ Submit button */}
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
