import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Alertlog from "./pages/Alertlog";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import MapPage from "./pages/MapPage";
import AdminSetupMFA from "./pages/AdminSetupMFA";

import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";

function App() {
  return (
    <Routes>

      {/* ── Public routes ───────────────────────── */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* ── Admin auth routes (standalone, NO sidebar/navbar) ── */}
      <Route path="/admin/setup-mfa" element={<AdminSetupMFA />} />

      {/* ── Admin routes (with admin sidebar + navbar, wrapped by AdminRoute) ── */}
      <Route element={<AdminLayout />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/alerts" element={<Alertlog />} />
        <Route path="/admin/map" element={<MapPage />} />
        {/* Placeholder pages — replace with real admin pages when built */}
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/devices" element={<div style={{padding:'40px',color:'#fff',fontFamily:'Inter,sans-serif'}}><h2>Device Management</h2><p style={{color:'#888'}}>Coming soon…</p></div>} />
        <Route path="/admin/settings" element={<div style={{padding:'40px',color:'#fff',fontFamily:'Inter,sans-serif'}}><h2>Admin Settings</h2><p style={{color:'#888'}}>Coming soon…</p></div>} />
      </Route>

      {/* ── Protected app routes (with sidebar + navbar) ── */}
      <Route element={<DashboardLayout />}>
        <Route
          path="/dashboard"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />
        <Route
          path="/alerts"
          element={<ProtectedRoute><Alertlog /></ProtectedRoute>}
        />
        <Route
          path="/map"
          element={<ProtectedRoute><MapPage /></ProtectedRoute>}
        />
      </Route>

      {/* ── Fallback ───────────────────────────── */}
      <Route path="*" element={<h1>404 - Page Not Found</h1>} />

    </Routes>
  );
}

export default App;