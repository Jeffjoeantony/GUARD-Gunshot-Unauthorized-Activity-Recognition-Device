import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";
import { Logout, Menu, More, GraphicEq } from "@mui/icons-material";
import { supabase } from "../services/supabaseClient";
import { useState } from "react";
import LogoutDialog from "./LogoutDialogue";

function Navbar() {
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-left">
          <div
            className="sidebar-icon"
            onClick={() => navigate("/dashboard")}
          >
            <Menu />
          </div>

          <div className="new-logo">
            <GraphicEq />
          </div>

          <span className="logo-text">GUARD</span>
        </div>

        <ul className="nav-center">
          <li
            className="nav-items"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </li>

          <li
            className="nav-items"
            onClick={() => navigate("/map")}
          >
            Map
          </li>

          <li
            className="nav-items"
            onClick={() => navigate("/alerts")}
          >
            Alerts
          </li>

          <li
            className="nav-items"
            onClick={() => navigate("/settings")}
          >
            Settings
          </li>
        </ul>

        <div className="nav-right">
          <More className="nav-icon" />

          <Logout
            className="nav-icon"
            onClick={() => setLogoutOpen(true)}
          />
        </div>
      </nav>

      {/* Logout Confirmation Dialog */}
      <LogoutDialog
        isOpen={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}

export default Navbar;