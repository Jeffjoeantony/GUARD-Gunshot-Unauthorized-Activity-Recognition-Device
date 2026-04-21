import { useEffect, useRef } from "react";
import { useLocation, Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

/**
 * DashboardLayout
 *
 * Navbar  → position:fixed, height 70px, top 0
 * Sidebar → position:fixed, width 240px, left 0, top 70px
 *
 * .layout-content is a position:fixed div that occupies the remaining
 * viewport area (right of sidebar, below navbar) and provides its own
 * overflow-y:auto scroll — this is the standard approach for dashboards
 * with fixed nav/sidebar. Scroll resets to top on every route change.
 */
const DashboardLayout = () => {
  const location = useLocation();
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <>
      <Navbar />
      <Sidebar />
      <div ref={contentRef} className="layout-content">
        <Outlet />
      </div>
    </>
  );
};

export default DashboardLayout;