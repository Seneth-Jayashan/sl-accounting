import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, MeshTransmissionMaterial, Sparkles } from "@react-three/drei";
import { motion } from "framer-motion";
import { User, Lock, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import * as THREE from "three";
import { Link } from "react-router-dom";

// --- BRAND CONSTANTS ---
const BRAND = {
  prussian: "#053A4E",
  cerulean: "#05668A",
  coral: "#EF8D8E",
  jasmine: "#FFE787",
  alice: "#E8EFF7",
};

// --- 3D BACKGROUND COMPONENT ---
const LoginGem = () => {
  const mesh = useRef<THREE.Mesh>(null!);
  
  useFrame((state, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.x += delta * 0.2;
    mesh.current.rotation.y += delta * 0.1;
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={mesh} position={[2, 0, -2]} scale={2.5}>
        <icosahedronGeometry args={[1, 0]} />
        <MeshTransmissionMaterial 
          backside
          samples={4}
          thickness={0.5}
          roughness={0}
          iridescence={1}
          iridescenceIOR={1}
          chromaticAberration={0.06}
          anisotropy={0.1}
          color={BRAND.cerulean}
          background={new THREE.Color(BRAND.alice)}
        />
      </mesh>
    </Float>
  );
};

const LoginScene = () => (
  <>
    <Environment preset="city" />
    <ambientLight intensity={1} />
    <spotLight position={[-10, 10, 10]} intensity={2} color={BRAND.coral} />
    <LoginGem />
    <Sparkles count={40} scale={[10, 10, 10]} size={4} speed={0.4} opacity={0.4} color={BRAND.cerulean} />
  </>
);

// --- LOGIN FORM COMPONENT ---
export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate login delay
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="w-full h-screen bg-[#E8EFF7] relative overflow-hidden flex items-center justify-center md:justify-start pt-12 md:pt-12">
      
      {/* 3D Background Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <LoginScene />
        </Canvas>
      </div>

      {/* Decorative Blob */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#05668A]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Left Side: Form */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/70 backdrop-blur-xl border border-white/60 p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-[#053A4E]/10 max-w-md w-full mx-auto md:mx-0"
        >
          {/* Header */}
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-bold text-[#053A4E] font-sinhala">ආයුබෝවන්!</h2>
            <p className="text-gray-500 mt-2 font-sans">Welcome back to SL Accounting LMS</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#053A4E] ml-1">Student ID / Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#05668A] group-focus-within:text-[#EF8D8E] transition-colors">
                  <User size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder="Enter your ID"
                  className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-12 pr-4 py-4 rounded-2xl outline-none transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#053A4E] ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#05668A] group-focus-within:text-[#EF8D8E] transition-colors">
                  <Lock size={20} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••"
                  className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-12 pr-12 py-4 rounded-2xl outline-none transition-all shadow-sm"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#053A4E] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-[#053A4E]">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#05668A] focus:ring-[#05668A]" />
                Remember me
              </label>
              <a href="#" className="text-[#05668A] font-bold hover:text-[#EF8D8E] transition-colors">Forgot Password?</a>
            </div>

            {/* Submit Button */}
            <button 
              disabled={loading}
              className="w-full bg-[#053A4E] hover:bg-[#05668A] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#053A4E]/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Login to LMS <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            Don't have an account? <Link to="/register" className="text-[#05668A] font-bold hover:underline">Register Now</Link>
          </div>
        </motion.div>

        {/* Right Side: Visual Text (Desktop Only) */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hidden md:block text-right pointer-events-none"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/30 backdrop-blur-md border border-white/40 mb-6">
            <ShieldCheck className="text-[#05668A]" size={20} />
            <span className="text-[#053A4E] font-bold text-sm">Secure Student Portal</span>
          </div>
          <h1 className="text-6xl font-black text-[#053A4E] mb-4 font-sinhala leading-tight">
            ඔබේ ජයග්‍රහණයේ <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-[#05668A] to-[#EF8D8E]">ආරම්භය මෙතැනයි</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-md ml-auto font-sinhala">
            Access your course materials, recordings, and exam papers in one secure place.
          </p>
        </motion.div>

      </div>
    </div>
  );
}