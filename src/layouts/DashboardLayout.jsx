import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <>
      <Navbar />
      <div className="flex">
  {/* Sidebar (desktop only) */}
  <aside className="hidden md:block w-64 shrink-0">
    <Sidebar />
  </aside>

  {/* Main content */}
  <main className="flex-1 overflow-x-hidden">
    <Outlet />
  </main>
</div>

    </>
  );
};

export default DashboardLayout;
