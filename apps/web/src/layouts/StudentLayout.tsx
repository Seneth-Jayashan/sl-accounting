import React, { useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  MapPin,
  Building,
  Loader2,
  Save,
  Package,
  Sparkles,
} from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import SidebarStudent from "../components/sidebar/SidebarStudent";
import BottomNavStudent from "../components/bottomNavbar/BottomNavStudent";
import StudentRightSidebar from "../components/rightSidebar/StudentRightSidebar";
import { useAuth } from "../contexts/AuthContext";
import UserService from "../services/UserService";
import SettingService from "../services/SettingService";
import ExamTimer from "../components/common/ExamTimer";

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
  const [examDate, setExamDate] = useState<string | null>(null);

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

    SettingService.getSettings()
      .then((res) => {
        if (res.success && res.data?.examDate) {
          setExamDate(res.data.examDate);
        }
      })
      .catch(console.error);
  }, [user, isAddressIncomplete]);

  const handleAddressChange = (key: keyof AddressFormState, value: string) => {
    setAddressForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitAddress = async (e: React.FormEvent) => {
    e.preventDefault();

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
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">
          <DashboardLayout
            Sidebar={SidebarStudent}
            BottomNav={BottomNavStudent}
            rightSidebar={<StudentRightSidebar />}
          >
            <ExamTimer examDate={examDate} />
            <Outlet />
          </DashboardLayout>
        </div>
      </div>

      {/* --- MANDATORY ADDRESS MODAL --- */}
      <AnimatePresence>
        {showAddressModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-xl bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden"
            >
              {/* Branded Header */}
              <div className="relative bg-gradient-to-r from-brand-prussian via-[#0d3a4b] to-brand-cerulean p-6 text-white overflow-hidden">
                <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-brand-jasmine/20 blur-2xl" />

                <div className="relative z-10 flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/15 backdrop-blur-md flex items-center justify-center shrink-0">
                    <MapPin size={21} className="text-brand-jasmine" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-extrabold text-brand-jasmine mb-1">
                      <Sparkles size={11} />
                      <span>Profile Required</span>
                    </div>
                    <h2 className="text-xl font-extrabold tracking-tight leading-tight">
                      Complete Your Delivery Address
                    </h2>
                    <p className="text-xs sm:text-sm text-white/75 mt-1">
                      Please add your address details before continuing to your
                      dashboard.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmitAddress} className="p-6 space-y-5">
                <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-brand-aliceBlue/50 border border-brand-cerulean/15 text-xs text-brand-prussian font-medium">
                  <Package
                    size={16}
                    className="text-brand-cerulean shrink-0"
                  />
                  <span>
                    We use this address to ship your printed monthly tutes and
                    study packs via courier or SL Post.
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={addressForm.street}
                      onChange={(e) =>
                        handleAddressChange("street", e.target.value)
                      }
                      placeholder="e.g. 123 Main Street"
                      required
                      className="w-full bg-gray-50 border border-gray-200/90 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={addressForm.city}
                      onChange={(e) =>
                        handleAddressChange("city", e.target.value)
                      }
                      placeholder="e.g. Galle"
                      required
                      className="w-full bg-gray-50 border border-gray-200/90 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                      Province <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={addressForm.state}
                      onChange={(e) =>
                        handleAddressChange("state", e.target.value)
                      }
                      placeholder="e.g. Southern Province"
                      required
                      className="w-full bg-gray-50 border border-gray-200/90 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                      Postal Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={addressForm.zipCode}
                      onChange={(e) =>
                        handleAddressChange("zipCode", e.target.value)
                      }
                      placeholder="e.g. 80000"
                      required
                      className="w-full bg-gray-50 border border-gray-200/90 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                      Nearest Post Office <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                      <input
                        value={addressForm.nearestPostOffice}
                        onChange={(e) =>
                          handleAddressChange(
                            "nearestPostOffice",
                            e.target.value
                          )
                        }
                        placeholder="e.g. Galle 05 Post Office"
                        required
                        className="w-full bg-gray-50 border border-gray-200/90 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-gray-800 outline-none focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingAddress}
                  className="w-full bg-brand-prussian hover:bg-brand-cerulean text-white rounded-2xl py-3.5 text-sm font-extrabold transition-all shadow-lg shadow-brand-prussian/20 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {savingAddress ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      <span>Saving Address...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save & Continue</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}