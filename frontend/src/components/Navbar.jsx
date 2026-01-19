import "../styles/Dashboard.css"
import { useNavigate } from 'react-router-dom'
import { Logout } from '@mui/icons-material'
import { Menu } from '@mui/icons-material'
import { More } from '@mui/icons-material'
import { GraphicEq } from '@mui/icons-material'
import { supabase } from "../services/supabaseClient";



function Navbar() {
    const navigate = useNavigate()

    const handleLogout = async () => {
  await supabase.auth.signOut();
  navigate("/login");
};

    return (
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
    )
}

export default Navbar
