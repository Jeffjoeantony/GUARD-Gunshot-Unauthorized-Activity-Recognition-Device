import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Map, AddAlert, Analytics, Settings, AdminPanelSettings } from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import '../styles/Sidebar.css'

const Sidebar = () => {
  const { userRole } = useAuth();

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

          {/* Only visible to admin users */}
          {userRole === 'admin' && (
            <NavLink to='/admin/dashboard' className='sidebar-link'>
              <li><AdminPanelSettings/><span>Admin</span></li>
            </NavLink>
          )}
        </ul>
      </div>
    </div>
  )
}

export default Sidebar
