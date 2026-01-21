import React, {useState} from 'react'
import { NavLink } from 'react-router-dom'
import { Home } from '@mui/icons-material'
import { Map } from '@mui/icons-material'
import { AddAlert } from '@mui/icons-material'
import { Analytics } from '@mui/icons-material'
import { Settings } from '@mui/icons-material'
import '../styles/Sidebar.css'

const Sidebar = () => {
  return (
    <div>
      <div className="sidebar">
        <ul className='sidebar-items'>
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

        </ul>
      </div>
    </div>
  )
}

export default Sidebar
