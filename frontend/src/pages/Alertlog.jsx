import { useState } from "react";
import alertData from "../data/alertData";
import AlertTable from "../components/AlertTable";
import "../styles/alertLog.css";
import "../styles/alertFilters.css";

const Alertlog = () => {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [minConfidence, setMinConfidence] = useState(0);

  const filteredAlerts = alertData.filter(alert => {
    const matchSearch =
      alert.id.toLowerCase().includes(search.toLowerCase()) ||
      alert.type.toLowerCase().includes(search.toLowerCase());  

    const matchType = type === "All" || alert.type === type;
    const matchStatus = status === "All" || alert.status === status;
    const matchConfidence = alert.confidence >= minConfidence;

    return matchSearch && matchType && matchStatus && matchConfidence;
  });

  return (
    <div className="alertlog-container">
      <h1>Alerts Log</h1>
      <p className="subtitle">Complete history of detected events</p>

      {/* FILTER BAR */}
      <div className="filter-box">
        <h3>Filters</h3>

        <div className="filter-row">
          <input
            type="text"
            placeholder="Search by ID or type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <div className="buttons">
            {["All", "Gunshot", "Chainsaw", "Ambient"].map(t => (
              <button
                key={t}
                className={type === t ? "active" : ""}
                onClick={() => setType(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-row">
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="All">All Status</option>
            <option value="New">New</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Resolved">Resolved</option>
          </select>

          <div className="slider">
            <label>Min Confidence: {minConfidence}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={minConfidence}
              onChange={e => setMinConfidence(e.target.value)}
            />
          </div>
        </div>
      </div>

      <AlertTable alerts={filteredAlerts} />
    </div>
  );
};

export default Alertlog;
