// src/pages/admin/Dashboard.tsx
import DashboardLayout from "../../layouts/DashboardLayout";
import SidebarAdmin from "../../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../../components/bottomNavbar/BottomNavAdmin"; // Updated import path



// --- Main Page Component ---

export default function SupportReply() {


  return (
    <DashboardLayout Sidebar={SidebarAdmin} BottomNav={BottomNavAdmin}>
        <div className="space-y-6"> hi</div>
    </DashboardLayout>
  );
}