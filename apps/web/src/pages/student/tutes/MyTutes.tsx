import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TuteDeliveryService, { type TuteDeliveryData } from "../../../services/TuteDeliveryService";

import {
  CubeIcon,
  TruckIcon,
  CheckBadgeIcon,
  ClockIcon,
  ArrowPathIcon,
  ClipboardDocumentCheckIcon
} from "@heroicons/react/24/outline";

export default function MyTutesPage() {
  const [deliveries, setDeliveries] = useState<TuteDeliveryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch Data
  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await TuteDeliveryService.getMyDeliveries();
      setDeliveries(data);
    } catch (error) {
      console.error("Failed to load deliveries", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  // Handle "Mark as Received"
  const handleConfirmReceipt = async (id: string) => {
    if(!window.confirm("Confirm that you have physically received this tute?")) return;
    
    setProcessingId(id);
    try {
      await TuteDeliveryService.markAsDelivered(id);
      // Optimistic Update
      setDeliveries(prev => prev.map(d => d._id === id ? { ...d, status: 'delivered' } : d));
    } catch (error) {
      alert("Action failed. Please check your connection.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6 pb-24 animate-in fade-in duration-500 font-sans">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-brand-prussian tracking-tight">My Study Packs</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">Track physical tute deliveries</p>
        </div>
        <button
            onClick={fetchDeliveries}
            className="p-2 bg-white border border-brand-aliceBlue rounded-xl text-brand-cerulean hover:bg-brand-aliceBlue transition-colors"
            title="Refresh List"
        >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* --- CONTENT --- */}
      <div className="bg-transparent sm:bg-white sm:border border-brand-aliceBlue rounded-2xl sm:overflow-hidden sm:shadow-sm min-h-[400px]">
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-3 text-gray-400">
            <CubeIcon className="w-10 h-10 animate-pulse text-brand-cerulean/50" />
            <p className="text-xs font-bold uppercase tracking-[0.2em]">Locating Packages...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-brand-aliceBlue/30 text-[10px] uppercase text-brand-prussian/40 font-bold tracking-widest border-b border-brand-aliceBlue">
                  <tr>
                    <th className="px-6 py-4">Tute Month & Class</th>
                    <th className="px-6 py-4">Delivery Status</th>
                    <th className="px-6 py-4">Courier Info</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-aliceBlue/30">
                  <AnimatePresence mode="popLayout">
                    {deliveries.map((delivery) => (
                      <DeliveryRow 
                        key={delivery._id} 
                        delivery={delivery} 
                        onConfirm={handleConfirmReceipt}
                        isProcessing={processingId === delivery._id}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-4">
                <AnimatePresence mode="popLayout">
                    {deliveries.map((delivery) => (
                        <MobileDeliveryCard 
                            key={delivery._id}
                            delivery={delivery}
                            onConfirm={handleConfirmReceipt}
                            isProcessing={processingId === delivery._id}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {deliveries.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-center text-gray-400">
                 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <CubeIcon className="w-8 h-8 text-gray-300" />
                 </div>
                 <p className="text-xs font-bold uppercase tracking-widest">No deliveries found</p>
                 <p className="text-[10px] mt-1">Tutes will appear here once your payment is approved.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

interface DeliveryItemProps {
  delivery: TuteDeliveryData;
  onConfirm: (id: string) => void;
  isProcessing: boolean;
}

function DeliveryRow({ delivery, onConfirm, isProcessing }: DeliveryItemProps) {
  const isShipped = delivery.status === 'shipped';
  const isDelivered = delivery.status === 'delivered';
  
  return (
    <motion.tr 
        layout 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
        className="group hover:bg-brand-aliceBlue/10 transition-colors"
    >
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-aliceBlue/50 border border-brand-aliceBlue flex items-center justify-center shrink-0">
                 <span className="text-xs font-black text-brand-prussian">{delivery.targetMonth.split('-')[1]}</span>
            </div>
            <div>
                <div className="text-sm font-bold text-brand-prussian">{delivery.class?.name}</div>
                <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mt-0.5">
                   Month: {delivery.targetMonth}
                </div>
            </div>
        </div>
      </td>

      <td className="px-6 py-5">
         <StatusBadge status={delivery.status} />
      </td>

      <td className="px-6 py-5">
         {isShipped || isDelivered ? (
             <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                      <TruckIcon className="w-3.5 h-3.5 text-brand-cerulean" />
                      {delivery.courierService || "SL Post"}
                  </div>
                  {delivery.trackingId ? (
                      <div className="text-[10px] font-mono text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded w-fit select-all">
                          {delivery.trackingId}
                      </div>
                  ) : (
                      <span className="text-[9px] text-gray-400 italic">No tracking provided</span>
                  )}
             </div>
         ) : (
             <span className="text-[10px] text-gray-400 italic">Awaiting Dispatch</span>
         )}
      </td>

      <td className="px-6 py-5 text-right">
        {isShipped && (
            <button 
                onClick={() => onConfirm(delivery._id)}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 bg-brand-cerulean hover:bg-brand-prussian text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm shadow-brand-cerulean/20 active:scale-95 disabled:opacity-50"
            >
                {isProcessing ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : <ClipboardDocumentCheckIcon className="w-3 h-3" />}
                I Received This
            </button>
        )}
        {isDelivered && (
             <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest opacity-60">
                Completed
             </span>
        )}
      </td>
    </motion.tr>
  );
}

function MobileDeliveryCard({ delivery, onConfirm, isProcessing }: DeliveryItemProps) {
    const isShipped = delivery.status === 'shipped';
    
    return (
        <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-5 rounded-2xl shadow-sm border border-brand-aliceBlue relative overflow-hidden">
            {/* Background Decoration */}
            <CubeIcon className="absolute -right-4 -top-4 w-24 h-24 text-brand-aliceBlue/50 pointer-events-none" />

            <div className="relative flex justify-between items-start mb-4">
                <div>
                    <span className="text-[10px] font-bold text-brand-cerulean uppercase tracking-widest">{delivery.targetMonth}</span>
                    <h3 className="text-base font-bold text-brand-prussian mt-1">{delivery.class?.name}</h3>
                </div>
                <StatusBadge status={delivery.status} />
            </div>

            {/* Courier Info Block */}
            <div className="relative bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <TruckIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-700">{delivery.courierService || "Pending Courier"}</span>
                </div>
                {delivery.trackingId && (
                    <div className="flex items-center gap-2 pl-6">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Ref:</span>
                        <span className="text-xs font-mono text-gray-600 bg-white px-1.5 rounded border border-gray-200 select-all">
                            {delivery.trackingId}
                        </span>
                    </div>
                )}
                {delivery.sentAt && (
                    <div className="text-[10px] text-gray-400 text-right mt-1">
                        Sent on {new Date(delivery.sentAt).toLocaleDateString()}
                    </div>
                )}
            </div>

            {/* Action Button */}
            {isShipped && (
                <button 
                    onClick={() => onConfirm(delivery._id)}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 bg-brand-cerulean text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md shadow-brand-cerulean/10 active:scale-95 transition-transform disabled:opacity-70"
                >
                    {isProcessing ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <ClipboardDocumentCheckIcon className="w-4 h-4" />}
                    Mark as Received
                </button>
            )}
        </motion.div>
    );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    delivered: { color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: <CheckBadgeIcon className="w-3 h-3" />, label: "Received" },
    shipped: { color: "bg-blue-50 text-blue-600 border-blue-100 animate-pulse", icon: <TruckIcon className="w-3 h-3" />, label: "On the way" },
    pending: { color: "bg-amber-50 text-amber-600 border-amber-100", icon: <ClockIcon className="w-3 h-3" />, label: "Processing" },
  };

  const current = configs[status] || configs.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border ${current.color}`}>
      {current.icon} {current.label}
    </span>
  );
}