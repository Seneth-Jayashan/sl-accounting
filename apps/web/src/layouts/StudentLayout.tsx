import { Outlet } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import SidebarStudent from "../components/sidebar/SidebarStudent";
import BottomNavStudent from "../components/bottomNavbar/BottomNavStudent";
import StudentRightSidebar from "../components/rightSidebar/StudentRightSidebar";

export default function StudentLayout() {
  return (
    <DashboardLayout 
      Sidebar={SidebarStudent} 
      BottomNav={BottomNavStudent}
      rightSidebar={<StudentRightSidebar />} // Passes the student specific sidebar
    >
      <Outlet />
    </DashboardLayout>
  );
}