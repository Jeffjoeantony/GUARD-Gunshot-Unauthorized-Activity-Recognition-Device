import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <div className="h-screen flex flex-col">

      {/* Navbar */}
      <Navbar />

      {/* Sidebar + Content */}
      <div className="flex flex-1">

        {/* Sidebar */}
        <aside className="hidden md:block w-64 shrink-0">
          <Sidebar />
        </aside>

        {/* Main */}
        <main className="flex-1 h-full overflow-auto">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default DashboardLayout;