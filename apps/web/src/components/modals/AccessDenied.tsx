import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, ShieldAlert, LogIn } from "lucide-react"; // Changed ChevronRight to LogIn
import { Link, useNavigate } from "react-router-dom";

interface AccessDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function AccessDeniedModal({ 
  isOpen, 
  onClose, 
  title = "Access Restricted", 
  message = "You do not have permission to view this content. Please log in with an authorized account."
}: AccessDeniedModalProps) {
  
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    onClose(); // Run any cleanup if needed
    navigate("/login"); // Redirect to Login Page
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#053A4E]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden relative"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors z-10"
              >
                <X size={20} className="text-gray-500" />
              </button>

              <div className="p-8 text-center">
                {/* Icon Animation */}
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 relative"
                >
                   {/* Pulsing Effect */}
                   <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-20"></div>
                   <Lock size={36} />
                   <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 border-2 border-white">
                      <ShieldAlert size={16} className="text-red-600" />
                   </div>
                </motion.div>

                {/* Text Content */}
                <h3 className="text-2xl font-bold text-[#053A4E] mb-3">
                  {title}
                </h3>
                
                <p className="text-gray-500 leading-relaxed mb-8">
                  {message}
                </p>

                {/* Actions */}
                <div className="space-y-3">
                  {/* Primary Action -> Goes to Login */}
                  <button
                    onClick={handleLoginRedirect}
                    className="w-full bg-[#053A4E] hover:bg-[#05668A] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#053A4E]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Go to Login
                  </button>

                  {/* Secondary Link -> Also acts as Login fallback */}
                  <Link 
                    to="/login" 
                    className="block w-full py-3 text-sm text-[#05668A] font-bold hover:text-[#053A4E] transition-colors flex items-center justify-center gap-2"
                  >
                    Switch Account <LogIn size={16} />
                  </Link>
                </div>
              </div>
              
              {/* Bottom Decorative Strip */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#EF8D8E] to-[#05668A]" />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}