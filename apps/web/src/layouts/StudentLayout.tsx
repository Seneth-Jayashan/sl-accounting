import { useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "./DashboardLayout";
import SidebarStudent from "../components/sidebar/SidebarStudent";
import BottomNavStudent from "../components/bottomNavbar/BottomNavStudent";
import StudentRightSidebar from "../components/rightSidebar/StudentRightSidebar";
import { useAuth } from "../contexts/AuthContext";
import UserService from "../services/UserService";

interface AddressFormState {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  nearestPostOffice: string;
}

export default function StudentLayout() {
  const { user, fetchMe } = useAuth();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressFormState>({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    nearestPostOffice: "",
  });

  const isAddressIncomplete = useMemo(() => {
    if (!user || user.role !== "student") return false;
    const address = (user as any).address || {};
    return !(
      String(address.street || "").trim() &&
      String(address.city || "").trim() &&
      String(address.state || "").trim() &&
      String(address.zipCode || "").trim() &&
      String(address.nearestPostOffice || "").trim()
    );
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== "student") return;

    const address = (user as any).address || {};
    setAddressForm({
      street: String(address.street || ""),
      city: String(address.city || ""),
      state: String(address.state || ""),
      zipCode: String(address.zipCode || ""),
      nearestPostOffice: String(address.nearestPostOffice || ""),
    });

    setShowAddressModal(isAddressIncomplete);
  }, [user, isAddressIncomplete]);

  const handleAddressChange = (key: keyof AddressFormState, value: string) => {
    setAddressForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitAddress = async () => {
    const street = addressForm.street.trim();
    const city = addressForm.city.trim();
    const state = addressForm.state.trim();
    const zipCode = addressForm.zipCode.trim();
    const nearestPostOffice = addressForm.nearestPostOffice.trim();

    if (!street || !city || !state || !zipCode || !nearestPostOffice) {
      toast.error("Please complete all address fields.");
      return;
    }

    setSavingAddress(true);
    try {
      await UserService.updateUserProfile({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        phoneNumber: user?.phoneNumber || "",
        address: { street, city, state, zipCode, nearestPostOffice },
      });

      await fetchMe();
      setShowAddressModal(false);
      toast.success("Address updated successfully.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update address.");
    } finally {
      setSavingAddress(false);
    }
  };

  return (
    <>
      <DashboardLayout 
        Sidebar={SidebarStudent} 
        BottomNav={BottomNavStudent}
        rightSidebar={<StudentRightSidebar />} // Passes the student specific sidebar
      >
        <Outlet />
      </DashboardLayout>

      {showAddressModal && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl border border-gray-100 shadow-2xl p-6 space-y-5">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-black text-brand-cerulean">Profile Required</p>
              <h2 className="text-xl font-bold text-brand-prussian mt-1">Update Your Address</h2>
              <p className="text-sm text-gray-500 mt-1">
                Please complete your address details before continuing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={addressForm.street}
                onChange={(e) => handleAddressChange("street", e.target.value)}
                placeholder="Street Address"
                className="md:col-span-2 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cerulean/20"
              />
              <input
                value={addressForm.city}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                placeholder="City"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cerulean/20"
              />
              <input
                value={addressForm.state}
                onChange={(e) => handleAddressChange("state", e.target.value)}
                placeholder="State / Province"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cerulean/20"
              />
              <input
                value={addressForm.zipCode}
                onChange={(e) => handleAddressChange("zipCode", e.target.value)}
                placeholder="Zip / Postal Code"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cerulean/20"
              />
              <input
                value={addressForm.nearestPostOffice}
                onChange={(e) => handleAddressChange("nearestPostOffice", e.target.value)}
                placeholder="Nearest Post Office"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cerulean/20"
              />
            </div>

            <button
              onClick={handleSubmitAddress}
              disabled={savingAddress}
              className="w-full bg-brand-prussian text-white rounded-xl py-2.5 text-sm font-bold hover:bg-brand-cerulean transition-colors disabled:opacity-60"
            >
              {savingAddress ? "Saving..." : "Save Address"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}