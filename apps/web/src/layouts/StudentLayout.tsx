import { Outlet } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import SidebarStudent from "../components/sidebar/SidebarStudent";
import BottomNavStudent from "../components/bottomNavbar/BottomNavStudent";

export default function StudentLayout() {
  return (
    <DashboardLayout Sidebar={SidebarStudent} BottomNav={BottomNavStudent}>
      <Outlet />
    </DashboardLayout>
  );
}