import { useEffect, useState } from "react"
import { getLatestAlert, getAlertStats } from "../services/api"
import "../styles/Statscards.css"

const Statscards = () => {
  const [latest, setLatest] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getLatestAlert().then(setLatest)
    getAlertStats().then(setStats)
  }, [])

  return (
    <div className="stats-grid">

      <div className="card">
        <h4>Total Alerts</h4>
        <h2>{stats?.totalAlerts ?? "—"}</h2>
        <p>All time detections</p>
      </div>

      <div className="card">
        <h4>Alerts Today</h4>
        <h2>{stats?.alertsToday ?? "—"}</h2>
        <p>Last 24 hours</p>
      </div>

      <div className="card">
        <h4>Avg Confidence</h4>
        <h2>
          {stats ? `${(stats.avgConfidence * 100).toFixed(1)}%` : "—"}
        </h2>
        <p>Detection accuracy</p>
      </div>

      <div className="card">
        <h4>Latest Alert</h4>
        <h2>{latest?.type ?? "None"}</h2>
        <p>
          Confidence: {latest ? `${latest.confidence * 100}%` : "—"}
        </p>
      </div>

    </div>
  )
}

export default Statscards
