import React, { useEffect, useState } from "react";
import AlertTable from "../components/AlertTable";
import AlertFilters from "../components/AlertFilters";
import "../styles/Alertlog.css"

const Alertlog = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  console.log("Fetching alerts...");

  fetch("http://localhost:5000/api/alerts")
    .then(res => {
      console.log("Response:", res);
      return res.json();
    })
    .then(data => {
      console.log("Alerts data:", data);

      const sorted = data
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 100);

      setAlerts(sorted);
      setLoading(false);
    })
    .catch(err => {
      console.error("Fetch error:", err);
      setLoading(false);
    });
}, []);


  if (loading) return <p>Loading alerts...</p>;

  return (
    <div className="alertlog-container">
  <h2 className="alertlog-title">Alerts Log</h2>

  <div className="alertlog-table-wrapper">
    <div className="alertlog-table-scroll">
      <AlertTable alerts={alerts} />
    </div>
  </div>
</div>


  );
};

export default Alertlog;
