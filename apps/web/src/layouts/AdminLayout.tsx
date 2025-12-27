import { Outlet } from "react-router-dom";
import DashboardLayout from "./DashboardLayout"; // Your existing layout file
import SidebarAdmin from "../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../components/bottomNavbar/BottomNavAdmin";

export default function AdminLayout() {
  return (
    <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}>
      <Outlet />
    </DashboardLayout>
  );
}