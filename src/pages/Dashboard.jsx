import "../styles/Dashboard.css"
import Sidebar from '../components/Sidebar'
import Statscards from '../components/Statscards'
import Alertlog from './Alertlog'

const Dashboard = () => {
  return (
    <div className="main-content">
  <h1 className="page-title">Dashboard</h1>
  <p className="page-subtitle">
    Real-time forest monitoring overview
  </p>

  <Statscards />
</div>

  )
}

export default Dashboard
