import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, Map, AddAlert, Analytics, Settings, Group, Assessment } from '@mui/icons-material'
import '../styles/Sidebar.css'

const Sidebar = () => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div>
      <div className="sidebar">
        <ul className='sidebar-items'>
          {isAdminPath ? (
            <>
              <NavLink to='/admin' end className='sidebar-link'>
                <li>
                    <Assessment/>
                    <span>Overview</span>
                </li>
              </NavLink>
              <NavLink to='/admin/map' className='sidebar-link'>
                <li>
                  <Map/>
                  <span>Map</span>
                </li>
              </NavLink>
              <NavLink to='/admin/alerts' className='sidebar-link'>
                <li>
                    <AddAlert/>
                    <span>Alert Logs</span>
                </li>
              </NavLink>
              <NavLink to='/admin/users' className='sidebar-link'>
                <li>
                    <Group/>
                    <span>Users</span>
                </li>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to='/dashboard' className='sidebar-link'>
                <li>
                    <Home/>
                    <span>Dashboard</span>
                </li>
              </NavLink>
              <NavLink to='/map' className='sidebar-link'>
                <li>
                  <Map/>
                  <span>Map</span>
                </li>
              </NavLink>
              <NavLink to='/alerts' className='sidebar-link'>
                <li>
                    <AddAlert/>
                    <span>Alert Logs</span>
                </li>
              </NavLink>
              <NavLink to='/analytics' className='sidebar-link'>
                <li>
                    <Analytics/>
                    <span>Analytics</span>
                </li>
              </NavLink>
              <NavLink to='/settings' className='sidebar-link'>
                <li>
                    <Settings/>
                    <span>Settings</span>
                </li>
              </NavLink>
            </>
          )}
        </ul>
      </div>
    </div>
  )
}

export default Sidebar
