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
              setMenuOpen(!menuOpen);
              navigate(userRole === 'admin' ? "/admin/dashboard" : "/dashboard");
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
            onClick={() => navigate(userRole === 'admin' ? "/admin/dashboard" : "/dashboard")}
          >
            Dashboard
          </li>

          <li
            className="nav-items"
            onClick={() => navigate(userRole === 'admin' ? "/admin/map" : "/map")}
          >
            Map
          </li>

          <li
            className="nav-items"
            onClick={() => navigate(userRole === 'admin' ? "/admin/alerts" : "/alerts")}
          >
            Alerts
          </li>

          {userRole === 'admin' && (
            <li
              className="nav-items"
              onClick={() => navigate("/admin/devices")}
            >
              Devices
            </li>
          )}

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