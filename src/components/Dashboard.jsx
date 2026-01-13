import React, {useState} from 'react'
import "../styles/Dashboard.css"
import { Logout } from '@mui/icons-material'
import { Menu } from '@mui/icons-material'
import { More } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { GraphicEq } from '@mui/icons-material'
import Sidebar from './Sidebar'
import Statscards from './Statscards'
import Alertlog from './Alertlog'

const Dashboard = () => {

  const navigate = useNavigate();

  return (  
    <div>
      <nav className='navbar'>
        <div className="nav-left">
          <div className="sidebar-icon" onClick={() => navigate('/dashboard')}><Menu/></div>
          <div className="new-logo"><GraphicEq/></div>
          <span className='logo-text'>GUARD</span>
        </div>

        <ul className='nav-center'>
          <li className='nav-items'>Dashboard</li>
          <li>Map</li>
          <li>Alerts</li>
          <li>Settings</li>
        </ul>

        <div className="nav-right">
          <More className='nav-icon'/>
          <Logout className='nav-icon' onClick={() => navigate('/')}/>
        </div>
      </nav>
      <Sidebar/>
      <div className="main-content">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          Real-time forest monitoring overview
        </p>
        <Statscards />
      </div>

    </div>
  )
}

export default Dashboard
