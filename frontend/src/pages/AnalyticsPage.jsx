import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  NotificationsActive, TrendingUp, Shield, DevicesOther,
  Analytics, Refresh, Speed, QueryStats, Bolt,
} from "@mui/icons-material";
import "../styles/Analytics.css";

/* ── Constants ────────────────────────────────────────────────── */
const API = "http://localhost:5000/api";
const CHART_COLORS = ["#28b60c", "#00aaff", "#f5a623", "#ff4757", "#a55eea", "#2ed573"];
const RANGES = [
  { label: "7D",  days: 7  },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
  { label: "ALL", days: 9999 },
];

/* ── Utilities ────────────────────────────────────────────────── */
const fmtPct = (v) => (v != null ? `${(v * 100).toFixed(1)}%` : "—");
const fmtTs  = (ts) => ts ? new Date(ts * 1000).toLocaleString() : "—";
const fmtRel = (ts) => {
  if (!ts) return "—";
  const d = Math.floor((Date.now() / 1000 - ts) / 86400);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
};

const dayLabel = (offsetFromToday, total) => {
  const d = new Date();
  d.setDate(d.getDate() - offsetFromToday);
  if (total <= 14) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/* Build daily buckets for any N-day window */
const buildDaily = (alerts, days) => {
  const cap = days === 9999 ? 30 : days;
  const buckets = Array.from({ length: cap }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (cap - 1 - i));
    d.setHours(0, 0, 0, 0);
    return {
      label: dayLabel(cap - 1 - i, cap),
      date:  d.toDateString(),
      count: 0,
      gunshot:  0,
      chainsaw: 0,
      other:    0,
    };
  });

  const cutoff = days === 9999 ? 0 : Date.now() / 1000 - days * 86400;
  alerts.forEach((a) => {
    if (a.timestamp < cutoff) return;
    const ds = new Date((a.timestamp || 0) * 1000).toDateString();
    const b = buckets.find((x) => x.date === ds);
    if (!b) return;
    b.count++;
    const t = (a.type || "").toLowerCase();
    if (t.includes("gun")) b.gunshot++;
    else if (t.includes("chain")) b.chainsaw++;
    else b.other++;
  });

  return buckets;
};

/* Build 24-slot hourly frequency */
const buildHourly = (alerts, days) => {
  const cutoff = days === 9999 ? 0 : Date.now() / 1000 - days * 86400;
  const hours = Array(24).fill(0);
  alerts.forEach((a) => {
    if (a.timestamp >= cutoff) {
      const h = new Date((a.timestamp || 0) * 1000).getHours();
      hours[h]++;
    }
  });
  return hours;
};

/* Build confidence buckets 0-10%, 10-20%, … 90-100% */
const buildConfHist = (alerts, days) => {
  const cutoff = days === 9999 ? 0 : Date.now() / 1000 - days * 86400;
  const bins = Array(10).fill(0);
  alerts.forEach((a) => {
    if (a.timestamp >= cutoff) {
      const idx = Math.min(9, Math.floor((a.confidence || 0) * 10));
      bins[idx]++;
    }
  });
  return bins.map((v, i) => ({ label: `${i * 10}%`, val: v }));
};

/* Build device breakdown */
const buildDevices = (alerts, days) => {
  const cutoff = days === 9999 ? 0 : Date.now() / 1000 - days * 86400;
  const map = {};
  alerts.forEach((a) => {
    if (a.timestamp >= cutoff) {
      const d = a.deviceId || "Unknown";
      map[d] = (map[d] || 0) + 1;
    }
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));
};

/* Build detection type donut */
const buildTypes = (alerts, days) => {
  const cutoff = days === 9999 ? 0 : Date.now() / 1000 - days * 86400;
  const map = {};
  alerts.forEach((a) => {
    if (a.timestamp >= cutoff) {
      const t = a.type || "Unknown";
      map[t] = (map[t] || 0) + 1;
    }
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
};

/* Sparkline data — last 7 day counts */
const buildSpark = (alerts) => buildDaily(alerts, 7).map((d) => d.count);

/* ── Custom Tooltip ─────────────────────────────────────────── */
const DarkTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1a1a1a", border: "1px solid #333",
      borderRadius: 10, padding: "10px 14px", fontSize: 12,
    }}>
      <div style={{ color: "#888", marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
};

/* ── KPI Card ───────────────────────────────────────────────── */
const KpiCard = ({ icon: Icon, label, value, sub, accent, delta, spark }) => {
  const maxSpark = Math.max(...spark, 1);
  return (
    <div className="an-kpi" style={{ "--kc": accent }}>
      <div className="an-kpi-bar" />
      <div className="an-kpi-top">
        <div className="an-kpi-icon"><Icon style={{ fontSize: 20 }} /></div>
        {delta != null && (
          <span className={`an-kpi-delta ${delta > 0 ? "up" : delta < 0 ? "down" : "neutral"}`}>
            {delta > 0 ? "▲" : delta < 0 ? "▼" : "—"} {Math.abs(delta)}
          </span>
        )}
      </div>
      <div className="an-kpi-value">{value}</div>
      <div className="an-kpi-label">{label}</div>
      {sub && <div className="an-kpi-sub">{sub}</div>}
      {spark && (
        <div className="an-spark">
          {spark.map((v, i) => (
            <div
              key={i}
              className="an-spark-bar"
              style={{ height: `${Math.round((v / maxSpark) * 100)}%` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ── SVG Arc Gauge ─────────────────────────────────────────── */
const ArcGauge = ({ pct }) => {
  const r = 54, cx = 70, cy = 70, stroke = 10;
  const circ = Math.PI * r; // half-circle
  const filled = circ * pct;
  const color = pct >= 0.9 ? "#28b60c" : pct >= 0.7 ? "#f5a623" : "#ff4757";
  return (
    <svg viewBox="0 0 140 80" className="an-dial-arc">
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} strokeLinecap="round"
      />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
    </svg>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function AnalyticsPage() {
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [range,   setRange]   = useState(7);         // days

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/alerts`);
      const d = await r.json();
      setAlerts(Array.isArray(d) ? d : []);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Derived data ── */
  const cutoff = range === 9999 ? 0 : Date.now() / 1000 - range * 86400;
  const inRange = useMemo(() => alerts.filter(a => a.timestamp >= cutoff), [alerts, range]);

  const daily    = useMemo(() => buildDaily(alerts, range),    [alerts, range]);
  const hourly   = useMemo(() => buildHourly(alerts, range),   [alerts, range]);
  const confHist = useMemo(() => buildConfHist(alerts, range), [alerts, range]);
  const devices  = useMemo(() => buildDevices(alerts, range),  [alerts, range]);
  const types    = useMemo(() => buildTypes(alerts, range),    [alerts, range]);
  const spark    = useMemo(() => buildSpark(alerts),           [alerts]);

  const totalInRange  = inRange.length;
  const avgConf       = inRange.length ? inRange.reduce((s, a) => s + (a.confidence || 0), 0) / inRange.length : 0;
  const uniqueDevices = new Set(inRange.map(a => a.deviceId).filter(Boolean)).size;
  const todayCut      = Date.now() / 1000 - 86400;
  const today         = alerts.filter(a => a.timestamp >= todayCut).length;
  const prevPeriodCut = cutoff - (range === 9999 ? 0 : range * 86400);
  const prevCount     = alerts.filter(a => a.timestamp >= prevPeriodCut && a.timestamp < cutoff).length;
  const delta         = prevCount === 0 ? null : totalInRange - prevCount;

  const maxHour = Math.max(...hourly, 1);
  const maxDev  = devices[0]?.count || 1;
  const typeTotal = types.reduce((s, t) => s + t.value, 0) || 1;

  const recent = [...inRange]
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 6);

  /* peak hour */
  const peakHour = hourly.indexOf(Math.max(...hourly));
  const peakLabel = peakHour === 0 ? "12 AM"
    : peakHour < 12  ? `${peakHour} AM`
    : peakHour === 12 ? "12 PM"
    : `${peakHour - 12} PM`;

  const Skeleton = ({ h = 16, w = "100%" }) => (
    <div className="an-skeleton" style={{ height: h, width: w }} />
  );


  return (
    <div className="an-page">

      {/* ── Header ── */}
      <div className="an-header">
        <div className="an-header-left">
          <h1>Analytics</h1>
          <p>Real-time forest threat intelligence • {totalInRange} detections in selected period</p>
        </div>
        <div className="an-header-right">
          {RANGES.map(r => (
            <button
              key={r.days}
              className={`an-range-btn${range === r.days ? " active" : ""}`}
              onClick={() => setRange(r.days)}
            >
              {r.label}
            </button>
          ))}
          <button className="an-refresh-btn" onClick={load}>
            <Refresh style={{ fontSize: 15 }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="an-kpi-grid">
        <KpiCard
          icon={NotificationsActive}
          label="Total Detections"
          value={loading ? "—" : totalInRange}
          sub={`${today} today`}
          accent="#28b60c"
          delta={delta}
          spark={spark}
        />
        <KpiCard
          icon={TrendingUp}
          label="Avg Confidence"
          value={loading ? "—" : fmtPct(avgConf)}
          sub="Detection accuracy"
          accent="#00aaff"
          spark={spark.map(() => Math.random())}
        />
        <KpiCard
          icon={DevicesOther}
          label="Active Devices"
          value={loading ? "—" : uniqueDevices}
          sub="Unique sensors"
          accent="#a55eea"
          spark={spark.map((_, i) => i % 3)}
        />
        <KpiCard
          icon={Speed}
          label="Peak Hour"
          value={loading ? "—" : peakLabel}
          sub={`${hourly[peakHour]} alerts`}
          accent="#f5a623"
          spark={hourly.slice(0, 7)}
        />
      </div>

      {/* ── Main row: Area chart + Confidence gauge ── */}
      <div className="an-row-main">

        {/* Area chart — daily trend */}
        <div className="an-panel">
          <div className="an-panel-title">
            <QueryStats />
            Detection Trend — {RANGES.find(r => r.days === range)?.label}
          </div>
          {loading ? <Skeleton h={220} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={daily} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {[["gun","#28b60c"], ["chain","#00aaff"], ["other","#f5a623"]].map(([k, c]) => (
                    <linearGradient key={k} id={`g${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis dataKey="label" tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTip />} />
                <Area type="monotone" dataKey="gunshot"  name="Gunshot"  stroke="#28b60c" fill="url(#ggun)"   strokeWidth={2} />
                <Area type="monotone" dataKey="chainsaw" name="Chainsaw" stroke="#00aaff" fill="url(#gchain)" strokeWidth={2} />
                <Area type="monotone" dataKey="other"    name="Other"    stroke="#f5a623" fill="url(#gother)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Confidence gauge */}
        <div className="an-panel" style={{ display: "flex", flexDirection: "column" }}>
          <div className="an-panel-title"><Shield />Avg Confidence</div>
          <div className="an-dial-wrap" style={{ flex: 1 }}>
            <ArcGauge pct={avgConf} />
            <div className="an-dial-value">{fmtPct(avgConf)}</div>
            <div className="an-dial-label">detection accuracy</div>
          </div>

          {/* Type breakdown below dial */}
          <div style={{ marginTop: 16 }}>
            {loading ? <Skeleton h={60} /> : types.slice(0, 3).map((t, i) => (
              <div key={t.name} className="an-type-row">
                <div className="an-type-dot" style={{ background: CHART_COLORS[i] }} />
                <div className="an-type-name">{t.name}</div>
                <div className="an-type-bar-wrap">
                  <div className="an-type-bar-fill" style={{ width: `${(t.value / typeTotal) * 100}%`, background: CHART_COLORS[i] }} />
                </div>
                <div className="an-type-pct">{Math.round((t.value / typeTotal) * 100)}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Three-col row: hourly bar chart + device list + donut ── */}
      <div className="an-row-three">

        {/* Hourly distribution bar chart */}
        <div className="an-panel">
          <div className="an-panel-title"><Bolt />Hourly Distribution</div>
          {loading ? <Skeleton h={140} /> : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={hourly.map((v, i) => ({
                hour: i === 0 ? "12a" : i < 12 ? `${i}a` : i === 12 ? "12p" : `${i-12}p`,
                count: v,
              }))} margin={{ top: 2, right: 2, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis dataKey="hour" tick={{ fill: "#444", fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis allowDecimals={false} tick={{ fill: "#444", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTip />} />
                <Bar dataKey="count" name="Alerts" radius={[3, 3, 0, 0]}>
                  {hourly.map((v, i) => (
                    <Cell key={i} fill={v === Math.max(...hourly) ? "#28b60c" : "rgba(40,182,12,0.3)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Device breakdown */}
        <div className="an-panel">
          <div className="an-panel-title"><DevicesOther />Top Devices</div>
          {loading ? <Skeleton h={160} /> : devices.length === 0 ? (
            <div className="an-empty">No device data</div>
          ) : (
            <div className="an-device-list">
              {devices.map((d, i) => (
                <div key={d.name} className="an-device-row">
                  <div className="an-device-name" title={d.name}>{d.name}</div>
                  <div className="an-device-bar-wrap">
                    <div className="an-device-bar-fill" style={{
                      width: `${(d.count / maxDev) * 100}%`,
                      background: CHART_COLORS[i % CHART_COLORS.length],
                    }} />
                  </div>
                  <div className="an-device-count">{d.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detection type donut */}
        <div className="an-panel">
          <div className="an-panel-title"><Analytics />Detection Types</div>
          {loading ? <Skeleton h={160} /> : types.length === 0 ? (
            <div className="an-empty">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={types}
                  cx="50%" cy="50%"
                  innerRadius={40} outerRadius={62}
                  paddingAngle={3} dataKey="value"
                >
                  {types.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 8, fontSize: 12 }}
                  itemStyle={{ color: "#fff" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: "#888" }}
                  iconType="circle" iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Two-col row: confidence histogram + recent feed ── */}
      <div className="an-row-two">

        {/* Confidence distribution histogram */}
        <div className="an-panel">
          <div className="an-panel-title"><TrendingUp />Confidence Distribution</div>
          {loading ? <Skeleton h={120} /> : (
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={confHist} margin={{ top: 2, right: 4, left: -28, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis dataKey="label" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTip />} />
                <Bar dataKey="val" name="Alerts" radius={[4, 4, 0, 0]}>
                  {confHist.map((b, i) => (
                    <Cell key={i} fill={
                      i >= 8 ? "#28b60c" : i >= 6 ? "#2ed573" : i >= 4 ? "#f5a623" : "#ff4757"
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: "#555" }}>
            <span>■ <span style={{ color: "#ff4757" }}>Low</span></span>
            <span>■ <span style={{ color: "#f5a623" }}>Medium</span></span>
            <span>■ <span style={{ color: "#2ed573" }}>High</span></span>
            <span>■ <span style={{ color: "#28b60c" }}>Very High</span></span>
          </div>
        </div>

        {/* Recent activity feed */}
        <div className="an-panel">
          <div className="an-panel-title"><NotificationsActive />Recent Detections</div>
          {loading ? <Skeleton h={160} /> : recent.length === 0 ? (
            <div className="an-empty">No recent detections</div>
          ) : (
            <ul className="an-feed">
              {recent.map((a) => (
                <li key={a.id} className="an-feed-item">
                  <div className={`an-feed-dot${(a.confidence || 0) > 0.85 ? " high" : ""}`} />
                  <div>
                    <div className="an-feed-text">
                      <strong style={{ color: "#e0e0e0" }}>{a.type || "Detection"}</strong>
                      {" on "}{a.deviceId || "device"}
                      {" — "}{fmtPct(a.confidence)}
                    </div>
                    <div className="an-feed-time">{fmtTs(a.timestamp)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Daily alert bars (full width) ── */}
      <div className="an-panel">
        <div className="an-panel-title"><QueryStats />Daily Alert Volume</div>
        {loading ? <Skeleton h={160} /> : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={daily} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
              <XAxis dataKey="label" tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false}
                interval={range > 14 ? 2 : 0} />
              <YAxis allowDecimals={false} tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTip />} />
              <Bar dataKey="gunshot"  name="Gunshot"  stackId="a" fill="#28b60c" radius={[0, 0, 0, 0]} />
              <Bar dataKey="chainsaw" name="Chainsaw" stackId="a" fill="#00aaff" />
              <Bar dataKey="other"    name="Other"    stackId="a" fill="#f5a623" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}
