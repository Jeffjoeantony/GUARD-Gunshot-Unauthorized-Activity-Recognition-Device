import { useEffect, useState } from "react";
import { supabase, supabaseAdmin } from "../services/supabaseClient";
import "../styles/Statscards.css";

const AdminStats = () => {
  const [stats, setStats] = useState({
    totalAlerts: 0,
    alertsToday: 0,
    totalUsers: 0,
    activeUsers: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('alerts')
        .select('*');

      // Fetch users
      const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

      let totalAlerts = 0;
      let alertsToday = 0;
      
      if (!alertsError && alertsData) {
        totalAlerts = alertsData.length;
        const now = Date.now() / 1000;
        const last24h = now - 86400;
        
        alertsData.forEach(alert => {
          // ensure we handle timestamp correctly (seconds vs ms depending on DB convention)
          let alertTs = alert.timestamp;
          if (alertTs && typeof alertTs === 'string') {
              alertTs = new Date(alertTs).getTime() / 1000;
          } else if (alertTs > 2000000000) {
              alertTs = alertTs / 1000;
          }
          if (alertTs >= last24h) {
            alertsToday++;
          }
        });
      }

      let totalUsers = 0;
      let activeUsers = 0;

      if (!usersError && usersData?.users) {
        totalUsers = usersData.users.length;
        const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        usersData.users.forEach(user => {
          if (user.last_sign_in_at) {
            const lastSignIn = new Date(user.last_sign_in_at);
            if (lastSignIn >= tenMinsAgo) {
              activeUsers++;
            }
          }
        });
      }

      setStats({
        totalAlerts,
        alertsToday,
        totalUsers,
        activeUsers
      });
    };

    fetchStats();
  }, []);

  return (
    <div className="stats-grid">
      <div className="card">
        <h4>Total Alerts</h4>
        <h2>{stats.totalAlerts}</h2>
        <p>All time detections</p>
      </div>

      <div className="card">
        <h4>Alerts Today</h4>
        <h2>{stats.alertsToday}</h2>
        <p>Last 24 hours</p>
      </div>

      <div className="card">
        <h4>Total Users</h4>
        <h2>{stats.totalUsers}</h2>
        <p>Registered users</p>
      </div>

      <div className="card">
        <h4>Active Users</h4>
        <h2>{stats.activeUsers}</h2>
        <p>Online recently</p>
      </div>
    </div>
  );
};

export default AdminStats;
