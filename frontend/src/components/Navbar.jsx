import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";
import { Logout, Menu, More, GraphicEq } from "@mui/icons-material";
import { supabase } from "../services/supabaseClient";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { useState } from "react";

function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

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
          <li className="nav-items" onClick={() => navigate("/dashboard")}>
            Dashboard
          </li>
          <li className="nav-items" onClick={() => navigate("/map")}>
            Map
          </li>
          <li className="nav-items" onClick={() => navigate("/alerts")}>
            Alerts
          </li>
          <li className="nav-items" onClick={() => navigate("/settings")}>
            Settings
          </li>
        </ul>

        <div className="nav-right">
          <More className="nav-icon" />
          <Logout
            className="nav-icon"
            onClick={() => setOpen(true)}
          />
        </div>
      </nav>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          Are you sure you want to logout?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              setOpen(false);
              handleLogout();
            }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Navbar;