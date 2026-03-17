import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TuteDeliveryService, { type TuteDeliveryData } from "../../../services/TuteDeliveryService";
import { jsPDF } from "jspdf";
import { useAuth } from "../../../contexts/AuthContext";

import {
  TruckIcon,
  MapPinIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  BuildingLibraryIcon,
  QrCodeIcon,
  FunnelIcon,
  ClipboardDocumentCheckIcon,
  CheckBadgeIcon,
  DocumentArrowDownIcon
} from "@heroicons/react/24/outline";

const SINHALA_FONT_URL = "https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSansSinhala/NotoSansSinhala-Regular.ttf";
const SINHALA_FONT_VFS_NAME = "NotoSansSinhala-Regular.ttf";
const SINHALA_FONT_FAMILY = "NotoSansSinhala";

let isSinhalaFontRegistered = false;

const containsSinhalaChars = (value: string) => /[\u0D80-\u0DFF]/.test(value);

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
};

const ensureSinhalaFont = async (doc: jsPDF) => {
  if (isSinhalaFontRegistered) {
    return true;
  }

  const response = await fetch(SINHALA_FONT_URL);
  if (!response.ok) {
    return false;
  }

  const fontBuffer = await response.arrayBuffer();
  const fontBase64 = arrayBufferToBase64(fontBuffer);

  doc.addFileToVFS(SINHALA_FONT_VFS_NAME, fontBase64);
  doc.addFont(SINHALA_FONT_VFS_NAME, SINHALA_FONT_FAMILY, "normal");
  isSinhalaFontRegistered = true;
  return true;
};

// --- TYPES ---
type FilterType = "all_time" | "today" | "this_week" | "last_week" | "this_month" | "last_month" | "custom";
type TabType = "pending" | "shipped" | "delivered";

interface DispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string, tracking: string, courier: string) => Promise<void>;
  delivery: TuteDeliveryData | null;
}

const formatAddressForDisplay = (rawAddress: any) => {
  let nearestPostOffice = "";
  let cleanAddress = "";

  if (typeof rawAddress === "string") {
    try {
      const parsed = JSON.parse(rawAddress);
      cleanAddress = [parsed.street, parsed.city, parsed.state, parsed.zipCode].filter(Boolean).join(", ");
      nearestPostOffice = parsed.nearestPostOffice || "";
    } catch {
      let tempStr = rawAddress;
      const npoMatch = tempStr.match(/nearestPostOffice:\s*['"]?([^'",\n}]+)['"]?/);
      if (npoMatch) nearestPostOffice = npoMatch[1].trim();

      if (tempStr.includes("{")) {
        tempStr = tempStr.replace(/[{}]/g, "");
        tempStr = tempStr.replace(/(street|city|state|zipCode|nearestPostOffice)\s*:/g, "");
        tempStr = tempStr.replace(/['"\n]/g, "");
        cleanAddress = tempStr.split(",").map((s: string) => s.trim()).filter(Boolean).join(", ");
      } else {
        cleanAddress = tempStr.trim();
      }
    }
  } else if (typeof rawAddress === "object" && rawAddress !== null) {
    cleanAddress = [rawAddress.street, rawAddress.city, rawAddress.state, rawAddress.zipCode].filter(Boolean).join(", ");
    nearestPostOffice = rawAddress.nearestPostOffice || "";
  }

  const addressWithNearest = nearestPostOffice
    ? `${cleanAddress || "Address not provided"} | Nearest PO: ${nearestPostOffice}`
    : (cleanAddress || "Address not provided");

  return { address: cleanAddress, nearestPostOffice, addressWithNearest };
};

export default function TuteDeliveryPage() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<TuteDeliveryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<TuteDeliveryData | null>(null);

  // PDF Sender Details
  const [teacherName, setTeacherName] = useState("");
  const [teacherAddress, setTeacherAddress] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [showSenderConfig, setShowSenderConfig] = useState(false);
  
  // Filters
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [filterType, setFilterType] = useState<FilterType>("all_time");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Fetch Data
  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { 
          status: activeTab,
          filterType: filterType 
      };
      
      if (filterType === "custom" && customStart && customEnd) {
          params.startDate = customStart;
          params.endDate = customEnd;
      }

      const data = await TuteDeliveryService.getAllDeliveries(params);
      setDeliveries(data);
    } catch (error) {
      console.error("Delivery sync failed:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filterType, customStart, customEnd]);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  useEffect(() => {
    // Default Details matching the reference image
    setTeacherName(`Kalum Waduge`);
    setTeacherAddress(`Kurusagoda, Gonapinuwala`);
    setTeacherPhone(`076 8826142, 071 6832911`);
  }, [user]);

  // --- ROBUST ADDRESS CLEANER ---
  const getAddressParts = (delivery: TuteDeliveryData) => {
    const studentAny: any = delivery.student || {};
    return formatAddressForDisplay(studentAny.address || "");
  };

  const handleGeneratePdf = async () => {
    if (!deliveries.length) {
      window.alert("No delivery records available for PDF export.");
      return;
    }

    if (!teacherName.trim() || !teacherAddress.trim() || !teacherPhone.trim()) {
      window.alert("Please complete sender (teacher) details before generating PDF.");
      return;
    }

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Layout Configuration
    const margin = 15;
    const midPoint = pageWidth / 2;
    const rowHeight = 56;
    const lineSpacing = 5.8;

    let y = margin;

    const requiresSinhalaFont = deliveries.some((delivery) => {
      const studentName = `${delivery.student?.firstName || ""} ${delivery.student?.lastName || ""}`.trim();
      const studentAddress = getAddressParts(delivery).address || "";
      return containsSinhalaChars(studentName) || containsSinhalaChars(studentAddress);
    });

    let useSinhalaFont = false;
    if (requiresSinhalaFont) {
      try {
        useSinhalaFont = await ensureSinhalaFont(doc);
      } catch (error) {
        console.error("Failed to load Sinhala font for PDF:", error);
      }
    }

    doc.setFont(useSinhalaFont ? SINHALA_FONT_FAMILY : "times", "normal");

    deliveries.forEach((delivery) => {
      // Create new page if row exceeds bounds
      if (y + rowHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      const leftX = margin + 5;
      const rightX = midPoint + 5;
      const bottomY = y + rowHeight;
      const maxColWidth = midPoint - margin - 10;
      
      doc.setFontSize(13);
      
      // ==========================================
      // LEFT COLUMN: SENDER DETAILS
      // ==========================================
      let currentLeftY = y + 8;
      
      // Sender Name
      doc.text(teacherName, leftX, currentLeftY);
      currentLeftY += lineSpacing;
      
      // Sender Address
      const teacherAddrLines = teacherAddress.split(',').map(s => s.trim()).filter(Boolean);
      teacherAddrLines.forEach((line, i) => {
         doc.text(line + (i < teacherAddrLines.length - 1 ? "," : ""), leftX, currentLeftY);
         currentLeftY += lineSpacing;
      });
      
      currentLeftY += 2; // Spacer

      // Sender Phones
      const teacherPhones = teacherPhone.split(',').map(s => s.trim()).filter(Boolean);
      teacherPhones.forEach(phone => {
         doc.text(phone, leftX, currentLeftY);
         currentLeftY += lineSpacing - 1; 
      });

      // ==========================================
      // RIGHT COLUMN: RECIPIENT DETAILS
      // ==========================================
      let currentRightY = y + 8;
      const studentName = `${delivery.student?.firstName || ""} ${delivery.student?.lastName || ""}`.trim();
      
      // 1. Recipient Name
      doc.text(studentName || "N/A", rightX, currentRightY);
      currentRightY += lineSpacing;

      // 2. Cleaned Address (max 3 lines on right side)
      const { address, nearestPostOffice } = getAddressParts(delivery);
      const studentAddrLines = doc.splitTextToSize(address || "Address not provided", maxColWidth).slice(0, 3);
      
      if (studentAddrLines.length > 0) {
        studentAddrLines.forEach((line: string) => {
          doc.text(line, rightX, currentRightY);
          currentRightY += lineSpacing;
        });
      } else {
         doc.text("Address not provided", rightX, currentRightY);
         currentRightY += lineSpacing;
      }

      currentRightY += 1.5; // compact spacer

      // 3. Nearest Post Office
      if (nearestPostOffice) {
         doc.text(`Nearest Post Office: ${nearestPostOffice}`, rightX, currentRightY);
         currentRightY += lineSpacing;
      }

      // 4. Phone Number (Bottom Left of Right Column)
      const studentPhone = delivery.student?.phoneNumber || "-";
      doc.text(studentPhone, rightX, bottomY - 20);
      
      // 5. Class Name - Month (Bottom Right of Right Column)
      const tagText = `${delivery.class?.name || ""} - ${delivery.targetMonth || ""}`.trim();
      doc.setFontSize(10);
      doc.setFont(useSinhalaFont ? SINHALA_FONT_FAMILY : "times", useSinhalaFont ? "normal" : "bold");
      doc.text(tagText, pageWidth - margin, bottomY - 10, { align: "right" });
      
      // Reset font back to normal for next loop
      doc.setFont(useSinhalaFont ? SINHALA_FONT_FAMILY : "times", "normal");

      // ==========================================
      // HORIZONTAL SEPARATOR LINE
      // ==========================================
      doc.setDrawColor(50, 50, 50); 
      doc.setLineWidth(0.3);
      doc.line(margin, bottomY - 8, pageWidth - margin, bottomY - 8);

      y += rowHeight;
    });

    const monthTag = new Date().toISOString().slice(0, 7);
    doc.save(`tute-labels-${activeTab}-${monthTag}.pdf`);
  };

  const handleDispatch = async (id: string, tracking: string, courier: string) => {
    try {
      await TuteDeliveryService.markAsSent(id, { trackingId: tracking, courierService: courier });
      fetchDeliveries();
      setSelectedDelivery(null);
    } catch (error) {
      alert("Failed to update status. Please try again.");
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 pb-24 animate-in fade-in duration-500 font-sans">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-brand-prussian tracking-tight">Tute Dispatch</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">Manage physical material shipments</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSenderConfig((prev) => !prev)}
            className="px-4 py-2 rounded-xl border border-brand-aliceBlue text-brand-prussian text-xs font-bold uppercase tracking-widest hover:bg-brand-aliceBlue/30 transition-colors"
          >
            Sender Details
          </button>
          <button
            onClick={handleGeneratePdf}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-prussian text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-cerulean transition-colors"
          >
            <DocumentArrowDownIcon className="w-4 h-4" /> Export Labels PDF
          </button>
        </div>
      </div>

      {showSenderConfig && (
        <div className="bg-white border border-brand-aliceBlue rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3 shadow-sm">
          <input
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            placeholder="Teacher Name"
            className="w-full px-3 py-2.5 bg-brand-aliceBlue/20 border border-brand-aliceBlue rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-cerulean/20"
          />
          <input
            value={teacherAddress}
            onChange={(e) => setTeacherAddress(e.target.value)}
            placeholder="Teacher Address (Comma Separated for lines)"
            className="w-full px-3 py-2.5 bg-brand-aliceBlue/20 border border-brand-aliceBlue rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-cerulean/20"
          />
          <input
            value={teacherPhone}
            onChange={(e) => setTeacherPhone(e.target.value)}
            placeholder="Phones (Comma Separated)"
            className="w-full px-3 py-2.5 bg-brand-aliceBlue/20 border border-brand-aliceBlue rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-cerulean/20"
          />
        </div>
      )}

      {/* --- CONTROLS BAR --- */}
      <div className="flex flex-col xl:flex-row gap-4">
          <div className="bg-brand-aliceBlue p-1 rounded-xl flex shrink-0 overflow-x-auto">
              <button 
                  onClick={() => setActiveTab("pending")}
                  className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                      activeTab === "pending" ? "bg-white text-brand-cerulean shadow-sm" : "text-gray-400 hover:text-brand-prussian"
                  }`}
              >
                  Pending
              </button>
              <button 
                  onClick={() => setActiveTab("shipped")}
                  className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                      activeTab === "shipped" ? "bg-white text-brand-cerulean shadow-sm" : "text-gray-400 hover:text-brand-prussian"
                  }`}
              >
                  Sent History
              </button>
              <button 
                  onClick={() => setActiveTab("delivered")}
                  className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                      activeTab === "delivered" ? "bg-white text-brand-cerulean shadow-sm" : "text-gray-400 hover:text-brand-prussian"
                  }`}
              >
                  Delivered
              </button>
          </div>

          {/* DATE FILTERS */}
          <div className="flex flex-col md:flex-row gap-3 bg-white p-2 rounded-2xl shadow-sm border border-brand-aliceBlue flex-1">
             <div className="relative flex-1 md:max-w-xs">
                <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <select
                  className="w-full pl-10 pr-8 py-2 bg-brand-aliceBlue/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 appearance-none cursor-pointer text-xs font-bold text-gray-600 border-none uppercase tracking-wide"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                >
                  <option value="all_time">All Time</option>
                  <option value="today">Today</option>
                  <option value="this_week">This Week</option>
                  <option value="last_week">Last Week</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {filterType === "custom" && (
                <div className="flex gap-2 flex-1 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="relative flex-1">
                    <input
                      type="date"
                      className="w-full pl-3 pr-3 py-2 bg-brand-aliceBlue/30 rounded-xl focus:outline-none text-xs font-medium text-gray-600"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                    />
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="date"
                      className="w-full pl-3 pr-3 py-2 bg-brand-aliceBlue/30 rounded-xl focus:outline-none text-xs font-medium text-gray-600"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={fetchDeliveries}
                className="p-2 bg-brand-aliceBlue/50 hover:bg-brand-aliceBlue rounded-xl text-brand-cerulean transition-colors"
                title="Refresh List"
              >
                <ArrowPathIcon className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
              </button>
          </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="bg-transparent sm:bg-white sm:border border-brand-aliceBlue rounded-2xl sm:overflow-hidden sm:shadow-sm min-h-[400px]">
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-3 text-gray-400">
            <TruckIcon className="w-10 h-10 animate-bounce text-brand-cerulean/50" />
            <p className="text-xs font-bold uppercase tracking-[0.2em]">Loading Shipments...</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-brand-aliceBlue/30 text-[10px] uppercase text-brand-prussian/40 font-bold tracking-widest border-b border-brand-aliceBlue">
                  <tr>
                    <th className="px-6 py-4">Student & Class</th>
                    <th className="px-6 py-4">Shipping Address</th>
                    <th className="px-6 py-4">Target Month</th>
                    {activeTab !== "pending" && <th className="px-6 py-4">Dispatch Info</th>}
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-aliceBlue/30">
                  <AnimatePresence mode="popLayout">
                    {deliveries.map((delivery) => (
                      <DeliveryRow 
                        key={delivery._id} 
                        delivery={delivery} 
                        currentTab={activeTab}
                        onDispatch={() => setSelectedDelivery(delivery)} 
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            <div className="sm:hidden space-y-4">
                <AnimatePresence mode="popLayout">
                    {deliveries.map((delivery) => (
                        <MobileDeliveryCard 
                            key={delivery._id}
                            delivery={delivery}
                            currentTab={activeTab}
                            onDispatch={() => setSelectedDelivery(delivery)}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {deliveries.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-center text-gray-400">
                 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <ArchiveBoxIcon className="w-8 h-8 text-gray-300" />
                 </div>
                 <p className="text-xs font-bold uppercase tracking-widest">No records found</p>
                 <p className="text-[10px] mt-1">Try adjusting your filters.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* --- DISPATCH MODAL --- */}
      <DispatchModal 
        isOpen={!!selectedDelivery}
        onClose={() => setSelectedDelivery(null)}
        delivery={selectedDelivery}
        onConfirm={handleDispatch}
      />
    </div>
  );
}

// --- SUB COMPONENTS ---

function DeliveryRow({ delivery, currentTab, onDispatch }: { delivery: TuteDeliveryData; currentTab: TabType; onDispatch: () => void }) {
  const { addressWithNearest } = formatAddressForDisplay(delivery.student?.address);
  const isHistory = currentTab !== "pending"; 
  
  return (
    <motion.tr 
        layout 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="group hover:bg-brand-aliceBlue/10 transition-colors"
    >
      <td className="px-6 py-5">
        <div className="text-sm font-semibold text-brand-prussian leading-none">
          {delivery.student?.firstName} {delivery.student?.lastName}
        </div>
        <div className="text-[10px] font-bold text-brand-cerulean uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
          <BuildingLibraryIcon className="w-3 h-3 opacity-50" /> {delivery.class?.name}
        </div>
        <div className="text-[10px] text-gray-400 mt-1">{delivery.student?.phoneNumber}</div>
      </td>

      <td className="px-6 py-5">
        <div className="flex items-start gap-2 max-w-xs">
            <MapPinIcon className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              {addressWithNearest}
            </p>
        </div>
      </td>

      <td className="px-6 py-5">
         <span className="bg-brand-aliceBlue/50 text-brand-prussian border border-brand-aliceBlue px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest">
            {delivery.targetMonth}
         </span>
      </td>

      {isHistory && (
          <td className="px-6 py-5">
              <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                      <TruckIcon className="w-3.5 h-3.5 text-brand-cerulean" />
                      {delivery.courierService}
                  </div>
                  {delivery.trackingId && (
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded w-fit">
                          <QrCodeIcon className="w-3 h-3" />
                          {delivery.trackingId}
                      </div>
                  )}
                  <div className="text-[9px] text-gray-400 mt-0.5">
                      {new Date(delivery.sentAt!).toLocaleDateString()}
                  </div>
              </div>
          </td>
      )}

      <td className="px-6 py-5 text-right">
        {currentTab === 'pending' && (
            <button 
                onClick={onDispatch}
                className="inline-flex items-center gap-2 bg-brand-cerulean hover:bg-brand-prussian text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm shadow-brand-cerulean/20 active:scale-95"
            >
                <PaperAirplaneIcon className="w-3 h-3" /> Dispatch
            </button>
        )}

        {currentTab === 'shipped' && (
             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border bg-blue-50 text-blue-600 border-blue-100">
                <TruckIcon className="w-3 h-3" /> In Transit
             </span>
        )}

        {currentTab === 'delivered' && (
             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-100">
                <CheckBadgeIcon className="w-3 h-3" /> Received
             </span>
        )}
      </td>
    </motion.tr>
  );
}

function MobileDeliveryCard({ delivery, currentTab, onDispatch }: { delivery: TuteDeliveryData; currentTab: TabType; onDispatch: () => void }) {
  const { addressWithNearest } = formatAddressForDisplay(delivery.student?.address);
    const isHistory = currentTab !== "pending";

    return (
        <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white p-5 rounded-2xl shadow-sm border border-brand-aliceBlue">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-sm font-bold text-brand-prussian">{delivery.student?.firstName} {delivery.student?.lastName}</h3>
                    <p className="text-xs text-brand-cerulean font-bold mt-0.5">{delivery.class?.name}</p>
                </div>
                <span className="bg-brand-aliceBlue/50 text-brand-prussian px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border border-brand-aliceBlue">
                    {delivery.targetMonth}
                </span>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4">
                <div className="flex items-start gap-2">
                    <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">
                      {addressWithNearest}
                    </p>
                </div>
            </div>

            {isHistory ? (
                <div className="border-t border-dashed border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                             <TruckIcon className="w-4 h-4 text-brand-cerulean" />
                             <span className="text-xs font-bold text-gray-700">{delivery.courierService}</span>
                        </div>
                        {delivery.trackingId && (
                            <span className="text-[10px] font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                                {delivery.trackingId}
                            </span>
                        )}
                    </div>
                    <div className="flex justify-between items-end mt-2">
                        <div className="text-[10px] text-gray-400">
                            Sent on {new Date(delivery.sentAt!).toLocaleDateString()}
                        </div>
                        {currentTab === 'delivered' && (
                             <span className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                                <CheckBadgeIcon className="w-3 h-3" /> Received by Student
                             </span>
                        )}
                    </div>
                </div>
            ) : (
                <button 
                    onClick={onDispatch}
                    className="w-full flex items-center justify-center gap-2 bg-brand-cerulean text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md shadow-brand-cerulean/10 active:scale-95 transition-transform"
                >
                    <PaperAirplaneIcon className="w-4 h-4" /> Mark as Sent
                </button>
            )}
        </motion.div>
    );
}

function DispatchModal({ isOpen, onClose, onConfirm, delivery }: DispatchModalProps) {
    const [tracking, setTracking] = useState("");
    const [courier, setCourier] = useState("SL Post");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!delivery) return;
        
        setIsSubmitting(true);
        await onConfirm(delivery._id, tracking, courier);
        setIsSubmitting(false);
        setTracking(""); 
        setCourier("SL Post"); 
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-prussian/60 backdrop-blur-sm p-4"
                >
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="bg-brand-aliceBlue/30 px-6 py-4 border-b border-brand-aliceBlue flex justify-between items-center">
                            <h3 className="text-sm font-bold text-brand-prussian uppercase tracking-widest">Confirm Dispatch</h3>
                            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-4">
                                <p className="text-xs text-blue-800 font-medium">
                                    You are marking <strong>{delivery?.student?.firstName}'s</strong> tute for <strong>{delivery?.targetMonth}</strong> as sent.
                                </p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block ml-1">Courier Service</label>
                                <div className="relative">
                                    <TruckIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <select 
                                        value={courier}
                                        onChange={(e) => setCourier(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-brand-aliceBlue/20 border border-brand-aliceBlue rounded-xl text-sm font-semibold text-brand-prussian focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all appearance-none"
                                    >
                                        <option value="SL Post">SL Post</option>
                                        <option value="Domex">Domex</option>
                                        <option value="Prompt Xpress">Prompt Xpress</option>
                                        <option value="PickMe Flash">PickMe Flash</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block ml-1">Tracking Number <span className="text-gray-300 font-normal normal-case">(Optional)</span></label>
                                <div className="relative">
                                    <QrCodeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input 
                                        type="text" 
                                        placeholder="e.g. 883920011"
                                        value={tracking}
                                        onChange={(e) => setTracking(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-brand-aliceBlue/20 border border-brand-aliceBlue rounded-xl text-sm font-medium text-brand-prussian focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all placeholder:text-gray-300"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-brand-aliceBlue text-gray-500 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 rounded-xl bg-brand-cerulean text-white font-bold text-xs uppercase tracking-widest hover:bg-brand-prussian transition-colors shadow-lg shadow-brand-cerulean/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {isSubmitting ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ClipboardDocumentCheckIcon className="w-4 h-4" />}
                                    Confirm
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}