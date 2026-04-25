import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  Dashboard,
  Map,
  NotificationsActive,
  People,
  DevicesOther,
  Settings,
  AdminPanelSettings,
} from '@mui/icons-material'
import '../styles/Sidebar.css'

const AdminSidebar = () => {
  return (
    <div>
      <div className="sidebar">
        <ul className='sidebar-items'>
          <NavLink to='/admin/dashboard' className='sidebar-link'>
            <li><Dashboard /><span>Dashboard</span></li>
          </NavLink>
          <NavLink to='/admin/alerts' className='sidebar-link'>
            <li><NotificationsActive /><span>Alert Logs</span></li>
          </NavLink>
          <NavLink to='/admin/map' className='sidebar-link'>
            <li><Map /><span>Map</span></li>
          </NavLink>
          <NavLink to='/admin/users' className='sidebar-link'>
            <li><People /><span>Users</span></li>
          </NavLink>
          <NavLink to='/admin/devices' className='sidebar-link'>
            <li><DevicesOther /><span>Devices</span></li>
          </NavLink>
          <NavLink to='/admin/settings' className='sidebar-link'>
            <li><Settings /><span>Settings</span></li>
          </NavLink>
        </ul>

        <div className="sidebar-footer">
          <div className="adm-sidebar-badge">
            <AdminPanelSettings style={{ fontSize: 18, color: '#28b60c' }} />
            <span style={{ fontSize: 12, color: '#888', marginLeft: 6 }}>Admin Panel</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSidebar
