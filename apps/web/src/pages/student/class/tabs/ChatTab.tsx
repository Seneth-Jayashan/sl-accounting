import { motion } from "framer-motion";
import { MessageSquare, Users, Lock, Sparkles } from "lucide-react";

export default function ChatTab() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="max-w-3xl mx-auto"
    >
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-brand-prussian/5 overflow-hidden">
        {/* Banner Section */}
        <div className="h-48 bg-gradient-to-br from-brand-prussian to-brand-cerulean relative flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full blur-xl"></div>
                <div className="absolute bottom-5 right-20 w-32 h-32 bg-brand-jasmine rounded-full blur-2xl"></div>
            </div>
            <Users size={80} className="text-white/20" />
        </div>

        {/* Content Section */}
        <div className="p-10 text-center">
            <div className="inline-flex items-center gap-2 bg-brand-jasmine/20 text-brand-prussian text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-6">
                <Sparkles size={12} className="text-brand-coral" /> New Feature Coming Soon
            </div>
            
            <h3 className="text-3xl font-black text-brand-prussian mb-4">Student Community</h3>
            <p className="text-gray-500 leading-relaxed mb-8 text-sm md:text-base">
                We are building a dedicated space for you to discuss lessons, share study tips, and collaborate with your classmates. This feature will be available in the next system update.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                    disabled 
                    className="flex items-center gap-3 bg-gray-100 text-gray-400 font-bold py-4 px-8 rounded-2xl cursor-not-allowed border border-gray-200"
                >
                    <Lock size={18} /> Private Channel
                </button>
                <div className="text-xs font-bold text-brand-cerulean bg-brand-aliceBlue px-4 py-2 rounded-xl">
                    ETA: Q1 2026
                </div>
            </div>
        </div>
        
        {/* Footer Info */}
        <div className="bg-gray-50 p-6 border-t border-gray-100 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                <MessageSquare size={14} /> End-to-End Encrypted
            </div>
            <div className="h-4 w-px bg-gray-200"></div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                <Users size={14} /> Verified Students Only
            </div>
        </div>
      </div>
    </motion.div>
  );
}