import { Routes, Route } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Dashboard from './pages/Dashboard'
import Alertlog from './pages/Alertlog'
import DashboardLayout from './layouts/DashboardLayout'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route element={<DashboardLayout />} >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/alerts" element={<Alertlog />} />
      </Route>
    </Routes>
  );
}

export default App;
