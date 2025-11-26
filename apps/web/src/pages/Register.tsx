import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, MeshTransmissionMaterial, Sparkles } from "@react-three/drei";
import { motion } from "framer-motion";
import { User, Mail, Phone, Lock, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";
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
const RegisterShape = () => {
  const mesh = useRef<THREE.Mesh>(null!);
  
  useFrame((state, delta) => {
    if (!mesh.current) return;
    mesh.current.rotation.x -= delta * 0.2;
    mesh.current.rotation.y -= delta * 0.15;
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={mesh} position={[-2, 0, -2]} scale={2.5}>
        {/* CHANGED: Swapped Torus for Icosahedron (Gem) like Login Page */}
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
          color={BRAND.coral} 
          background={new THREE.Color(BRAND.alice)}
        />
      </mesh>
    </Float>
  );
};

const RegisterScene = () => (
  <>
    <Environment preset="city" />
    <ambientLight intensity={1} />
    <spotLight position={[10, 10, 10]} intensity={2} color={BRAND.cerulean} />
    <RegisterShape />
    <Sparkles count={50} scale={[12, 12, 12]} size={4} speed={0.3} opacity={0.4} color={BRAND.prussian} />
  </>
);

// --- REGISTER FORM COMPONENT ---
export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("Register Payload:", formData);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    // CHANGED: Added 'pt-24 pb-12' for Nav clearance and 'overflow-y-auto' for scrolling
    <div className="w-full min-h-screen bg-[#E8EFF7] relative overflow-y-auto overflow-x-hidden flex items-center justify-center md:justify-end pt-24 pb-12">
      
      {/* 3D Background Layer - Fixed position so it stays while scrolling */}
      <div className="fixed inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <RegisterScene />
        </Canvas>
      </div>

      {/* Decorative Blob */}
      <div className="fixed bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#EF8D8E]/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-start md:items-center">
        
        {/* Left Side: Visual Text */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden md:block text-left pointer-events-none sticky top-32"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/30 backdrop-blur-md border border-white/40 mb-6">
            <CheckCircle2 className="text-[#EF8D8E]" size={20} />
            <span className="text-[#053A4E] font-bold text-sm">Join 1000+ Students</span>
          </div>
          <h1 className="text-6xl font-black text-[#053A4E] mb-4 font-sinhala leading-tight">
            අනාගතය දිනන <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EF8D8E] to-[#05668A]">පවුලට එක්වන්න</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-lg font-sinhala leading-relaxed">
            Create your student account today to access exclusive A/L Accounting tutorials, exams, and live sessions.
          </p>
        </motion.div>

        {/* Right Side: Registration Form */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/70 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-[2rem] shadow-2xl shadow-[#053A4E]/10 w-full max-w-lg mx-auto md:mx-0"
        >
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-[#053A4E]">Register</h2>
            <p className="text-gray-500 text-sm mt-1">Create your new student account</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-3">
            
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-bold text-[#053A4E] uppercase tracking-wide ml-1">First Name</label>
                <div className="relative group">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                  <input 
                    name="firstName"
                    type="text" 
                    placeholder="Kamal"
                    className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-9 pr-3 py-2.5 rounded-xl outline-none transition-all shadow-sm text-sm"
                    required
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] md:text-xs font-bold text-[#053A4E] uppercase tracking-wide ml-1">Last Name</label>
                <div className="relative group">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                  <input 
                    name="lastName"
                    type="text" 
                    placeholder="Perera"
                    className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-9 pr-3 py-2.5 rounded-xl outline-none transition-all shadow-sm text-sm"
                    required
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] md:text-xs font-bold text-[#053A4E] uppercase tracking-wide ml-1">Email Address</label>
              <div className="relative group">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                <input 
                  name="email"
                  type="email" 
                  placeholder="kamal@example.com"
                  className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-9 pr-3 py-2.5 rounded-xl outline-none transition-all shadow-sm text-sm"
                  required
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="text-[10px] md:text-xs font-bold text-[#053A4E] uppercase tracking-wide ml-1">Phone Number</label>
              <div className="relative group">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                <input 
                  name="phoneNumber"
                  type="tel" 
                  placeholder="07X XXX XXXX"
                  className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-9 pr-3 py-2.5 rounded-xl outline-none transition-all shadow-sm text-sm"
                  required
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[10px] md:text-xs font-bold text-[#053A4E] uppercase tracking-wide ml-1">Password</label>
              <div className="relative group">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                <input 
                  name="password"
                  type={showPassword ? "text" : "password"} 
                  placeholder="Min 6 chars"
                  className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-9 pr-9 py-2.5 rounded-xl outline-none transition-all shadow-sm text-sm"
                  required
                  minLength={6}
                  onChange={handleChange}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#053A4E]"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-[10px] md:text-xs font-bold text-[#053A4E] uppercase tracking-wide ml-1">Confirm Password</label>
              <div className="relative group">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#05668A]" />
                <input 
                  name="confirmPassword"
                  type="password" 
                  placeholder="Re-enter password"
                  className="w-full bg-white/50 border border-white/50 focus:border-[#05668A] focus:bg-white text-[#053A4E] pl-9 pr-3 py-2.5 rounded-xl outline-none transition-all shadow-sm text-sm"
                  required
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button 
              disabled={loading}
              className="w-full bg-[#053A4E] hover:bg-[#05668A] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#053A4E]/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-[#05668A] font-bold hover:underline">Login here</Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}