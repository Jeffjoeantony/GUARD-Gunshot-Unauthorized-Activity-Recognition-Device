import React, { useState, useEffect, useCallback } from "react";
import {
  DevicesOther, Add, Edit, Delete, Refresh, Close,
  CheckCircle, Warning, WifiOff, Wifi, SignalWifi4Bar,
  LocationOn, Notes, Router,
} from "@mui/icons-material";
import { supabase } from "../services/supabaseClient";
import "../styles/AdminDevices.css";

const API       = "http://localhost:5000/api";
const ADMIN_API = "http://localhost:5000/api/admin";

/* ── Auth header ─────────────────────────────────────────────── */
const getAuthHeader = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
};

/* ── Helpers ─────────────────────────────────────────────────── */
const fmtDate = (ts) =>
  ts ? new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

/* ── Status Badge ────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    online:  { cls: "dev-status-online",  icon: <Wifi style={{ fontSize: 12 }} />,    label: "Online"  },
    offline: { cls: "dev-status-offline", icon: <WifiOff style={{ fontSize: 12 }} />, label: "Offline" },
    unknown: { cls: "dev-status-unknown", icon: <Warning style={{ fontSize: 12 }} />, label: "Unknown" },
  };
  const s = map[(status || "unknown").toLowerCase()] || map.unknown;
  return (
    <span className={`dev-badge ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
};

/* ── Toast ───────────────────────────────────────────────────── */
const Toast = ({ msg, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`dev-toast ${type}`}>
      {type === "success"
        ? <CheckCircle style={{ color: "#28b60c", fontSize: 18 }} />
        : <Warning style={{ color: "#ff4757", fontSize: 18 }} />}
      {msg}
    </div>
  );
};

/* ── Add/Edit Modal ──────────────────────────────────────────── */
const BLANK = { name: "", deviceId: "", location: "", status: "online", notes: "" };

const DeviceModal = ({ device, onClose, onSave }) => {
  const isEdit = !!device?.id;
  const [form, setForm] = useState(isEdit ? { ...device } : { ...BLANK });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim())     { setErr("Device name is required"); return; }
    if (!form.deviceId.trim()) { setErr("Device ID is required (must match what ESP32 sends)"); return; }
    setSaving(true); setErr("");
    try {
      await onSave(form, isEdit);
      onClose();
    } catch (e) {
      setErr(e.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dev-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dev-modal">
        <div className="dev-modal-header">
          <span className="dev-modal-title">
            {isEdit ? "Edit Device" : "Register New Device"}
          </span>
          <button className="dev-modal-close" onClick={onClose}><Close fontSize="small" /></button>
        </div>

        <div className="dev-form-group">
          <label>Device Name *</label>
          <input placeholder="e.g. Forest Node 1" value={form.name} onChange={e => set("name", e.target.value)} />
        </div>

        <div className="dev-form-group">
          <label>Device ID * <span className="dev-label-hint">(must match deviceId sent by the ESP32 in alerts)</span></label>
          <input
            placeholder="e.g. ESP32_NODE_01"
            value={form.deviceId}
            onChange={e => set("deviceId", e.target.value)}
            disabled={isEdit}
            style={isEdit ? { opacity: 0.5, cursor: "not-allowed" } : {}}
          />
        </div>

        <div className="dev-form-row">
          <div className="dev-form-group">
            <label>GPS Location</label>
            <input placeholder="lat,lng  e.g. 10.8505,76.2711" value={form.location} onChange={e => set("location", e.target.value)} />
          </div>
          <div className="dev-form-group">
            <label>Status</label>
            <select value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </div>

        <div className="dev-form-group">
          <label>Notes</label>
          <textarea
            placeholder="Deployment notes, area description…"
            value={form.notes}
            onChange={e => set("notes", e.target.value)}
            rows={3}
          />
        </div>

        {err && <p className="dev-form-err">{err}</p>}

        <div className="dev-modal-footer">
          <button className="dev-btn-outline" onClick={onClose}>Cancel</button>
          <button className="dev-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Register Device"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Delete Confirm ──────────────────────────────────────────── */
const DeleteModal = ({ device, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const go = async () => {
    setLoading(true);
    await onConfirm(device);
    setLoading(false);
    onClose();
  };
  return (
    <div className="dev-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dev-modal dev-modal-sm">
        <div className="dev-modal-header">
          <span className="dev-modal-title">Remove Device</span>
          <button className="dev-modal-close" onClick={onClose}><Close fontSize="small" /></button>
        </div>
        <div className="dev-del-body">
          <div className="dev-del-icon"><Delete /></div>
          <p>Are you sure you want to remove <strong>{device?.name}</strong>?<br />
            Existing alerts will not be affected.</p>
        </div>
        <div className="dev-modal-footer">
          <button className="dev-btn-outline" onClick={onClose}>Cancel</button>
          <button className="dev-btn-danger" onClick={go} disabled={loading}>
            {loading ? "Removing…" : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function AdminDevices() {
  const [devices,   setDevices]   = useState([]);
  const [alerts,    setAlerts]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [editDev,   setEditDev]   = useState(null);  // null=closed, false=add new, obj=edit
  const [delDev,    setDelDev]    = useState(null);
  const [toast,     setToast]     = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  /* ── Load devices + alerts ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, aRes] = await Promise.all([
        fetch(`${API}/devices`),
        fetch(`${API}/alerts`),
      ]);
      const [dData, aData] = await Promise.all([dRes.json(), aRes.json()]);
      setDevices(Array.isArray(dData) ? dData : []);
      setAlerts(Array.isArray(aData) ? aData : []);
    } catch (err) {
      showToast(`Load failed: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Alert count per deviceId ── */
  const alertCountMap = alerts.reduce((m, a) => {
    if (a.deviceId) m[a.deviceId] = (m[a.deviceId] || 0) + 1;
    return m;
  }, {});

  /* ── Last alert per deviceId ── */
  const lastAlertMap = alerts.reduce((m, a) => {
    if (a.deviceId && (!m[a.deviceId] || a.timestamp > m[a.deviceId])) {
      m[a.deviceId] = a.timestamp;
    }
    return m;
  }, {});

  /* ── CRUD ── */
  const handleSave = async (form, isEdit) => {
    const authHeader = await getAuthHeader();
    if (isEdit) {
      const res = await fetch(`${ADMIN_API}/devices/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ name: form.name, location: form.location, status: form.status, notes: form.notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      setDevices(prev => prev.map(d => d.id === json.id ? json : d));
      showToast("Device updated");
    } else {
      const res = await fetch(`${ADMIN_API}/devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Create failed");
      setDevices(prev => [json, ...prev]);
      showToast("Device registered");
    }
  };

  const handleDelete = async (device) => {
    const authHeader = await getAuthHeader();
    const res = await fetch(`${ADMIN_API}/devices/${device.id}`, { method: "DELETE", headers: authHeader });
    if (!res.ok) { const j = await res.json(); throw new Error(j.error || "Delete failed"); }
    setDevices(prev => prev.filter(d => d.id !== device.id));
    showToast(`${device.name} removed`);
  };

  const toggleStatus = async (device) => {
    const next = device.status === "online" ? "offline" : "online";
    const authHeader = await getAuthHeader();
    await fetch(`${ADMIN_API}/devices/${device.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ status: next }),
    });
    setDevices(prev => prev.map(d => d.id === device.id ? { ...d, status: next } : d));
  };

  /* ── Stats ── */
  const totalDevices = devices.length;
  const onlineCount  = devices.filter(d => d.status === "online").length;
  const offlineCount = devices.filter(d => d.status === "offline").length;
  const alertTotal   = alerts.length;

  return (
    <div className="dev-page">

      {/* ── Header ── */}
      <div className="dev-header">
        <div>
          <div className="dev-header-row">
            <DevicesOther className="dev-title-icon" />
            <h1 className="dev-title">Device Management</h1>
          </div>
          <p className="dev-subtitle">Register and manage IoT sensor nodes in the field</p>
        </div>
        <div className="dev-header-actions">
          <button className="dev-btn-outline" onClick={load} disabled={loading}>
            <Refresh style={{ fontSize: 16 }} className={loading ? "spin" : ""} />
            Refresh
          </button>
          <button className="dev-btn-primary" onClick={() => setEditDev(false)}>
            <Add style={{ fontSize: 16 }} />
            Register Device
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="dev-stats-row">
        {[
          { label: "Total Devices", value: totalDevices, icon: <Router />,          accent: "#28b60c" },
          { label: "Online",        value: onlineCount,  icon: <SignalWifi4Bar />,   accent: "#00aaff" },
          { label: "Offline",       value: offlineCount, icon: <WifiOff />,          accent: "#ff4757" },
          { label: "Total Alerts",  value: alertTotal,   icon: <Warning />,          accent: "#f5a623" },
        ].map(({ label, value, icon, accent }) => (
          <div className="dev-stat-card" key={label} style={{ "--dsc-accent": accent }}>
            <div className="dev-stat-bar" />
            <div className="dev-stat-icon">{icon}</div>
            <div className="dev-stat-body">
              <span className="dev-stat-label">{label}</span>
              <span className="dev-stat-value">{loading ? "—" : value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Device Grid ── */}
      {loading ? (
        <div className="dev-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="dev-card dev-skeleton-card">
              <div className="dev-sk dev-sk-title" />
              <div className="dev-sk dev-sk-sub" />
              <div className="dev-sk dev-sk-body" />
            </div>
          ))}
        </div>
      ) : devices.length === 0 ? (
        <div className="dev-empty">
          <DevicesOther style={{ fontSize: 48, color: "#333" }} />
          <p>No devices registered yet</p>
          <button className="dev-btn-primary" onClick={() => setEditDev(false)}>
            <Add style={{ fontSize: 15 }} /> Register First Device
          </button>
        </div>
      ) : (
        <div className="dev-grid">
          {devices.map(d => {
            const alertCount = alertCountMap[d.deviceId] || 0;
            const lastTs     = lastAlertMap[d.deviceId];
            return (
              <div key={d.id} className="dev-card">
                {/* Card header */}
                <div className="dev-card-header">
                  <div className="dev-card-icon-wrap">
                    <Router style={{ fontSize: 22 }} />
                  </div>
                  <StatusBadge status={d.status} />
                </div>

                {/* Name + device ID */}
                <div className="dev-card-name">{d.name}</div>
                <div className="dev-card-id">
                  <span className="dev-mono">{d.deviceId}</span>
                </div>

                {/* Info rows */}
                <div className="dev-card-info">
                  {d.location && (
                    <div className="dev-info-row">
                      <LocationOn style={{ fontSize: 13, color: "#555" }} />
                      <span>{d.location}</span>
                    </div>
                  )}
                  {d.notes && (
                    <div className="dev-info-row">
                      <Notes style={{ fontSize: 13, color: "#555" }} />
                      <span className="dev-notes-text">{d.notes}</span>
                    </div>
                  )}
                </div>

                {/* Stats row */}
                <div className="dev-card-stats">
                  <div className="dev-card-stat">
                    <span className="dev-card-stat-val">{alertCount}</span>
                    <span className="dev-card-stat-lbl">Alerts</span>
                  </div>
                  <div className="dev-card-stat">
                    <span className="dev-card-stat-val">
                      {lastTs ? new Date(lastTs * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                    </span>
                    <span className="dev-card-stat-lbl">Last Alert</span>
                  </div>
                  <div className="dev-card-stat">
                    <span className="dev-card-stat-val">{fmtDate(d.addedAt)}</span>
                    <span className="dev-card-stat-lbl">Registered</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="dev-card-actions">
                  <button
                    className={`dev-toggle-btn ${d.status === "online" ? "is-online" : "is-offline"}`}
                    onClick={() => toggleStatus(d)}
                    title={d.status === "online" ? "Set Offline" : "Set Online"}
                  >
                    {d.status === "online" ? <Wifi style={{ fontSize: 14 }} /> : <WifiOff style={{ fontSize: 14 }} />}
                    {d.status === "online" ? "Set Offline" : "Set Online"}
                  </button>
                  <button className="dev-icon-btn edit" onClick={() => setEditDev(d)} title="Edit">
                    <Edit style={{ fontSize: 15 }} />
                  </button>
                  <button className="dev-icon-btn del" onClick={() => setDelDev(d)} title="Remove">
                    <Delete style={{ fontSize: 15 }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}
      {editDev !== null && (
        <DeviceModal
          device={editDev || null}
          onClose={() => setEditDev(null)}
          onSave={handleSave}
        />
      )}
      {delDev && (
        <DeleteModal
          device={delDev}
          onClose={() => setDelDev(null)}
          onConfirm={handleDelete}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
