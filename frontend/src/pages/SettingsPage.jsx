import React, { useState, useEffect } from "react";
import {
  Person, Lock, Info, ExitToApp,
  CheckCircle, ErrorOutline, Shield,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../context/AuthContext";
import "../styles/Settings.css";

/* ── Utilities ──────────────────────────────────────────────── */
const initials = (name = "") =>
  name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

const AVATAR_GRAD = ["linear-gradient(135deg,#28b60c,#0a5500)", "linear-gradient(135deg,#a55eea,#4a0080)",
  "linear-gradient(135deg,#00aaff,#004488)", "linear-gradient(135deg,#f5a623,#7a4d00)"];

const avatarGrad = (str = "") => {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_GRAD[Math.abs(h) % AVATAR_GRAD.length];
};

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-US",
  { year: "numeric", month: "long", day: "numeric" }) : "—";

/* ── Alert banner ───────────────────────────────────────────── */
const Alert = ({ type, msg, onClose }) => (
  <div className={`st-alert st-alert-${type}`}>
    {type === "success"
      ? <CheckCircle style={{ fontSize: 16 }} />
      : <ErrorOutline  style={{ fontSize: 16 }} />}
    {msg}
    <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none",
      color: "inherit", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   isAdmin prop controls title and slight colour accent only —
   all actual functionality is identical for both contexts.
══════════════════════════════════════════════════════════════ */
export default function SettingsPage({ isAdmin = false }) {
  const navigate   = useNavigate();
  const { user }   = useAuth();

  /* ── Profile form ── */
  const [fullName,  setFullName]  = useState("");
  const [username,  setUsername]  = useState("");
  const [saving,    setSaving]    = useState(false);
  const [profAlert, setProfAlert] = useState(null);

  /* ── Password form ── */
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving,  setPwSaving]  = useState(false);
  const [pwAlert,   setPwAlert]   = useState(null);

  /* ── Load current user data ── */
  useEffect(() => {
    if (!user) return;
    setFullName(user.user_metadata?.full_name || user.user_metadata?.name || "");
    setUsername(user.user_metadata?.username  || "");
  }, [user]);

  /* ── Save profile ── */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) { setProfAlert({ type: "error", msg: "Full name is required." }); return; }
    setSaving(true);
    setProfAlert(null);
    const { error } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        full_name: fullName.trim(),
        username:  username.trim() || null,
      },
    });
    setSaving(false);
    setProfAlert(error
      ? { type: "error",   msg: error.message }
      : { type: "success", msg: "Profile updated successfully." });
  };

  /* ── Change password via backend (avoids client-side session errors) ── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPw.length < 8)   { setPwAlert({ type: "error", msg: "Password must be at least 8 characters." }); return; }
    if (newPw !== confirmPw) { setPwAlert({ type: "error", msg: "Passwords do not match." }); return; }

    setPwSaving(true);
    setPwAlert(null);

    try {
      // Get the current session access token to authenticate the request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setPwAlert({ type: "error", msg: "Session expired. Please log in again." });
        setPwSaving(false);
        return;
      }

      const res = await fetch("http://localhost:5000/api/user/password", {
        method:  "PATCH",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ password: newPw }),
      });

      const json = await res.json();

      if (!res.ok) {
        setPwAlert({ type: "error", msg: json.error || "Failed to update password." });
      } else {
        setPwAlert({ type: "success", msg: "Password changed successfully." });
        setNewPw(""); setConfirmPw("");
      }
    } catch {
      setPwAlert({ type: "error", msg: "Could not reach the server. Is the backend running?" });
    } finally {
      setPwSaving(false);
    }
  };


  /* ── Sign out ── */
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  /* ── Derived display values ── */
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const role        = user?.user_metadata?.role || "user";
  const status      = user?.user_metadata?.status || "active";
  const joinedAt    = user?.created_at;
  const lastLogin   = user?.last_sign_in_at;

  return (
    <div className="st-page">

      {/* ── Header ── */}
      <div className="st-header">
        <h1>{isAdmin ? "Admin Settings" : "Settings"}</h1>
        <p>Manage your account preferences and security</p>
      </div>

      {/* ── Profile card ── */}
      <div className="st-card">
        <div className="st-card-header">
          <div className="st-card-icon"><Person style={{ fontSize: 18 }} /></div>
          <div>
            <div className="st-card-title">Profile</div>
            <div className="st-card-sub">Update your display name and username</div>
          </div>
        </div>

        {/* Avatar + email row */}
        <div className="st-profile-row">
          <div className="st-avatar" style={{ background: avatarGrad(displayName) }}>
            {initials(displayName)}
          </div>
          <div>
            <p className="st-profile-name">{displayName}</p>
            <p className="st-profile-email">{user?.email}</p>
          </div>
        </div>

        {profAlert && <Alert type={profAlert.type} msg={profAlert.msg} onClose={() => setProfAlert(null)} />}

        <form onSubmit={handleSaveProfile}>
          <div className="st-row">
            <div className="st-group">
              <label className="st-label">Full Name *</label>
              <input
                className="st-input"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="st-group">
              <label className="st-label">Username</label>
              <input
                className="st-input"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="@username"
              />
            </div>
          </div>
          <div className="st-group">
            <label className="st-label">Email Address</label>
            <input
              className="st-input st-input-readonly"
              value={user?.email || ""}
              readOnly
              tabIndex={-1}
            />
          </div>

          <div className="st-btn-row">
            <button type="submit" className="st-btn st-btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Password card ── */}
      <div className="st-card">
        <div className="st-card-header">
          <div className="st-card-icon"><Lock style={{ fontSize: 18 }} /></div>
          <div>
            <div className="st-card-title">Change Password</div>
            <div className="st-card-sub">Use a strong password of at least 8 characters</div>
          </div>
        </div>

        {pwAlert && <Alert type={pwAlert.type} msg={pwAlert.msg} onClose={() => setPwAlert(null)} />}

        <form onSubmit={handleChangePassword}>
          <div className="st-row">
            <div className="st-group">
              <label className="st-label">New Password</label>
              <input
                type="password"
                className="st-input"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="Min 8 characters"
                autoComplete="new-password"
              />
            </div>
            <div className="st-group">
              <label className="st-label">Confirm Password</label>
              <input
                type="password"
                className="st-input"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="st-btn-row">
            <button type="submit" className="st-btn st-btn-primary" disabled={pwSaving}>
              {pwSaving ? "Updating…" : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Account info card ── */}
      <div className="st-card">
        <div className="st-card-header">
          <div className="st-card-icon"><Info style={{ fontSize: 18 }} /></div>
          <div>
            <div className="st-card-title">Account Information</div>
            <div className="st-card-sub">Read-only details about your account</div>
          </div>
        </div>

        <div className="st-info-grid">
          <div className="st-info-item">
            <div className="st-info-key">Email</div>
            <div className="st-info-val">{user?.email || "—"}</div>
          </div>
          <div className="st-info-item">
            <div className="st-info-key">Role</div>
            <div className="st-info-val" style={{ textTransform: "capitalize", color: role === "admin" ? "#a55eea" : "#28b60c" }}>
              {role}
            </div>
          </div>
          <div className="st-info-item">
            <div className="st-info-key">Account Status</div>
            <div className="st-info-val" style={{ textTransform: "capitalize",
              color: status === "active" ? "#28b60c" : "#ff4757" }}>
              {status}
            </div>
          </div>
          <div className="st-info-item">
            <div className="st-info-key">User ID</div>
            <div className="st-info-val" style={{ fontSize: 11, fontFamily: "monospace", color: "#555" }}>
              {user?.id || "—"}
            </div>
          </div>
          <div className="st-info-item">
            <div className="st-info-key">Member Since</div>
            <div className="st-info-val">{fmtDate(joinedAt)}</div>
          </div>
          <div className="st-info-item">
            <div className="st-info-key">Last Login</div>
            <div className="st-info-val">{fmtDate(lastLogin)}</div>
          </div>
        </div>
      </div>

      {/* ── MFA hint for admins ── */}
      {isAdmin && (
        <div className="st-card">
          <div className="st-card-header">
            <div className="st-card-icon"><Shield style={{ fontSize: 18 }} /></div>
            <div>
              <div className="st-card-title">Two-Factor Authentication</div>
              <div className="st-card-sub">MFA is managed during login setup</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: "#666", margin: 0 }}>
            Admin MFA (TOTP) is configured on your first login. To reset your authenticator,
            contact the system owner.
          </p>
        </div>
      )}

      {/* ── Sign out / danger zone ── */}
      <div className="st-card st-danger-zone">
        <div className="st-card-header">
          <div className="st-card-icon"><ExitToApp style={{ fontSize: 18 }} /></div>
          <div>
            <div className="st-card-title">Sign Out</div>
            <div className="st-card-sub">End your current session on this device</div>
          </div>
        </div>
        <button className="st-btn st-btn-danger" onClick={handleSignOut}>
          <ExitToApp style={{ fontSize: 16 }} />
          Sign Out
        </button>
      </div>

    </div>
  );
}
