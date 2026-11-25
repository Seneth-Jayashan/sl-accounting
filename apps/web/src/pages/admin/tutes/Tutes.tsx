import React, { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TuteDeliveryService, {
  type TuteDeliveryData,
} from "../../../services/TuteDeliveryService";
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  BorderStyle,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";
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
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

// --- TYPES ---
type FilterType =
  | "all_time"
  | "today"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "custom";
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
      cleanAddress = [parsed.street, parsed.city, parsed.state, parsed.zipCode]
        .filter(Boolean)
        .join(", ");
      nearestPostOffice = parsed.nearestPostOffice || "";
    } catch {
      let tempStr = rawAddress;
      const npoMatch = tempStr.match(
        /nearestPostOffice:\s*['"]?([^'",\n}]+)['"]?/
      );
      if (npoMatch) nearestPostOffice = npoMatch[1].trim();

      if (tempStr.includes("{")) {
        tempStr = tempStr.replace(/[{}]/g, "");
        tempStr = tempStr.replace(
          /(street|city|state|zipCode|nearestPostOffice)\s*:/g,
          ""
        );
        tempStr = tempStr.replace(/['"\n]/g, "");
        cleanAddress = tempStr
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
          .join(", ");
      } else {
        cleanAddress = tempStr.trim();
      }
    }
  } else if (typeof rawAddress === "object" && rawAddress !== null) {
    cleanAddress = [
      rawAddress.street,
      rawAddress.city,
      rawAddress.state,
      rawAddress.zipCode,
    ]
      .filter(Boolean)
      .join(", ");
    nearestPostOffice = rawAddress.nearestPostOffice || "";
  }

  const addressWithNearest = nearestPostOffice
    ? `${cleanAddress || "Address not provided"} | Nearest PO: ${nearestPostOffice}`
    : cleanAddress || "Address not provided";

  return { address: cleanAddress, nearestPostOffice, addressWithNearest };
};

// --- SKELETON LOADER ---
function DeliveriesSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 bg-slate-50 rounded-xl" />
      ))}
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function TuteDeliveryPage() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<TuteDeliveryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] =
    useState<TuteDeliveryData | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Word Export Sender Details
  const [teacherName, setTeacherName] = useState("");
  const [teacherAddress, setTeacherAddress] = useState("");
  const [teacherPhone, setTeacherPhone] = useState("");
  const [showSenderConfig, setShowSenderConfig] = useState(false);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [filterType, setFilterType] = useState<FilterType>("all_time");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Data
  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        status: activeTab,
        filterType: filterType,
      };

      if (filterType === "custom" && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }

      const data = await TuteDeliveryService.getAllDeliveries(params);
      setDeliveries(data || []);
    } catch (error) {
      console.error("Delivery sync failed:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filterType, customStart, customEnd]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  useEffect(() => {
    setTeacherName("Kalum Waduge");
    setTeacherAddress("Kurusagoda, Gonapinuwala");
    setTeacherPhone("076 8826142, 071 6832911");
  }, [user]);

  // Client-side Search
  const filteredDeliveries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return deliveries;

    return deliveries.filter((d) => {
      const name = `${d.student?.firstName || ""} ${d.student?.lastName || ""
        }`.toLowerCase();
      const cls = (d.class?.name || "").toLowerCase();
      const phone = (d.student?.phoneNumber || "").toLowerCase();
      const tracking = (d.trackingId || "").toLowerCase();
      const { addressWithNearest } = formatAddressForDisplay(
        (d.student as any)?.address
      );

      return (
        name.includes(q) ||
        cls.includes(q) ||
        phone.includes(q) ||
        tracking.includes(q) ||
        addressWithNearest.toLowerCase().includes(q)
      );
    });
  }, [deliveries, searchQuery]);

  // --- ADDRESS HELPER ---
  const getAddressParts = (delivery: TuteDeliveryData) => {
    const studentAny: any = delivery.student || {};
    return formatAddressForDisplay(studentAny.address || "");
  };

  // --- WORD LABEL EXPORT ---
  const handleGenerateWord = async () => {
    const sourceList =
      filteredDeliveries.length > 0 ? filteredDeliveries : deliveries;
    if (!sourceList.length) {
      window.alert("No delivery records available for Word export.");
      return;
    }

    if (
      !teacherName.trim() ||
      !teacherAddress.trim() ||
      !teacherPhone.trim()
    ) {
      setShowSenderConfig(true);
      window.alert(
        "Please complete sender (teacher) details before generating Word document."
      );
      return;
    }

    setIsExporting(true);
    try {
      const tableRows = sourceList.map((delivery) => {
        // Sender
        const senderParagraphs = [];
        senderParagraphs.push(
          new Paragraph({
            children: [new TextRun({ text: teacherName, bold: true, size: 24 })],
          })
        );

        const teacherAddrLines = teacherAddress
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        teacherAddrLines.forEach((line, i) => {
          senderParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line + (i < teacherAddrLines.length - 1 ? "," : ""),
                  size: 24,
                }),
              ],
            })
          );
        });

        senderParagraphs.push(
          new Paragraph({ children: [new TextRun({ text: "", size: 24 })] })
        );

        const teacherPhones = teacherPhone
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        teacherPhones.forEach((phone) => {
          senderParagraphs.push(
            new Paragraph({ children: [new TextRun({ text: phone, size: 24 })] })
          );
        });

        // Recipient
        const recipientParagraphs = [];
        const studentName = `${delivery.student?.firstName || ""} ${delivery.student?.lastName || ""
          }`.trim();
        recipientParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: studentName || "N/A", bold: true, size: 24 }),
            ],
          })
        );

        const { address, nearestPostOffice } = getAddressParts(delivery);
        if (address) {
          recipientParagraphs.push(
            new Paragraph({
              children: [new TextRun({ text: address, size: 24 })],
            })
          );
        } else {
          recipientParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({ text: "Address not provided", size: 24 }),
              ],
            })
          );
        }

        if (nearestPostOffice) {
          recipientParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Nearest Post Office: ${nearestPostOffice}`,
                  size: 24,
                }),
              ],
            })
          );
        }

        const studentPhone = delivery.student?.phoneNumber || "-";
        recipientParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `\nPhone: ${studentPhone}`, size: 24 }),
            ],
          })
        );

        const tagText = `${delivery.class?.name || ""} - ${delivery.targetMonth || ""
          }`.trim();
        recipientParagraphs.push(
          new Paragraph({
            children: [new TextRun({ text: tagText, bold: true, size: 20 })],
            alignment: AlignmentType.RIGHT,
          })
        );

        return new TableRow({
          children: [
            new TableCell({
              children: senderParagraphs,
              margins: { top: 200, bottom: 200, left: 100, right: 100 },
              borders: {
                top: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
                right: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
              },
            }),
            new TableCell({
              children: recipientParagraphs,
              margins: { top: 200, bottom: 200, left: 100, right: 100 },
              borders: {
                top: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
                right: { style: BorderStyle.NIL, size: 0, color: "FFFFFF" },
              },
            }),
          ],
        });
      });

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
                columnWidths: [4500, 4500],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const monthTag = new Date().toISOString().slice(0, 7);
      saveAs(blob, `tute-labels-${activeTab}-${monthTag}.docx`);
    } catch (error) {
      console.error("Failed to generate Word document:", error);
      alert("Failed to generate Word Document.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDispatch = async (
    id: string,
    tracking: string,
    courier: string
  ) => {
    try {
      await TuteDeliveryService.markAsSent(id, {
        trackingId: tracking,
        courierService: courier,
      });
      fetchDeliveries();
      setSelectedDelivery(null);
    } catch {
      alert("Failed to update status. Please try again.");
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-24 md:pb-12">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-prussian tracking-tight">
            Tute Dispatch
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage physical study material shipments, courier tracking, and printable address labels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={fetchDeliveries}
            disabled={loading}
            title="Refresh shipments"
            className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-sm text-slate-600 hover:text-brand-cerulean hover:border-brand-cerulean/40 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`w-4 h-4 ${loading ? "animate-spin text-brand-cerulean" : ""
                }`}
            />
          </button>

          <button
            onClick={() => setShowSenderConfig((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-sm transition-all ${showSenderConfig
                ? "bg-brand-aliceBlue border-brand-cerulean/40 text-brand-cerulean"
                : "bg-white border-slate-200/80 text-brand-prussian hover:bg-slate-50"
              }`}
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            <span>Sender Details</span>
          </button>

          <button
            onClick={handleGenerateWord}
            disabled={isExporting || deliveries.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-prussian hover:bg-brand-cerulean text-white text-xs font-semibold shadow-sm hover:shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : (
              <DocumentArrowDownIcon className="w-4 h-4" />
            )}
            <span>
              {isExporting ? "Exporting..." : "Export Labels (.docx)"}
            </span>
          </button>
        </div>
      </header>

      {/* COLLAPSIBLE SENDER CONFIG PANEL */}
      <AnimatePresence>
        {showSenderConfig && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-brand-prussian">
                    Return Address (Printed on Labels)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Use commas to separate address lines or multiple phone numbers.
                  </p>
                </div>
                <button
                  onClick={() => setShowSenderConfig(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Sender / Teacher Name
                  </label>
                  <input
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="Teacher Name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-brand-prussian focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Return Address
                  </label>
                  <input
                    value={teacherAddress}
                    onChange={(e) => setTeacherAddress(e.target.value)}
                    placeholder="Street, Town (comma separated)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-brand-prussian focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Contact Numbers
                  </label>
                  <input
                    value={teacherPhone}
                    onChange={(e) => setTeacherPhone(e.target.value)}
                    placeholder="076..., 071..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-brand-prussian focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/20 outline-none"
                  />
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* DIRECTORY CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Status Segmented Tabs */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60 overflow-x-auto self-start">
              {(
                [
                  { key: "pending", label: "Pending" },
                  { key: "shipped", label: "Sent History" },
                  { key: "delivered", label: "Delivered" },
                ] as const
              ).map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${active
                        ? "bg-white text-brand-prussian shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    <span>{tab.label}</span>
                    {active && !loading && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-brand-aliceBlue text-brand-cerulean tabular-nums">
                        {filteredDeliveries.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search & Date Filter */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1 lg:justify-end">
              <div className="relative flex-1 lg:max-w-xs">
                <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student, class, or tracking..."
                  className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="relative sm:w-44">
                <FunnelIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  className="w-full appearance-none pl-10 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean cursor-pointer transition-all"
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
                <ChevronDownIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Custom Date Range Inputs */}
          {filterType === "custom" && (
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-400">
                Date Range:
              </span>
              <input
                type="date"
                className="w-full sm:w-auto px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-brand-prussian focus:bg-white focus:border-brand-cerulean outline-none"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                className="w-full sm:w-auto px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-brand-prussian focus:bg-white focus:border-brand-cerulean outline-none"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <DeliveriesSkeleton />
        ) : filteredDeliveries.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-4">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
              <ArchiveBoxIcon className="w-7 h-7 text-slate-300" />
            </div>
            <h3 className="text-sm font-semibold text-brand-prussian">
              No {activeTab} shipments found
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Try adjusting your search query, date range, or switch to another tab.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Student & Class</th>
                    <th className="px-6 py-3.5">Shipping Address</th>
                    <th className="px-6 py-3.5">Target Month</th>
                    {activeTab !== "pending" && (
                      <th className="px-6 py-3.5">Dispatch Info</th>
                    )}
                    <th className="px-6 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence mode="popLayout">
                    {filteredDeliveries.map((delivery) => (
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

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {filteredDeliveries.map((delivery) => (
                  <MobileDeliveryCard
                    key={delivery._id}
                    delivery={delivery}
                    currentTab={activeTab}
                    onDispatch={() => setSelectedDelivery(delivery)}
                  />
                ))}
              </AnimatePresence>
            </div>
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

// --- SUB-COMPONENTS ---

function DeliveryRow({
  delivery,
  currentTab,
  onDispatch,
}: {
  delivery: TuteDeliveryData;
  currentTab: TabType;
  onDispatch: () => void;
}) {
  const { address, nearestPostOffice } = formatAddressForDisplay(
    delivery.student?.address
  );
  const isHistory = currentTab !== "pending";

  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="hover:bg-slate-50/80 transition-colors"
    >
      <td className="px-6 py-4">
        <div className="text-sm font-semibold text-brand-prussian">
          {delivery.student?.firstName} {delivery.student?.lastName}
        </div>
        <div className="text-xs text-brand-cerulean font-medium mt-0.5 flex items-center gap-1.5">
          <BuildingLibraryIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate max-w-[200px]">{delivery.class?.name}</span>
        </div>
        {delivery.student?.phoneNumber && (
          <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-1">
            <PhoneIcon className="w-3 h-3" />
            {delivery.student.phoneNumber}
          </div>
        )}
      </td>

      <td className="px-6 py-4 max-w-xs">
        <div className="flex items-start gap-2">
          <MapPinIcon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs text-slate-600 leading-relaxed">
              {address || "Address not provided"}
            </p>
            {nearestPostOffice && (
              <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                Nearest PO: {nearestPostOffice}
              </span>
            )}
          </div>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-50 text-brand-prussian border border-slate-200/70 text-xs font-semibold tabular-nums">
          {delivery.targetMonth}
        </span>
      </td>

      {isHistory && (
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-prussian">
              <TruckIcon className="w-3.5 h-3.5 text-brand-cerulean" />
              <span>{delivery.courierService || "Courier"}</span>
            </div>
            {delivery.trackingId && (
              <div className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                <QrCodeIcon className="w-3 h-3" />
                {delivery.trackingId}
              </div>
            )}
            <div className="text-[11px] text-slate-400 tabular-nums">
              {delivery.sentAt
                ? new Date(delivery.sentAt).toLocaleDateString()
                : "Date Unknown"}
            </div>
          </div>
        </td>
      )}

      <td className="px-6 py-4 text-right whitespace-nowrap">
        {currentTab === "pending" && (
          <button
            onClick={onDispatch}
            className="inline-flex items-center gap-1.5 bg-brand-prussian hover:bg-brand-cerulean text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-[0.98]"
          >
            <PaperAirplaneIcon className="w-3.5 h-3.5" />
            <span>Dispatch</span>
          </button>
        )}

        {currentTab === "shipped" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-600/15">
            <TruckIcon className="w-3.5 h-3.5" />
            In Transit
          </span>
        )}

        {currentTab === "delivered" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15">
            <CheckBadgeIcon className="w-3.5 h-3.5" />
            Received
          </span>
        )}
      </td>
    </motion.tr>
  );
}

function MobileDeliveryCard({
  delivery,
  currentTab,
  onDispatch,
}: {
  delivery: TuteDeliveryData;
  currentTab: TabType;
  onDispatch: () => void;
}) {
  const { address, nearestPostOffice } = formatAddressForDisplay(
    delivery.student?.address
  );
  const isHistory = currentTab !== "pending";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="p-4 bg-white space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-brand-prussian truncate">
            {delivery.student?.firstName} {delivery.student?.lastName}
          </h3>
          <p className="text-xs text-brand-cerulean font-medium truncate mt-0.5">
            {delivery.class?.name}
          </p>
        </div>
        <span className="px-2.5 py-0.5 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px] font-semibold text-brand-prussian shrink-0 tabular-nums">
          {delivery.targetMonth}
        </span>
      </div>

      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 space-y-1">
        <div className="flex items-start gap-2">
          <MapPinIcon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-600 leading-relaxed">
            {address || "Address not provided"}
          </p>
        </div>
        {nearestPostOffice && (
          <p className="text-[11px] font-semibold text-slate-500 pl-6">
            Nearest PO: {nearestPostOffice}
          </p>
        )}
      </div>

      {isHistory ? (
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-prussian">
              <TruckIcon className="w-3.5 h-3.5 text-brand-cerulean" />
              <span>{delivery.courierService}</span>
              {delivery.trackingId && (
                <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                  {delivery.trackingId}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
              Sent{" "}
              {delivery.sentAt
                ? new Date(delivery.sentAt).toLocaleDateString()
                : "Date Unknown"}
            </p>
          </div>

          {currentTab === "delivered" ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              <CheckBadgeIcon className="w-3.5 h-3.5" /> Received
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              <TruckIcon className="w-3.5 h-3.5" /> In Transit
            </span>
          )}
        </div>
      ) : (
        <button
          onClick={onDispatch}
          className="w-full inline-flex items-center justify-center gap-2 bg-brand-prussian hover:bg-brand-cerulean text-white py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-sm"
        >
          <PaperAirplaneIcon className="w-4 h-4" />
          <span>Mark as Sent</span>
        </button>
      )}
    </motion.div>
  );
}

function DispatchModal({
  isOpen,
  onClose,
  onConfirm,
  delivery,
}: DispatchModalProps) {
  const [tracking, setTracking] = useState("");
  const [courier, setCourier] = useState("SL Post");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivery) return;

    setIsSubmitting(true);
    await onConfirm(delivery._id, tracking.trim(), courier);
    setIsSubmitting(false);
    setTracking("");
    setCourier("SL Post");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && onClose()}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200/70 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0">
                  <TruckIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-prussian">
                    Confirm Dispatch
                  </h3>
                  <p className="text-xs text-slate-400">
                    Record courier & tracking details.
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isSubmitting && onClose()}
                disabled={isSubmitting}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form
              id="dispatch-form"
              onSubmit={handleSubmit}
              className="p-6 space-y-4"
            >
              <div className="p-3.5 bg-brand-aliceBlue/60 rounded-xl border border-brand-cerulean/20">
                <p className="text-xs text-brand-prussian leading-relaxed">
                  Marking{" "}
                  <strong>
                    {delivery?.student?.firstName} {delivery?.student?.lastName}'s
                  </strong>{" "}
                  tute for <strong>{delivery?.targetMonth}</strong> as sent.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Courier Service
                </label>
                <div className="relative">
                  <TruckIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    className="w-full appearance-none pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-brand-prussian focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none cursor-pointer transition-all"
                  >
                    <option value="SL Post">SL Post</option>
                    <option value="Domex">Domex</option>
                    <option value="Prompt Xpress">Prompt Xpress</option>
                    <option value="PickMe Flash">PickMe Flash</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDownIcon className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tracking Number{" "}
                  <span className="text-slate-400 font-normal normal-case">
                    (Optional)
                  </span>
                </label>
                <div className="relative">
                  <QrCodeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="e.g., 883920011"
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-mono font-medium text-brand-prussian placeholder:font-sans placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean outline-none transition-all"
                  />
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="dispatch-form"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-prussian hover:bg-brand-cerulean text-white font-semibold text-xs transition-all shadow-sm disabled:opacity-60"
              >
                {isSubmitting ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <ClipboardDocumentCheckIcon className="w-4 h-4" />
                )}
                <span>{isSubmitting ? "Saving..." : "Confirm Dispatch"}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}