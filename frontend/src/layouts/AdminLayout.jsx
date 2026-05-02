import { useEffect, useRef } from "react";
import { useLocation, Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminRoute from "../components/AdminRoute";

const AdminLayout = () => {
  const location = useLocation();
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <AdminRoute>
      <Navbar />
      <AdminSidebar />
      <div ref={contentRef} className="layout-content">
        <Outlet />
      </div>
    </AdminRoute>
  );
};

export default AdminLayout;
