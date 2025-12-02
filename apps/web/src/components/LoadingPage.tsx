// components/LoadingPage.tsx
import { motion } from "framer-motion";

const LoadingPage = () => {
  return (
    <div className="relative flex items-center justify-center h-screen w-full bg-[#0b1121] overflow-hidden text-white">
      
      {/* --- Ambient Background Animations (Glowing Orbs) --- */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, 50, 0],
          y: [0, -30, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px]"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.2, 0.4, 0.2],
          x: [0, -30, 0],
          y: [0, 50, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-[120px]"
      />

      {/* --- Main Card --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 p-8 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col items-center justify-center min-w-[280px]"
      >
        
        {/* Logo / Icon Placeholder (Optional - pulsing dot center) */}
        <div className="relative w-20 h-20 flex items-center justify-center mb-6">
           {/* Outer Rotating Ring */}
           <motion.span
            className="absolute w-full h-full border-4 border-transparent border-t-blue-400 border-r-purple-400 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Inner Rotating Ring (Reverse) */}
          <motion.span
            className="absolute w-12 h-12 border-4 border-transparent border-b-blue-200 border-l-purple-200 rounded-full opacity-70"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />

          {/* Center Pulsing Dot */}
          <motion.div
            className="w-3 h-3 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Text Section */}
        <div className="text-center space-y-2">
          <motion.h2
            className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200"
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading...
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-xs text-white/40 font-medium uppercase tracking-[0.2em]"
          >
            Please wait
          </motion.p>
        </div>

      </motion.div>
    </div>
  );
};

export default LoadingPage;