import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search, PersonAdd, FileDownload, Edit, Delete, Visibility,
  People, VerifiedUser, Block, HourglassEmpty, CheckCircle,
  Close, Warning, FilterList, Refresh,
} from "@mui/icons-material";
import "../styles/AdminUsers.css";


/* ── Constants ─────────────────────────────────────────────── */

const ROLES    = ["All", "admin", "user"];

const STATUSES = ["All", "active", "inactive", "banned", "pending", "suspended"];
const PAGE_SIZES = [5, 10, 20, 50];

const AVATAR_COLORS = [
  ["#28b60c","#0a5500"], ["#00aaff","#004488"], ["#a55eea","#4a0080"],
  ["#f5a623","#7a4d00"], ["#ff4757","#7a0010"], ["#2ed573","#0a5533"],
];


/* ── API base ───────────────────────────────────────────────── */
const API = "http://localhost:5000/api/admin";



/* ── Utilities ──────────────────────────────────────────────── */

const initials = (name = "") =>
  name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

const avatarColor = (str = "") => {
  let h = 0;
  for (let c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const fmtRelative = (iso) => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2)   return "just now";
  if (m < 60)  return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h} hour${h>1?"s":""} ago`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `${d} day${d>1?"s":""} ago`;
  const mo = Math.floor(d / 30);
  return `${mo} month${mo>1?"s":""} ago`;
};

const exportCSV = (users) => {
  const header = ["Full Name","Email","Username","Status","Role","Joined","Last Active"];
  const rows = users.map(u => [
    u.full_name, u.email, u.username || "", u.status, u.role,
    fmtDate(u.created_at), fmtRelative(u.last_active),
  ]);
  const csv = [header, ...rows].map(r => r.map(v=>`"${v??""}`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `guard_users_${Date.now()}.csv`;
  a.click();
};

/* ── Sub-components ─────────────────────────────────────────── */

const StatusBadge = ({ status }) => {
  const cls = {
    active:"status-active", inactive:"status-inactive",
    banned:"status-banned", pending:"status-pending", suspended:"status-suspended",
  }[(status||"inactive").toLowerCase()] ?? "status-inactive";
  return <span className={`usr-status ${cls}`}>{status ?? "—"}</span>;
};

const RoleBadge = ({ role }) => {
  const cls = {
    admin:"role-admin", moderator:"role-moderator",
    user:"role-user", guest:"role-guest",
  }[(role||"user").toLowerCase()] ?? "role-user";
  return <span className={`usr-role ${cls}`}>{role ?? "user"}</span>;
};

const Avatar = ({ name, size = 34 }) => {
  const [from, to] = avatarColor(name);
  return (
    <div className="usr-avatar" style={{
      width: size, height: size,
      background: `linear-gradient(135deg, ${from}, ${to})`,
      fontSize: Math.round(size * 0.38),
    }}>
      {initials(name)}
    </div>
  );
};

const Toast = ({ msg, type, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`usr-toast ${type}`}>
      {type === "success"
        ? <CheckCircle style={{ color: "#28b60c", fontSize: 18 }} />
        : <Warning style={{ color: "#ff4757", fontSize: 18 }} />
      }
      {msg}
    </div>
  );
};

/* ── Add / Edit Modal ───────────────────────────────────────── */
const BLANK_FORM = { full_name:"", email:"", username:"", role:"user", status:"active", password:"" };

const UserModal = ({ user, onClose, onSave }) => {
  const isEdit = !!user?.id;
  const [form, setForm] = useState(isEdit ? { ...user, password:"" } : { ...BLANK_FORM });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.full_name.trim()) { setErr("Full name is required"); return; }
    if (!form.email.trim())     { setErr("Email is required"); return; }
    if (!isEdit && !form.password.trim()) { setErr("Password is required for new users"); return; }
    setSaving(true);
    setErr("");
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
    <div className="usr-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="usr-modal">
        <div className="usr-modal-header">
          <span className="usr-modal-title">{isEdit ? "Edit User" : "Add New User"}</span>
          <button className="usr-modal-close" onClick={onClose}><Close fontSize="small" /></button>
        </div>

        <div className="usr-form-row">
          <div className="usr-form-group">
            <label>Full Name *</label>
            <input placeholder="John Smith" value={form.full_name} onChange={e=>set("full_name",e.target.value)} />
          </div>
          <div className="usr-form-group">
            <label>Username</label>
            <input placeholder="johnsmith" value={form.username||""} onChange={e=>set("username",e.target.value)} />
          </div>
        </div>

        <div className="usr-form-group">
          <label>Email *</label>
          <input type="email" placeholder="john@example.com" value={form.email} onChange={e=>set("email",e.target.value)} disabled={isEdit} />
        </div>

        {!isEdit && (
          <div className="usr-form-group">
            <label>Password *</label>
            <input type="password" placeholder="Min 8 characters" value={form.password||""} onChange={e=>set("password",e.target.value)} />
          </div>
        )}

        <div className="usr-form-row">
          <div className="usr-form-group">
            <label>Role</label>
            <select value={form.role} onChange={e=>set("role",e.target.value)}>
              {["admin", "user"].map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}

            </select>
          </div>
          <div className="usr-form-group">
            <label>Status</label>
            <select value={form.status} onChange={e=>set("status",e.target.value)}>
              {["active","inactive","pending","banned","suspended"].map(s=><option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {err && <p style={{ color:"#ff4757", fontSize:12, margin:"0 0 8px" }}>{err}</p>}

        <div className="usr-modal-footer">
          <button className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : (isEdit ? "Save Changes" : "Create User")}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Delete Confirm Modal ───────────────────────────────────── */
const DeleteModal = ({ user, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const go = async () => {
    setLoading(true);
    await onConfirm(user);
    setLoading(false);
    onClose();
  };
  return (
    <div className="usr-modal-backdrop" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="usr-modal usr-modal-sm">
        <div className="usr-modal-header">
          <span className="usr-modal-title">Delete User</span>
          <button className="usr-modal-close" onClick={onClose}><Close fontSize="small"/></button>
        </div>
        <div className="usr-del-body">
          <div className="usr-del-icon"><Delete /></div>
          <p className="usr-del-text">
            Are you sure you want to delete <span className="usr-del-name">{user?.full_name}</span>?
            <br />This action cannot be undone.
          </p>
        </div>
        <div className="usr-modal-footer">
          <button className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-danger" onClick={go} disabled={loading}>
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── View Modal ─────────────────────────────────────────────── */
const ViewModal = ({ user, onClose, onEdit }) => (
  <div className="usr-modal-backdrop" onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className="usr-modal">
      <div className="usr-modal-header">
        <span className="usr-modal-title">User Details</span>
        <button className="usr-modal-close" onClick={onClose}><Close fontSize="small"/></button>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:22 }}>
        <Avatar name={user.full_name} size={56} />
        <div>
          <div style={{ fontWeight:700, fontSize:16, color:"#fff" }}>{user.full_name}</div>
          <div style={{ fontSize:12, color:"#666", marginTop:3 }}>{user.email}</div>
          <div style={{ display:"flex", gap:8, marginTop:8 }}>
            <RoleBadge role={user.role} />
            <StatusBadge status={user.status} />
          </div>
        </div>
      </div>
      {[
        ["Username", user.username || "—"],
        ["Joined",   fmtDate(user.created_at)],
        ["Last Active", fmtRelative(user.last_active)],
        ["User ID",  user.id],
      ].map(([k,v])=>(
        <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.05)", fontSize:13 }}>
          <span style={{ color:"#666" }}>{k}</span>
          <span style={{ color:"#ccc", fontFamily: k==="User ID"?"monospace":"inherit", fontSize: k==="User ID"?11:13, maxWidth:240, overflow:"hidden", textOverflow:"ellipsis" }}>{v}</span>
        </div>
      ))}
      <div className="usr-modal-footer">
        <button className="btn-outline" onClick={onClose}>Close</button>
        <button className="btn-primary" onClick={()=>{onClose();onEdit(user);}}>
          <Edit fontSize="small"/> Edit User
        </button>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */

export default function AdminUsers() {
  const [allUsers,  setAllUsers]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [roleF,     setRoleF]     = useState("All");
  const [statusF,   setStatusF]   = useState("All");
  const [sortKey,   setSortKey]   = useState("created_at");
  const [sortDir,   setSortDir]   = useState("desc");
  const [page,      setPage]      = useState(1);
  const [pageSize,  setPageSize]  = useState(10);
  const [selected,  setSelected]  = useState(new Set());
  const [editUser,  setEditUser]  = useState(null);   // null=closed, false=add new, obj=edit
  const [delUser,   setDelUser]   = useState(null);
  const [viewUser,  setViewUser]  = useState(null);
  const [toast,     setToast]     = useState(null);   // {msg, type}

  /* ── Load real users from backend (Supabase Auth admin API) ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/users`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setAllUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load users:", err);
      showToast(`Failed to load users: ${err.message}`, "error");
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  /* ── Derived / filtered list ── */
  const filtered = useMemo(() => {
    let list = [...allUsers];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        (u.full_name||"").toLowerCase().includes(q) ||
        (u.email||"").toLowerCase().includes(q) ||
        (u.username||"").toLowerCase().includes(q)
      );
    }
    if (roleF !== "All")   list = list.filter(u => u.role   === roleF);
    if (statusF !== "All") list = list.filter(u => u.status === statusF);

    list.sort((a, b) => {
      let av = a[sortKey] ?? "", bv = b[sortKey] ?? "";
      if (sortDir === "asc") return av < bv ? -1 : av > bv ? 1 : 0;
      return av > bv ? -1 : av < bv ? 1 : 0;
    });

    return list;
  }, [allUsers, search, roleF, statusF, sortKey, sortDir]);

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageUsers  = filtered.slice((page-1)*pageSize, page*pageSize);

  /* Reset page on filter change */
  useEffect(() => setPage(1), [search, roleF, statusF, pageSize]);

  /* ── Sorting ── */
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const thCls = (k) => sortKey === k ? (sortDir === "asc" ? "sort-asc" : "sort-desc") : "";

  /* ── Selection ── */
  const allPageIds = pageUsers.map(u => u.id);
  const allPageSel = allPageIds.length > 0 && allPageIds.every(id => selected.has(id));
  const toggleAll  = () => {
    setSelected(prev => {
      const s = new Set(prev);
      if (allPageSel) allPageIds.forEach(id => s.delete(id));
      else allPageIds.forEach(id => s.add(id));
      return s;
    });
  };
  const toggleOne = (id) => setSelected(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });

  /* ── Stats ── */
  const stats = useMemo(() => ({
    total:     allUsers.length,
    active:    allUsers.filter(u => u.status === "active").length,
    admins:    allUsers.filter(u => u.role   === "admin").length,
    banned:    allUsers.filter(u => u.status === "banned" || u.status === "suspended").length,
  }), [allUsers]);

  /* ── Toast helper ── */
  const showToast = (msg, type="success") => setToast({ msg, type });

  /* ── CRUD handlers — real backend calls ── */
  const handleSave = async (form, isEdit) => {
    if (isEdit) {
      // PATCH user metadata
      const res = await fetch(`${API}/users/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          username:  form.username,
          role:      form.role,
          status:    form.status,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      setAllUsers(prev => prev.map(u => u.id === json.id ? json : u));
      showToast("User updated successfully");
    } else {
      // POST create new user
      const res = await fetch(`${API}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Create failed");
      setAllUsers(prev => [json, ...prev]);
      showToast("User created successfully");
    }
  };

  const handleDelete = async (user) => {
    const res = await fetch(`${API}/users/${user.id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || "Delete failed");
    }
    setAllUsers(prev => prev.filter(u => u.id !== user.id));
    setSelected(prev => { const s = new Set(prev); s.delete(user.id); return s; });
    showToast(`${user.full_name} deleted`);
  };

  const handleBulkDelete = async () => {
    const ids = [...selected];
    try {
      await Promise.all(
        ids.map(id => fetch(`${API}/users/${id}`, { method: "DELETE" }))
      );
      setAllUsers(prev => prev.filter(u => !selected.has(u.id)));
      setSelected(new Set());
      showToast(`Deleted ${ids.length} user(s)`);
    } catch (err) {
      showToast(`Bulk delete failed: ${err.message}`, "error");
    }
  };

  /* ── Pagination helpers ── */
  const pageNums = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i=1; i<=totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i=Math.max(2,page-1); i<=Math.min(totalPages-1,page+1); i++) pages.push(i);
      if (page < totalPages-2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  /* ── Render ── */
  return (
    <div className="usr-page">

      {/* ── Header ── */}
      <div className="usr-header">
        <div className="usr-header-left">
          <h1>User Management</h1>
          <p>Manage all users in one place. Control access, assign roles, and monitor activity.</p>
        </div>
        <div className="usr-header-actions">
          <button className="btn-outline" onClick={load} title="Refresh">
            <Refresh style={{ fontSize:16 }} />
            Refresh
          </button>
          <button className="btn-outline" onClick={() => exportCSV(filtered)}>
            <FileDownload style={{ fontSize:16 }} />
            Export
          </button>
          <button className="btn-primary" onClick={() => setEditUser(false)}>
            <PersonAdd style={{ fontSize:16 }} />
            Add User
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="usr-stats-row">
        {[
          { label:"Total Users",   value: stats.total,  icon:<People />,         accent:"#28b60c" },
          { label:"Active",        value: stats.active, icon:<CheckCircle />,     accent:"#00aaff" },
          { label:"Admins",        value: stats.admins, icon:<VerifiedUser />,    accent:"#a55eea" },
          { label:"Banned / Susp", value: stats.banned, icon:<Block />,           accent:"#ff4757" },
        ].map(({ label, value, icon, accent }) => (
          <div className="usr-stat-card" key={label} style={{"--sc-accent": accent}}>
            <div className="usr-stat-bar" />
            <div className="usr-stat-icon">{icon}</div>
            <div className="usr-stat-body">
              <span className="usr-stat-label">{label}</span>
              <span className="usr-stat-value">{loading ? "—" : value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="usr-toolbar">
        <div className="usr-search-wrap">
          <Search />
          <input
            className="usr-search"
            placeholder="Search by name, email or username…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select className="usr-filter" value={roleF} onChange={e=>setRoleF(e.target.value)}>
          {ROLES.map(r => <option key={r} value={r}>{r === "All" ? "All Roles" : r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
        </select>

        <select className="usr-filter" value={statusF} onChange={e=>setStatusF(e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s === "All" ? "All Statuses" : s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>

        <div className="usr-toolbar-right">
          {selected.size > 0 && (
            <button className="btn-danger" onClick={handleBulkDelete}>
              <Delete style={{ fontSize:15 }} />
              Delete {selected.size} selected
            </button>
          )}
        </div>
      </div>

      {/* ── Table panel ── */}
      <div className="usr-panel">

        {/* Bulk action hint */}
        {selected.size > 0 && (
          <div className="usr-bulk-bar">
            <CheckCircle style={{ fontSize:16 }} />
            {selected.size} user{selected.size>1?"s":""} selected
          </div>
        )}

        <div className="usr-table-wrap">
          <table className="usr-table">
            <thead>
              <tr>
                <th className="usr-cb-col">
                  <input type="checkbox" className="usr-cb" checked={allPageSel} onChange={toggleAll} />
                </th>
                <th className={thCls("full_name")} onClick={()=>toggleSort("full_name")}>Full Name</th>
                <th className={thCls("email")} onClick={()=>toggleSort("email")}>Email</th>
                <th className={thCls("username")} onClick={()=>toggleSort("username")}>Username</th>
                <th className={thCls("status")} onClick={()=>toggleSort("status")}>Status</th>
                <th className={thCls("role")} onClick={()=>toggleSort("role")}>Role</th>
                <th className={thCls("created_at")} onClick={()=>toggleSort("created_at")}>Joined Date</th>
                <th className={thCls("last_active")} onClick={()=>toggleSort("last_active")}>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length:5}).map((_,i)=>(
                  <tr key={i}>
                    {Array.from({length:9}).map((_,j)=>(
                      <td key={j}><div style={{ height:14, borderRadius:4, background:"rgba(255,255,255,0.05)", width:`${40+Math.random()*40}%` }} /></td>
                    ))}
                  </tr>
                ))
              ) : pageUsers.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="usr-empty">
                      <People />
                      <p>No users match your filters</p>
                    </div>
                  </td>
                </tr>
              ) : pageUsers.map(u => (
                <tr key={u.id} className={selected.has(u.id) ? "selected" : ""}>
                  <td>
                    <input type="checkbox" className="usr-cb"
                      checked={selected.has(u.id)}
                      onChange={()=>toggleOne(u.id)}
                    />
                  </td>
                  <td>
                    <div className="usr-user-cell">
                      <Avatar name={u.full_name} />
                      <div>
                        <div className="usr-name">{u.full_name}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color:"#888", fontSize:12 }}>{u.email}</td>
                  <td style={{ color:"#666", fontSize:12 }}>{u.username || "—"}</td>
                  <td><StatusBadge status={u.status} /></td>
                  <td><RoleBadge role={u.role} /></td>
                  <td style={{ color:"#777", fontSize:12 }}>{fmtDate(u.created_at)}</td>
                  <td style={{ color:"#777", fontSize:12 }}>{fmtRelative(u.last_active)}</td>
                  <td>
                    <div className="usr-actions">
                      <button className="usr-action-btn view" title="View" onClick={()=>setViewUser(u)}>
                        <Visibility style={{ fontSize:15 }} />
                      </button>
                      <button className="usr-action-btn edit" title="Edit" onClick={()=>setEditUser(u)}>
                        <Edit style={{ fontSize:15 }} />
                      </button>
                      <button className="usr-action-btn del" title="Delete" onClick={()=>setDelUser(u)}>
                        <Delete style={{ fontSize:15 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="usr-pagination-bar">
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span className="usr-rows-info">Rows per page</span>
            <select className="usr-rows-select" value={pageSize} onChange={e=>setPageSize(Number(e.target.value))}>
              {PAGE_SIZES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <span className="usr-rows-info">
              of {filtered.length} {filtered.length===1?"user":"users"}
            </span>
          </div>

          <div className="usr-pages">
            <button className="usr-page-btn" onClick={()=>setPage(1)} disabled={page===1}>«</button>
            <button className="usr-page-btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>‹</button>
            {pageNums().map((n,i) =>
              n === "..." ? (
                <span key={`e${i}`} style={{ color:"#555", padding:"0 4px" }}>…</span>
              ) : (
                <button key={n} className={`usr-page-btn${page===n?" active":""}`} onClick={()=>setPage(n)}>{n}</button>
              )
            )}
            <button className="usr-page-btn" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}>›</button>
            <button className="usr-page-btn" onClick={()=>setPage(totalPages)} disabled={page===totalPages}>»</button>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {(editUser !== null) && (
        <UserModal
          user={editUser || null}
          onClose={() => setEditUser(null)}
          onSave={handleSave}
        />
      )}

      {delUser && (
        <DeleteModal
          user={delUser}
          onClose={() => setDelUser(null)}
          onConfirm={handleDelete}
        />
      )}

      {viewUser && (
        <ViewModal
          user={viewUser}
          onClose={() => setViewUser(null)}
          onEdit={(u) => setEditUser(u)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}

    </div>
  );
}
