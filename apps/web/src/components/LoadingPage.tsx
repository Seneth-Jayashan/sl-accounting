// components/LoadingPage.tsx
import { motion } from "framer-motion";

const LoadingPage = () => {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#334155] text-white">

      {/* Animated Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="px-8 py-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl flex flex-col items-center"
      >
        
        {/* Loader Ring */}
        <motion.div
          className="w-14 h-14 border-4 border-white/20 border-t-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
        />

        <motion.p
          className="mt-4 text-lg font-semibold tracking-wide text-white/80"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
        >
          Loading...
        </motion.p>

      </motion.div>
    </div>
  );
};

export default LoadingPage;
