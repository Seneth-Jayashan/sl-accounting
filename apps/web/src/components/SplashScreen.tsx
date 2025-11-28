// SplashScreen.tsx
import React from "react";
import { motion } from "framer-motion";
import introVideo from "../assets/videos/SplashScreen.mp4";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}        // start fully visible
      animate={{ opacity: 1 }}        // stay visible while active
      exit={{ opacity: 0 }}           // fade out when unmounting
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-[#053A4E] flex items-center justify-center overflow-hidden"
    >
      <video
        src={introVideo}
        autoPlay
        muted
        playsInline
        onEnded={onComplete}          // ⬅ triggers fade-out
        className="w-full h-full object-contain md:object-cover bg-black opacity-90"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 right-8"
      >
        <button
          onClick={onComplete}         // ⬅ also triggers fade-out
          className="text-white/50 hover:text-white text-sm font-sans border border-white/20 px-4 py-1 rounded-full transition-colors"
        >
          Skip Intro
        </button>
      </motion.div>
    </motion.div>
  );
};
