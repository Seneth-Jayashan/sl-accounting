import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onClose: () => void; // treated as cancel
  onConfirm: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title = "Confirm",
  message = "Are you sure?",
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  loading = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 6 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative"
            >
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors z-10"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <div className="p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 mb-6">{message}</p>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl border bg-white text-gray-700 disabled:opacity-60"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-[#0b2540] text-white disabled:opacity-60"
                  >
                    {loading ? "Working..." : confirmLabel}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
