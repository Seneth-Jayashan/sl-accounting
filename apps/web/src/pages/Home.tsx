import React, { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ScrollControls, Scroll, useScroll, Float, Environment, Sparkles, MeshTransmissionMaterial } from "@react-three/drei";
import { motion } from "framer-motion";
import { Play, BookOpen, GraduationCap, Users, Star, ChevronDown, CheckCircle2 } from "lucide-react";
import * as THREE from "three";

// Import the Footer component
import { Footer } from "../components/Footer";

// --- BRAND CONSTANTS ---
const BRAND = {
  prussian: "#053A4E",
  cerulean: "#05668A",
  coral: "#EF8D8E",
  jasmine: "#FFE787",
  alice: "#E8EFF7",
  white: "#ffffff"
};

// --- 3D COMPONENT: PARALLAX CRYSTAL ---
const ParallaxCrystal = ({
  position,
  scale = 1,
  color = BRAND.cerulean,
  rotation = [0, 0, 0],
  speed = 1,
  shape = "ico"
}: {
  position: [number, number, number];
  scale?: number;
  color?: string;
  rotation?: [number, number, number];
  speed?: number;
  shape?: "ico" | "oct" | "torus";
}) => {
  const mesh = useRef<THREE.Mesh>(null!);
  const scroll = useScroll();
  const { height } = useThree((state) => state.viewport);

  useFrame((_, delta) => {
    if (!mesh.current) return;
    
    // 1. Live Animation
    mesh.current.rotation.x += delta * 0.2;
    mesh.current.rotation.y += delta * 0.15;

    // 2. Parallax Logic
    const yShift = scroll.offset * height * speed; 
    mesh.current.position.y = position[1] + yShift;
  });

  const materialProps = {
    backside: true,
    samples: 4,
    resolution: 512,
    thickness: 0.3,
    roughness: 0,
    iridescence: 1,
    iridescenceIOR: 1,
    chromaticAberration: 0.04,
    anisotropy: 0.1,
    distortion: 0.1,
    distortionScale: 0.2,
    temporalDistortion: 0.1,
    color: color,
    background: new THREE.Color(BRAND.alice)
  };

  return (
    <Float speed={3} rotationIntensity={0.5} floatIntensity={0.5} floatingRange={[-0.2, 0.2]}>
      <mesh ref={mesh} position={position} rotation={rotation} scale={scale}>
        {shape === "ico" && <icosahedronGeometry args={[1, 0]} />}
        {shape === "oct" && <octahedronGeometry args={[1, 0]} />}
        {shape === "torus" && <torusGeometry args={[0.7, 0.3, 16, 32]} />}
        <MeshTransmissionMaterial {...materialProps} />
      </mesh>
    </Float>
  );
};

// --- 3D SCENE ---
const ExperienceScene: React.FC = () => {
  const { width, height } = useThree((s) => s.viewport);

  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={1.2} />
      <spotLight position={[10, 10, 10]} intensity={2} color={BRAND.coral} penumbra={1} />
      <pointLight position={[-10, -10, -5]} intensity={1} color={BRAND.cerulean} />

      {/* Hero Section Objects */}
      <ParallaxCrystal position={[width * 0.3, 1.5, -2]} scale={1.8} color={BRAND.cerulean} speed={-0.2} shape="ico" />
      <ParallaxCrystal position={[-width * 0.35, -2, -3]} scale={1.4} color={BRAND.coral} speed={-0.1} shape="torus" />

      {/* Transition Area */}
      <ParallaxCrystal position={[width * 0.4, -height * 0.8, -4]} scale={2.5} color={BRAND.prussian} speed={0.1} shape="oct" />

      {/* Feature Section Objects */}
      <ParallaxCrystal position={[-width * 0.3, -height * 1.5, -2]} scale={1.5} color={BRAND.jasmine} speed={0.3} shape="ico" />
      <ParallaxCrystal position={[width * 0.2, -height * 2.2, -5]} scale={3} color={BRAND.cerulean} speed={0.1} shape="torus" />

      <Sparkles count={80} scale={[width, height * 4, 10]} size={4} speed={0.4} opacity={0.4} color={BRAND.cerulean} />
    </>
  );
};

// --- SECTIONS ---

const HeroSection = () => (
  <section id="home" className="w-full h-screen flex flex-col items-center justify-center p-6 relative">
    <motion.div 
      initial={{ opacity: 0, y: 30 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="max-w-4xl text-center z-10"
    >
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#05668A]/10 border border-[#05668A]/20 backdrop-blur-md mb-8">
        <span className="w-2 h-2 rounded-full bg-[#05668A] animate-pulse"></span>
        <span className="text-sm font-bold text-[#05668A] tracking-wide">2026 ENROLLMENTS OPEN</span>
      </div>

      <h1 className="text-5xl md:text-8xl font-black text-[#053A4E] mb-6 leading-[1.1] font-sinhala drop-shadow-sm">
        තාරුණ්‍යයේ <br/>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#05668A] via-[#05668A] to-[#EF8D8E]">
          ගිණුම් කරණ හඩ
        </span>
      </h1>

      <p className="text-xl md:text-2xl text-gray-500 font-sinhala mb-10 max-w-2xl mx-auto">
        "සරසවියට - පෙර සවිය" <br/>
        <span className="text-base text-gray-400 mt-2 block font-sans">
          The most trusted Online Accounting platform for A/L students in Sri Lanka.
        </span>
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button className="group relative px-8 py-4 bg-[#053A4E] text-white rounded-2xl font-bold text-lg overflow-hidden shadow-xl shadow-[#053A4E]/20 transition-all hover:scale-105 hover:shadow-2xl">
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#05668A] to-[#053A4E] opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center gap-3">
            <Play fill="currentColor" size={20} />
            Start Learning
          </div>
        </button>
        
        <button className="px-8 py-4 bg-white/60 backdrop-blur-md text-[#053A4E] border border-white rounded-2xl font-bold text-lg shadow-lg hover:bg-white transition-all flex items-center gap-2">
          View Courses <BookOpen size={20} />
        </button>
      </div>
    </motion.div>

    <motion.div 
      animate={{ y: [0, 10, 0] }} 
      transition={{ repeat: Infinity, duration: 2 }}
      className="absolute bottom-10 text-[#05668A]/40"
    >
      <ChevronDown size={32} />
    </motion.div>
  </section>
);

const AboutSection = () => (
  <section id="about" className="w-full min-h-screen flex items-center justify-center p-6">
    <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="bg-white/70 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/60 shadow-2xl shadow-[#05668A]/5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Star size={120} className="text-[#FFE787]" fill="currentColor" />
        </div>

        <h3 className="text-[#EF8D8E] font-bold tracking-widest uppercase text-sm mb-4">Our Mission</h3>
        <h2 className="text-4xl md:text-5xl font-bold text-[#053A4E] mb-6 font-sinhala leading-tight">
          ගිණුම්කරණයේ <br/><span className="text-[#05668A]">Online පෙරගමන්කරු</span>
        </h2>
        
        <p className="text-gray-600 text-lg leading-relaxed mb-8 font-sinhala text-justify">
          අපේ මූලික අරමුණ වන්නේ, සිසුන්ට Accounting විෂයයෙහි සාර්ථකව ප‍්‍රවේශ වීමට සහ ඒ මගින් ඔවුන්ගේ අනාගත වෘත්තිය සඳහා බලවත් පදනමක් ලබා දීමයි.
        </p>

        <ul className="space-y-4 mb-8">
          {[
            "සරල සිද්ධාන්ත පැහැදිලි කිරීම්",
            "ප්‍රායෝගික ගිණුම්කරණ දැනුම",
            "විභාග ඉලක්කගත ප්‍රශ්න පත්‍ර"
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-3 text-[#053A4E] font-medium font-sinhala">
              <CheckCircle2 className="text-[#05668A]" size={20} /> {item}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4 pt-6 border-t border-[#05668A]/10">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#05668A] to-[#053A4E] flex items-center justify-center text-white font-bold text-xl">
            KW
          </div>
          <div>
            <h4 className="font-bold text-[#053A4E] text-lg">Kalum Waduge</h4>
            <p className="text-sm text-[#EF8D8E]">BSc. Accounting (Sp) USJ</p>
          </div>
        </div>
      </motion.div>
      <div className="hidden lg:block h-full w-full"></div>
    </div>
  </section>
);

const FeatureSection = () => (
  <section id="features" className="w-full min-h-screen py-24 px-6 relative flex flex-col justify-center">
    <div className="container mx-auto max-w-6xl z-10">
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold text-[#053A4E] font-sinhala mb-4">ඇයි අපිව තෝරාගත යුත්තේ?</h2>
        <p className="text-gray-500">
          SL Accounting is designed to transform complex concepts into simple, understandable logic.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: BookOpen, title: "සරල ඉගැන්වීම්", desc: "සිසුන්ට පහසුවෙන් තේරුම් ගත හැකි සරල ඉගැන්වීම් ක්‍රමවේදය." },
          { icon: GraduationCap, title: "විභාග ජයග්‍රහණ", desc: "A සාමාර්ථයක් ඉලක්ක කරගත් විශේෂිත පුනරීක්ෂණ වැඩසටහන්." },
          { icon: Users, title: "Online සහාය", desc: "ඕනෑම වේලාවක සම්බන්ධ විය හැකි Online සහාය සේවාව." }
        ].map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.2, duration: 0.6 }}
            className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl border border-white shadow-xl hover:shadow-2xl hover:bg-white transition-all group"
          >
            <div className="w-16 h-16 bg-[#E8EFF7] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <feature.icon size={32} className="text-[#05668A]" />
            </div>
            <h3 className="text-xl font-bold text-[#053A4E] mb-3 font-sinhala">{feature.title}</h3>
            <p className="text-gray-600 font-sinhala leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const StatsBanner = () => (
  <section className="w-full py-20 bg-[#053A4E] text-white relative overflow-hidden">
    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
    <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
      {[
        { val: "1000+", label: "Students" },
        { val: "100%", label: "Syllabus Cover" },
        { val: "24/7", label: "LMS Access" },
        { val: "A+", label: "Results" },
      ].map((stat, i) => (
        <div key={i}>
          <h3 className="text-4xl md:text-5xl font-bold text-[#FFE787] mb-2">{stat.val}</h3>
          <p className="text-[#EF8D8E] uppercase tracking-widest text-xs font-bold">{stat.label}</p>
        </div>
      ))}
    </div>
  </section>
);

const Home = () => {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#E8EFF7] z-0">
      <Canvas shadows camera={{ position: [0, 0, 10], fov: 35 }} className="w-full h-full">
        <Suspense fallback={null}>
          {/* UPDATED PAGES TO 4: This tightens the scroll area so it stops right at the footer */}
          <ScrollControls pages={4} damping={0.3}>
            <ExperienceScene />
            
            <Scroll html style={{ width: '100%' }}>
              <HeroSection />
              <AboutSection />
              <FeatureSection />
              <StatsBanner />
              <Footer />
            </Scroll>
            
          </ScrollControls>
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Home;