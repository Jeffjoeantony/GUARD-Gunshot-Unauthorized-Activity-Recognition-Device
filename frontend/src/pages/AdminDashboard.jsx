import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AdminStats from '../components/AdminStats'
import Alertlog from './Alertlog'
import AdminUserTable from '../components/AdminUserTable'
import MapPage from './MapPage'
import "../styles/Dashboard.css" // Use existing Dashboard styles

const AdminDashboard = () => {
  const location = useLocation();
  const isRootAdmin = location.pathname.endsWith('/admin') || location.pathname.endsWith('/admin/');

  return (
    <div className={isRootAdmin ? "main-content" : "admin-subpage-wrapper"}>
      {isRootAdmin && (
        <>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Manage system alerts and users</p>
        </>
      )}
      
      <Routes>
        <Route path="/" element={<AdminStats />} />
        <Route path="map" element={<MapPage />} />
        <Route path="alerts" element={<Alertlog />} />
        <Route path="users" element={<AdminUserTable />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Routes>
    </div>
  )
}

export default AdminDashboard
