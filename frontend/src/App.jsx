
import { Routes, Route, Navigate } from "react-router-dom";


import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Alertlog from "./pages/Alertlog";
import AdminDashboard from "./pages/AdminDashboard";
import MapPage from "./pages/MapPage";
import DashboardLayout from "./layouts/DashboardLayout";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <Routes>

      <Route path="/" element={<Navigate to="/login" />} />

      <Route path="/login" element={<Login />} />

      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<DashboardLayout />}>

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/alerts" element={<Alertlog />} />

        <Route path="/admin" element={<AdminDashboard />} />

        <Route path="/map" element={<MapPage />} />

      </Route>

      <Route path="*" element={<h1>404 - Page Not Found</h1>} />

    </Routes>
  );
}

export default App;