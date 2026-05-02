import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Map, AddAlert, Analytics, Settings, AdminPanelSettings } from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import '../styles/Sidebar.css'

const Sidebar = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div>
      <div className="sidebar">
        <ul className='sidebar-items'>
          <NavLink to='/dashboard' className='sidebar-link'>
            <li><Home/><span>Dashboard</span></li>
          </NavLink>
          <NavLink to='/map' className='sidebar-link'>
            <li><Map/><span>Map</span></li>
          </NavLink>
          <NavLink to='/alerts' className='sidebar-link'>
            <li><AddAlert/><span>Alert Logs</span></li>
          </NavLink>
          <NavLink to='/analytics' className='sidebar-link'>
            <li><Analytics/><span>Analytics</span></li>
          </NavLink>
          <NavLink to='/settings' className='sidebar-link'>
            <li><Settings/><span>Settings</span></li>
          </NavLink>

          {userRole === 'admin' && (
            <NavLink to='/admin/dashboard' className='sidebar-link'>
              <li><AdminPanelSettings/><span>Admin</span></li>
            </NavLink>
          )}
        </ul>

        <div className="sidebar-footer">
          <button className="sidebar-user-btn" onClick={() => navigate('/settings')}>
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{fullName}</span>
              <span className="sidebar-user-role">{userRole || 'user'}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
