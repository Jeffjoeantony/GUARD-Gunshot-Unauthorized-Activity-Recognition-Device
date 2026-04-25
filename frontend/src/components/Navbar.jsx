import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";
import { Logout, Menu, More, GraphicEq } from "@mui/icons-material";
import { supabase } from "../services/supabaseClient";
import { useState } from "react";
import LogoutDialog from "./LogoutDialogue";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { userRole } = useAuth();

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
            onClick={() => {
              setMenuOpen(!menuOpen); // toggle mobile menu
              navigate("/dashboard");
            }}
          >
            <Menu />
          </div>

          <div className="new-logo">
            <GraphicEq />
          </div>

          <span className="logo-text">GUARD</span>
        </div>

        {/* NAV CENTER */}
        <ul className={`nav-center ${menuOpen ? "active" : ""}`}>
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

          {/* Only visible to admin users */}
          {userRole === 'admin' && (
            <li
              className="nav-items"
              onClick={() => navigate("/admin/dashboard")}
            >
              Admin
            </li>
          )}
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