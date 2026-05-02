import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Dashboard,
  Map,
  NotificationsActive,
  People,
  DevicesOther,
  Settings,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import '../styles/Sidebar.css'

const AdminSidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin';
  const initials = fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

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
          <button className="sidebar-user-btn" onClick={() => navigate('/admin/settings')}>
            <div className="sidebar-user-avatar admin-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{fullName}</span>
              <span className="sidebar-user-role admin-role">admin</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminSidebar
