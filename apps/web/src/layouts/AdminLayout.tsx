import { Outlet } from "react-router-dom";
import DashboardLayout from "./DashboardLayout"; 
import SidebarAdmin from "../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../components/bottomNavbar/BottomNavAdmin";
import AdminRightSidebar from "../components/rightSidebar/AdminRightSidebar"; 

export default function AdminLayout() {
  return (
    <DashboardLayout 
      Sidebar={SidebarAdmin} 
      BottomNav={BottomNavAdmin}
      rightSidebar={<AdminRightSidebar />} // Passes the admin specific sidebar
    >
      <Outlet />
    </DashboardLayout>
  );
}