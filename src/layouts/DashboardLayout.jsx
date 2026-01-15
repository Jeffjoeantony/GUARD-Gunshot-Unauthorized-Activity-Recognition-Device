import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <>
      <Navbar />
      <div className="layout">
        <Sidebar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default DashboardLayout;
