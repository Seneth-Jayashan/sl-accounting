import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import DashboardLayout from "./DashboardLayout"; 
import SidebarAdmin from "../components/sidebar/SidebarAdmin";
import BottomNavAdmin from "../components/bottomNavbar/BottomNavAdmin";
import AdminRightSidebar from "../components/rightSidebar/AdminRightSidebar"; 
import { BellAlertIcon, XMarkIcon } from "@heroicons/react/24/outline";

const ADMIN_UPDATE_BANNER_UNTIL_KEY = "admin-update-popup-until";
const ADMIN_UPDATE_BANNER_DISMISSED_KEY = "admin-update-popup-dismissed";
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export default function AdminLayout() {
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(ADMIN_UPDATE_BANNER_DISMISSED_KEY) === "true";
    const now = Date.now();

    const storedUntil = localStorage.getItem(ADMIN_UPDATE_BANNER_UNTIL_KEY);
    const activeUntil = storedUntil ? Number(storedUntil) : now + TWENTY_FOUR_HOURS_MS;

    if (!storedUntil) {
      localStorage.setItem(ADMIN_UPDATE_BANNER_UNTIL_KEY, String(activeUntil));
    }

    if (!dismissed && now < activeUntil) {
      setShowUpdatePopup(true);
    }
  }, []);

  const handleClosePopup = () => {
    localStorage.setItem(ADMIN_UPDATE_BANNER_DISMISSED_KEY, "true");
    setShowUpdatePopup(false);
  };

  return (
    <>
      <DashboardLayout 
        Sidebar={SidebarAdmin} 
        BottomNav={BottomNavAdmin}
        rightSidebar={<AdminRightSidebar />} // Passes the admin specific sidebar
      >
        <Outlet />
      </DashboardLayout>

      {showUpdatePopup && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-brand-prussian/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-brand-aliceBlue shadow-2xl overflow-hidden">
            <div className="px-5 py-4 bg-brand-aliceBlue/30 border-b border-brand-aliceBlue flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellAlertIcon className="w-5 h-5 text-brand-cerulean" />
                <h3 className="text-sm font-bold text-brand-prussian uppercase tracking-widest">Admin Update Notice</h3>
              </div>
              <button
                type="button"
                onClick={handleClosePopup}
                className="p-1 rounded-full hover:bg-white/80 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close update notice"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-5 space-y-3">
              <p className="text-sm text-brand-prussian font-semibold">Updated Functions</p>
              <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
                <li>Tute Delivery PDF</li>
                <li>Student Account Lock</li>
                <li>Recording Management</li>
                <li>Recording Speed Change</li>
              </ul>
              <p className="text-xs text-gray-500">This notice is shown on admin side only and expires automatically after 24 hours.</p>
            </div>

            <div className="px-5 pb-5">
              <button
                type="button"
                onClick={handleClosePopup}
                className="w-full py-2.5 rounded-xl bg-brand-cerulean text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-prussian transition-colors"
              >
                Okay, Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}