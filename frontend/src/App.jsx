
import { Routes, Route, Navigate } from "react-router-dom";


import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Alertlog from "./pages/Alertlog";
import AdminDashboard from "./pages/AdminDashboard";
import MapPage from "./pages/MapPage";
import DashboardLayout from "./layouts/DashboardLayout";

function App() {
  return (
    <Routes>

      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* Login page */}
      <Route path="/login" element={<Login />} />

      {/* Dashboard layout routes */}
      <Route element={<DashboardLayout />}>

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/alerts" element={<Alertlog />} />

        <Route path="/admin" element={<AdminDashboard />} />

        <Route path="/map" element={<MapPage />} />

      </Route>

      {/* Fallback */}
      <Route path="*" element={<h1>404 - Page Not Found</h1>} />

    </Routes>
  );
}

export default App;