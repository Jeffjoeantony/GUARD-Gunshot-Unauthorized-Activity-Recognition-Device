import React, { useEffect, useState } from "react";
import {AreaChart,Area,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,Legend,
} from "recharts";
import {NotificationsActive,People,DevicesOther,Shield,TrendingUp,AccessTime,CheckCircle,Warning,AdminPanelSettings,Refresh,
} from "@mui/icons-material";
import "../styles/AdminDashboard.css";

/* ── Mock / API helpers ─────────────────────────────────────── */

const API_BASE = "http://localhost:5000/api";

const fetchAlerts = () =>
  fetch(`${API_BASE}/alerts`)
    .then((r) => r.json())
    .catch(() => []);

const fetchStats = () =>
  fetch(`${API_BASE}/alert-stats`)
    .then((r) => r.json())
    .catch(() => ({}));

/* ── Utility ────────────────────────────────────────────────── */

const fmtConf = (v) =>
  v !== null && v !== undefined ? `${(v * 100).toFixed(1)}%` : "—";

const fmtTime = (ts) =>
  ts ? new Date(ts * 1000).toLocaleString() : "—";

/* Build "alerts per day (last 7 days)" from raw alert array */
const buildChartData = (alerts) => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: d.toDateString(),
      Gunshot: 0,
      Chainsaw: 0,
      Other: 0,
    });
  }

  alerts.forEach((a) => {
    const d = new Date((a.timestamp || 0) * 1000).toDateString();
    const entry = days.find((x) => x.date === d);
    if (!entry) return;
    const t = (a.type || "").toLowerCase();
    if (t.includes("gun")) entry.Gunshot += 1;
    else if (t.includes("chain")) entry.Chainsaw += 1;
    else entry.Other += 1;
  });

  return days;
};

/* Build type distribution for donut chart */
const buildTypeData = (alerts) => {
  const map = {};
  alerts.forEach((a) => {
    const t = a.type || "Unknown";
    map[t] = (map[t] || 0) + 1;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
};

const DONUT_COLORS = ["#28b60c", "#00aaff", "#f5a623", "#ff4757", "#a55eea"];

/* ── Sub-components ─────────────────────────────────────────── */

const StatCard = ({ icon: Icon, label, value, sub, accent }) => (
  <div className="adm-card" style={{ "--accent": accent }}>
    <div className="adm-card-icon">
      <Icon />
    </div>
    <div className="adm-card-body">
      <span className="adm-card-label">{label}</span>
      <span className="adm-card-value">{value}</span>
      <span className="adm-card-sub">{sub}</span>
    </div>
    <div className="adm-card-bar" />
  </div>
);

const Badge = ({ status }) => {
  const map = {
    new: { cls: "badge-new", label: "New" },
    resolved: { cls: "badge-ok", label: "Resolved" },
    pending: { cls: "badge-warn", label: "Pending" },
  };
  const { cls, label } = map[(status || "new").toLowerCase()] || map.new;
  return <span className={`adm-badge ${cls}`}>{label}</span>;
};

/* ── Main Component ─────────────────────────────────────────── */

const AdminDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = () => {
    setLoading(true);
    Promise.all([fetchAlerts(), fetchStats()]).then(([al, st]) => {
      setAlerts(al);
      setStats(st);
      setLoading(false);
      setLastRefresh(new Date());
    });
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  const chartData = buildChartData(alerts);
  const typeData = buildTypeData(alerts);
  const recent = [...alerts]
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 8);

  /* activity feed – latest 5 */
  const activity = recent.slice(0, 5).map((a) => ({
    id: a.id,
    text: `${a.type || "Detection"} detected on device ${a.deviceId || "—"}`,
    time: fmtTime(a.timestamp),
    warn: (a.confidence || 0) > 0.8,
  }));

  return (
    <div className="adm-page">
      {/* ── Header ── */}
      <div className="adm-header">
        <div>
          <div className="adm-header-row">
            <AdminPanelSettings className="adm-title-icon" />
            <h1 className="adm-title">Admin Dashboard</h1>
          </div>
          <p className="adm-subtitle">
            System overview &amp; security analytics
          </p>
        </div>
        <button className="adm-refresh-btn" onClick={load} disabled={loading}>
          <Refresh className={loading ? "spin" : ""} />
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <p className="adm-last-refresh">
        <AccessTime style={{ fontSize: 14 }} />
        &nbsp;Last updated: {lastRefresh.toLocaleTimeString()}
      </p>

      {/* ── Stats Cards ── */}
      <div className="adm-stats-grid">
        <StatCard
          icon={NotificationsActive}
          label="Total Alerts"
          value={stats?.totalAlerts ?? "—"}
          sub="All time detections"
          accent="#28b60c"
        />
        <StatCard
          icon={TrendingUp}
          label="Alerts Today"
          value={stats?.alertsToday ?? "—"}
          sub="Last 24 hours"
          accent="#00aaff"
        />
        <StatCard
          icon={Shield}
          label="Avg Confidence"
          value={fmtConf(stats?.avgConfidence)}
          sub="Detection accuracy"
          accent="#f5a623"
        />
        <StatCard
          icon={DevicesOther}
          label="Active Devices"
          value={
            alerts.length
              ? new Set(alerts.map((a) => a.deviceId).filter(Boolean)).size
              : "—"
          }
          sub="Unique sensors online"
          accent="#a55eea"
        />
      </div>

      {/* ── Charts row ── */}
      <div className="adm-charts-row">
        {/* Area chart */}
        <div className="adm-panel adm-panel-lg">
          <h3 className="adm-panel-title">Alert Trends — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gGun" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#28b60c" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#28b60c" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gChain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00aaff" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00aaff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gOther" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f5a623" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f5a623" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#aaa", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#aaa", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: 8,
                  color: "#fff",
                }}
              />
              <Area
                type="monotone"
                dataKey="Gunshot"
                stroke="#28b60c"
                fill="url(#gGun)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="Chainsaw"
                stroke="#00aaff"
                fill="url(#gChain)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="Other"
                stroke="#f5a623"
                fill="url(#gOther)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut chart */}
        <div className="adm-panel adm-panel-sm">
          <h3 className="adm-panel-title">Detection Types</h3>
          {typeData.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {typeData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend
                  wrapperStyle={{ fontSize: 12, color: "#ccc" }}
                  iconType="circle"
                />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: 8,
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="adm-no-data">No data available</p>
          )}
        </div>
      </div>

      {/* ── Bottom row: table + activity ── */}
      <div className="adm-bottom-row">
        {/* Recent alerts table */}
        <div className="adm-panel adm-panel-lg">
          <h3 className="adm-panel-title">Recent Alerts</h3>
          <div className="adm-table-wrapper">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Confidence</th>
                  <th>Device</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.length ? (
                  recent.map((a) => (
                    <tr key={a.id}>
                      <td className="adm-td-id">#{a.id}</td>
                      <td>
                        <span className="adm-type-badge">{a.type || "—"}</span>
                      </td>
                      <td>
                        <div className="adm-conf-wrap">
                          <div
                            className="adm-conf-bar"
                            style={{
                              width: `${Math.round((a.confidence || 0) * 100)}%`,
                              background:
                                (a.confidence || 0) > 0.8
                                  ? "#28b60c"
                                  : "#f5a623",
                            }}
                          />
                          <span>{fmtConf(a.confidence)}</span>
                        </div>
                      </td>
                      <td>{a.deviceId || "—"}</td>
                      <td>{fmtTime(a.timestamp)}</td>
                      <td>
                        <Badge status={a.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="adm-no-data">
                      {loading ? "Loading…" : "No alerts found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity feed */}
        <div className="adm-panel adm-panel-sm">
          <h3 className="adm-panel-title">Activity Feed</h3>
          <ul className="adm-feed">
            {activity.length ? (
              activity.map((item) => (
                <li key={item.id} className="adm-feed-item">
                  <div className={`adm-feed-dot ${item.warn ? "warn" : ""}`} />
                  <div className="adm-feed-content">
                    <p className="adm-feed-text">{item.text}</p>
                    <span className="adm-feed-time">{item.time}</span>
                  </div>
                </li>
              ))
            ) : (
              <li className="adm-no-data">
                {loading ? "Loading…" : "No recent activity"}
              </li>
            )}
          </ul>

          {/* System status pills */}
          <div className="adm-status-section">
            <h4 className="adm-status-title">System Status</h4>
            <div className="adm-status-list">
              <div className="adm-status-row">
                <CheckCircle style={{ color: "#28b60c", fontSize: 16 }} />
                <span>API Server</span>
                <span className="adm-status-ok">Online</span>
              </div>
              <div className="adm-status-row">
                <CheckCircle style={{ color: "#28b60c", fontSize: 16 }} />
                <span>Database</span>
                <span className="adm-status-ok">Connected</span>
              </div>
              <div className="adm-status-row">
                <Warning style={{ color: "#f5a623", fontSize: 16 }} />
                <span>ML Engine</span>
                <span className="adm-status-warn">Processing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
