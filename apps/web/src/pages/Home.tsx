import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Play,
  BookOpen,
  GraduationCap,
  Users,
  Star,
  ChevronDown,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BarChart3,
  Quote,
  Calculator,
  FileSpreadsheet,
  Layers,
} from "lucide-react";

import SettingService, { type SettingData } from "../services/SettingService";

import { type Variants } from "framer-motion";


// --- Animation Variants ---
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
};



import ReviewService from "../services/ReviewService";

type AnimationState = "hidden" | "walkingIn" | "speaking" | "walkingOut";

const fallbackTestimonials = [
  {
    _id: '1',
    student: { firstName: "Sanduni", lastName: "P." },
    role: "A/L 2024",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Sanduni",
    comment: "The progress dashboard changed everything for me! ❤️"
  },
  {
    _id: '2',
    student: { firstName: "Kasun", lastName: "D." },
    role: "A/L 2025",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Kasun",
    comment: "Rewatching lessons at 11pm before a paper saved me."
  },
  {
    _id: '3',
    student: { firstName: "Nethmi", lastName: "F." },
    role: "A/L 2024",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Nethmi",
    comment: "It genuinely feels like having a tutor on call 24/7. ✨"
  }
];

const WalkingTestimonials = ({ testimonials }: { testimonials: any[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animState, setAnimState] = useState<AnimationState>("hidden");

  useEffect(() => {
    if (animState === "hidden") {
      const t = setTimeout(() => setAnimState("walkingIn"), 1000);
      return () => clearTimeout(t);
    } else if (animState === "walkingIn") {
      const t = setTimeout(() => setAnimState("speaking"), 2500);
      return () => clearTimeout(t);
    } else if (animState === "speaking") {
      const t = setTimeout(() => setAnimState("walkingOut"), 4500);
      return () => clearTimeout(t);
    } else if (animState === "walkingOut") {
      const t = setTimeout(() => {
        setAnimState("hidden");
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [animState, testimonials.length]);

  if (!testimonials || testimonials.length === 0) return null;

  const current = testimonials[currentIndex];

  const containerVariants: Variants = {
    hidden: { x: "100vw", y: 0, opacity: 0 },
    walkingIn: {
      x: 0,
      y: [0, -15, 0],
      rotate: [0, -2, 0, 2, 0],
      opacity: 1,
      transition: {
        x: { duration: 2.5, ease: "linear" },
        y: { repeat: Infinity, duration: 0.4, ease: "easeInOut" },
        rotate: { repeat: Infinity, duration: 0.8, ease: "easeInOut" },
        opacity: { duration: 0.3 }
      }
    },
    speaking: {
      x: 0,
      y: [0, -3, 0],
      rotate: 0,
      opacity: 1,
      transition: {
        y: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
      }
    },
    walkingOut: {
      x: "100vw",
      y: [0, -15, 0],
      rotate: [0, -2, 0, 2, 0],
      opacity: 1,
      transition: {
        x: { duration: 2.5, ease: "linear" },
        y: { repeat: Infinity, duration: 0.4, ease: "easeInOut" },
        rotate: { repeat: Infinity, duration: 0.8, ease: "easeInOut" }
      }
    }
  };

  const imageVariants: Variants = {
    hidden: { scaleX: -1 },
    walkingIn: { scaleX: -1 },
    speaking: { scaleX: -1 },
    walkingOut: { scaleX: 1 }
  };

  const bubbleVariants: Variants = {
    hidden: { opacity: 0, scale: 0, transformOrigin: "bottom right" },
    walkingIn: { opacity: 0, scale: 0 },
    speaking: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", bounce: 0.5, duration: 0.6 }
    },
    walkingOut: {
      opacity: 0,
      scale: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="absolute bottom-0 right-0 w-full h-[600px] pointer-events-none overflow-hidden z-30">
      <motion.div
        className="absolute bottom-10 right-[-10%] sm:right-[5%] flex flex-col items-end"
        variants={containerVariants}
        initial="hidden"
        animate={animState}
      >
        {/* Speech Bubble */}
        <motion.div
          variants={bubbleVariants}
          className="bg-white/95 backdrop-blur-md rounded-3xl rounded-br-none shadow-2xl border border-brand-aliceBlue p-5 sm:p-6 mb-2 w-[260px] sm:w-[300px] pointer-events-auto mr-16"
        >
          <Quote size={20} className="text-brand-coral/40 absolute top-4 right-4" />
          <p className="text-brand-prussian/90 text-sm sm:text-base italic font-medium font-sans mb-4 leading-relaxed pr-6">
            "{current.comment}"
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-cerulean to-brand-prussian flex items-center justify-center text-white font-bold text-sm shadow-md">
              {current.student?.firstName?.charAt(0) || "S"}
            </div>
            <div>
              <h4 className="text-brand-prussian font-bold text-xs sm:text-sm">{current.student?.firstName} {current.student?.lastName}</h4>
              <p className="text-brand-coral font-bold text-[10px] sm:text-xs tracking-wider uppercase">{current.student?.batch?.name || current.role || 'Student'}</p>
            </div>
          </div>
        </motion.div>

        {/* Character Image */}
        <motion.div variants={imageVariants} className="w-40 h-48 sm:w-56 sm:h-64 relative mr-8 drop-shadow-2xl">
          <img
            src={current.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${current.student?.firstName || 'Student'}`}
            alt="Student walking"
            className="w-full h-full object-contain"
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

const getApiOrigin = () => {
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
  try {
    return new URL(API_BASE).origin;
  } catch {
    return "http://localhost:3000";
  }
};

// --- Small shared "product UI" primitives ---
// These two components are the visual signature of the redesign: a ledger-style
// progress row and a count-up figure, used across the hero, dashboard preview,
// and stats banner to make the page read like a real LMS product, not a brochure.

const Counter = ({
  value,
  suffix = "",
  duration = 1.4,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, duration]);

  return (
    <span ref={ref} className="font-mono tabular-nums">
      {display.toLocaleString()}
      {suffix}
    </span>
  );
};

const HeroSection = ({ heroImageUrl, testimonials }: { heroImageUrl?: string | null, testimonials: any[] }) => (
  <header
    id="home"
    className="relative w-full min-h-[100dvh] flex items-center justify-center pt-28 pb-12 overflow-hidden bg-[#FAFCFF]"
  >
    {/* Dynamic Background */}
    <div className="absolute inset-0 w-full h-full">
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#053A4E_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03]"></div>

      {/* Animated Orbs */}
      <motion.div
        animate={{ x: [0, 50, 0], y: [0, -50, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-brand-cerulean/20 rounded-full blur-[100px] mix-blend-multiply opacity-60"
      />
      <motion.div
        animate={{ x: [0, -40, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] bg-brand-coral/15 rounded-full blur-[120px] mix-blend-multiply opacity-60"
      />
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute top-[20%] right-[15%] w-[25vw] h-[25vw] bg-brand-jasmine/20 rounded-full blur-[80px] mix-blend-multiply opacity-50"
      />
    </div>

    <div className="container mx-auto max-w-7xl px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center relative z-10">

      {/* Left Typography Column (7 columns wide on lg) */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start pt-10"
      >
        <motion.div variants={fadeInUp} className="group relative inline-flex items-center justify-center mb-6 sm:mb-8">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-cerulean via-brand-coral to-brand-cerulean opacity-50 blur-md group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="relative inline-flex items-center gap-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white/90 backdrop-blur-md border border-white/60 shadow-sm">
            <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-full w-full bg-green-600"></span>
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-brand-prussian tracking-widest uppercase font-sans">
              2027 · 2028 Enrollments Open
            </span>
          </div>
        </motion.div>

        <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl md:text-7xl lg:text-[5rem] font-black text-brand-prussian leading-[1.1] mb-6 font-sinhala tracking-tight drop-shadow-sm">
          A ලෙවල් 1ට <br />
          <span className="relative inline-block mt-2">
            <span className="absolute -inset-1 bg-gradient-to-r from-brand-cerulean/20 to-brand-coral/20 blur-xl opacity-60 rounded-full"></span>
            <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-brand-cerulean via-brand-prussian to-brand-coral">
              Online Accounting
            </span>
          </span>
        </motion.h1>

        <motion.p variants={fadeInUp} className="text-base sm:text-lg md:text-xl text-brand-prussian/70 font-sinhala mb-8 max-w-2xl leading-relaxed px-4 sm:px-0 border-l-4 border-brand-coral/60 pl-4 py-1 italic shadow-sm bg-white/40 backdrop-blur-sm rounded-r-xl">
          "වැඩ වැඩ වැඩ එක්ක හදවතට Accounting"
        </motion.p>

        <motion.p variants={fadeInUp} className="text-sm sm:text-base text-gray-500 mb-8 sm:mb-10 max-w-xl font-sans px-2 sm:px-0 leading-relaxed">
          A full learning dashboard for A/L Accounting — video lessons, live progress tracking, and past-paper practice, all in one place.
        </motion.p>

        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0 mb-12">
          <Link
            to="/register"
            className="group relative px-8 py-4 sm:px-10 sm:py-4 bg-brand-prussian text-white rounded-2xl font-bold text-lg overflow-hidden shadow-2xl shadow-brand-prussian/30 transition-transform active:scale-95 hover:-translate-y-1 w-full sm:w-auto text-center"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-brand-cerulean to-brand-prussian opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center gap-3 font-sans">
              <Play fill="currentColor" size={18} className="group-hover:scale-110 transition-transform" /> Start Learning
            </div>
          </Link>
          <Link
            to="/classes"
            className="group px-8 py-4 sm:px-10 sm:py-4 bg-white/70 backdrop-blur-md text-brand-prussian border-2 border-white rounded-2xl font-bold text-lg shadow-lg hover:bg-white transition-all active:scale-95 hover:-translate-y-1 flex items-center justify-center gap-2 font-sans w-full sm:w-auto"
          >
            View Classes <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </motion.div>

        <motion.div variants={fadeInUp} className="flex items-center justify-center lg:justify-start gap-8 sm:gap-12 px-2 pb-6">
          <div className="flex flex-col items-center lg:items-start">
            <span className="text-3xl sm:text-4xl font-black text-brand-prussian font-mono tracking-tighter">
              <Counter value={1000} suffix="+" />
            </span>
            <span className="text-[10px] sm:text-[11px] text-gray-500 font-sans uppercase tracking-widest mt-1 font-bold">Students</span>
          </div>
          <div className="w-px h-10 bg-brand-prussian/15 rounded-full"></div>
          <div className="flex flex-col items-center lg:items-start">
            <span className="text-3xl sm:text-4xl font-black text-brand-prussian font-mono tracking-tighter">
              <Counter value={98} suffix="%" />
            </span>
            <span className="text-[10px] sm:text-[11px] text-gray-500 font-sans uppercase tracking-widest mt-1 font-bold">Pass Rate</span>
          </div>
          <div className="w-px h-10 bg-brand-prussian/15 rounded-full"></div>
          <div className="flex flex-col items-center lg:items-start">
            <div className="flex items-center gap-1.5 text-3xl sm:text-4xl font-black text-brand-prussian font-mono tracking-tighter">
              4.9 <Star className="text-brand-jasmine mb-1" fill="currentColor" size={20} />
            </div>
            <span className="text-[10px] sm:text-[11px] text-gray-500 font-sans uppercase tracking-widest mt-1 font-bold">Rating</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Right Interactive Image Column (5 columns wide on lg) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
        whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, type: "spring", bounce: 0.3 }}
        className="lg:col-span-5 relative flex justify-center mt-12 lg:mt-0"
        style={{ perspective: "1000px" }}
      >
        <div className="relative w-full max-w-[340px] sm:max-w-[420px]">
          {/* Glow Behind Image */}
          <div className="absolute -inset-6 bg-gradient-to-tr from-brand-cerulean to-brand-coral opacity-30 blur-3xl rounded-[3rem] -z-10 animate-blob"></div>

          <motion.div
            whileHover={{ rotateY: -5, rotateX: 5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative w-full aspect-[4/5] bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-3 shadow-2xl border border-white/80"
          >
            <div className="w-full h-full rounded-[2rem] overflow-hidden relative bg-gray-200 group">
              <img
                src={heroImageUrl ? `${getApiOrigin()}${heroImageUrl}` : "Kalum_Hero.jpeg"}
                alt="Kalum Waduge"
                loading="eager"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-prussian/90 via-brand-prussian/20 to-transparent opacity-90"></div>

              <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8">
                <div className="inline-flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-brand-jasmine animate-ping"></span>
                  <span className="text-brand-jasmine text-[10px] font-bold tracking-widest uppercase font-sans">
                    Your Instructor
                  </span>
                </div>
                <h3 className="text-white text-2xl sm:text-3xl font-black font-sans tracking-tight">Kalum Waduge</h3>
                <p className="text-white/80 text-sm font-sans mt-1">BSc. Accounting (Sp) USJP</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>

    <motion.div
      animate={{ y: [0, 8, 0] }}
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      className="absolute bottom-6 text-brand-prussian/30 hidden md:flex flex-col items-center gap-2 cursor-pointer hover:text-brand-cerulean transition-colors z-20"
      onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
    >
      <span className="text-[10px] font-bold tracking-widest uppercase font-sans">Scroll</span>
      <ChevronDown size={24} />
    </motion.div>
    <WalkingTestimonials testimonials={testimonials} />
  </header>
);

const AboutSection = () => (
  <section id="about" className="w-full py-16 sm:py-24 px-4 sm:px-6 bg-white relative overflow-hidden">
    <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="bg-brand-aliceBlue/50 backdrop-blur-xl p-6 sm:p-12 rounded-[2rem] border border-brand-cerulean/10 shadow-2xl shadow-brand-prussian/5 relative overflow-hidden group hover:border-brand-cerulean/30 transition-colors duration-500"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
          <Calculator size={120} className="text-brand-cerulean" />
        </div>
        <h3 className="text-brand-coral font-bold tracking-widest uppercase text-xs sm:text-sm mb-4 font-sans">
          Our Mission
        </h3>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-brand-prussian mb-6 font-sinhala leading-tight">
          ගිණුම්කරණයේ <br />
          <span className="text-brand-cerulean text-2xl sm:text-4xl">Online පෙරගමන්කරු</span>
        </h2>
        <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-8 font-sinhala text-justify">
          සිසුන්ට Accounting විෂයයෙහි විශ්වාසය සහ නිපුණතාව ලබා දී, ඔවුන්ගේ අනාගතයේ දී ඉහළ ප්‍රතිඵල ලබා ගැනීමට අත්වැල්
          පිරිනැමීම මඟින් සරසවි ප්‍රවේශයට මග පෙන්වීම
        </p>
        <ul className="space-y-3 sm:space-y-4 mb-8">
          {["සරල සිද්ධාන්ත පැහැදිලි කිරීම්", "ප්‍රායෝගික ගිණුම්කරණ දැනුම", "විභාග ඉලක්කගත ප්‍රශ්න පත්‍ර"].map(
            (item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 text-brand-prussian font-bold font-sinhala bg-white p-3 rounded-xl shadow-sm border border-transparent hover:border-brand-cerulean/20 transition-all text-sm sm:text-base"
              >
                <CheckCircle2 className="text-brand-cerulean flex-shrink-0" size={18} /> {item}
              </motion.li>
            )
          )}
        </ul>
        <div className="flex items-center gap-4 pt-6 border-t border-brand-prussian/10">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-brand-cerulean to-brand-prussian flex items-center justify-center text-white font-bold text-lg sm:text-xl font-sans shadow-lg">
            KW
          </div>
          <div>
            <h4 className="font-bold text-brand-prussian text-base sm:text-lg font-sans">Kalum Waduge</h4>
            <p className="text-xs sm:text-sm text-brand-coral font-sans font-medium">BSc. Accounting (Sp) USJP</p>
          </div>
        </div>
      </motion.div>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="flex flex-col gap-6"
      >
        <motion.div
          variants={fadeInUp}
          className="p-6 sm:p-8 rounded-[2rem] bg-brand-prussian text-white shadow-xl hover:translate-x-2 transition-transform duration-300"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
            <GraduationCap size={28} className="text-brand-jasmine" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold mb-2 font-sans">Top Island Rankers</h3>
          <p className="text-white/80 font-sans leading-relaxed text-sm sm:text-base">
            Consistent track record of producing District and Island ranks every single year.
          </p>
        </motion.div>
        <motion.a
          href="https://whatsapp.com/channel/0029Va5mmNGJf05WQhSOTn1W"
          target="_blank"
          rel="noopener noreferrer"
          variants={fadeInUp}
          className="block p-6 sm:p-8 rounded-[2rem] bg-brand-aliceBlue border border-brand-cerulean/20 shadow-lg hover:translate-x-2 transition-transform duration-300"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-coral/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
            <Users size={28} className="text-brand-coral" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-brand-prussian mb-2 font-sans flex items-center justify-between">
            Active Community
            <ArrowRight size={20} className="text-brand-cerulean" />
          </h3>
          <p className="text-gray-600 font-sans leading-relaxed text-sm sm:text-base">
            Join a network of thousands of students striving for excellence together. Click to join our WhatsApp channel.
          </p>
        </motion.a>
      </motion.div>
    </div>
  </section>
);

// Signature section: a browser-chrome mockup of the actual student dashboard,
// built around a "ledger" visual language (progress rows, mono figures) so it
// reads as a real accounting-LMS product rather than a generic SaaS screenshot.
const DashboardPreviewSection = () => {
  const youtubeLinks = [
    "https://www.youtube.com/embed/NxeVtENI6ns?si=Dj1plsOSde0cSiIg",
    "https://www.youtube.com/embed/AEj1xpnpISc?si=LmULx1YYZNgAG3bw",
    "https://www.youtube.com/embed/1x9cifc7aa8?si=ChKkbjX51hHmCxX-",
    "https://www.youtube.com/embed/Uk3aPqX_8-g?si=bar4sO3rknALMrqB",
    "https://www.youtube.com/embed/ia63S3YOJi8?si=LU1acEBXMb2hriJR",
  ];

  const [randomLink, setRandomLink] = useState("");

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * youtubeLinks.length);
    setRandomLink(youtubeLinks[randomIndex]);
  }, []);

  return (
    <section id="dashboard" className="w-full py-16 sm:py-24 px-4 sm:px-6 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-brand-coral font-bold tracking-widest uppercase text-xs sm:text-sm font-sans">
            Inside the LMS
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-brand-prussian font-sinhala mt-3 mb-4 sm:mb-6">
            Our YouTube Lessons
          </h2>
          <p className="text-gray-500 font-sans text-base sm:text-lg">
            Free high-quality lessons and live streams directly from our YouTube channel.
          </p>
        </div>

        <motion.div
          variants={scaleIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="relative rounded-[1.75rem] sm:rounded-[2.25rem] bg-brand-aliceBlue/40 border border-brand-cerulean/10 shadow-2xl shadow-brand-prussian/5 p-2.5 sm:p-4 overflow-hidden max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-1.5 px-3 py-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-coral/50"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-brand-jasmine/60"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-brand-cerulean/50"></span>
            <span className="ml-3 text-[10px] sm:text-xs text-brand-prussian/40 font-mono">
              youtube.com
            </span>
          </div>

          <div className="w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden relative">
            {randomLink && (
              <iframe
                className="absolute inset-0 w-full h-full"
                src={randomLink}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const CurriculumSection = () => {
  const units = [
    { num: "01", title: "ගිණුම්කරණයට හැඳින්වීම", subtitle: "Grade 12", icon: BookOpen },
    { num: "02", title: "ගිණුම්කරණ සමීකරණය", subtitle: "Grade 12", icon: Layers },
    { num: "03", title: "ද්විත්ව සටහන් ක්‍රමය", subtitle: "Grade 12", icon: Users },
    { num: "04", title: "මූලික පොත්, බැංකු සැසඳුම්", subtitle: "Grade 12", icon: FileSpreadsheet },
    { num: "05", title: "ගිණුම්කරණ සංකල්ප", subtitle: "Grade 12", icon: Calculator },
    { num: "06", title: "තනි පුද්ගල ව්‍යාපාර ගැලපිලි", subtitle: "Grade 12", icon: BarChart3 },
    { num: "07", title: "නිෂ්පාදන පිරිවැය", subtitle: "Grade 12", icon: Layers },
    { num: "08", title: "අසම්පූර්ණ සටහන්", subtitle: "Grade 12", icon: BookOpen },
    { num: "09", title: "ලාභ අරමුණු කර නොගත්", subtitle: "Grade 12", icon: Users },
    { num: "10", title: "හවුල් ව්‍යාපාර", subtitle: "Grade 12", icon: Calculator },
    { num: "11", title: "ගිණුම්කරණ ප්‍රමිත", subtitle: "Grade 13", icon: BookOpen },
    { num: "12", title: "සමාගම් ගිණුම්කරණය", subtitle: "Grade 13", icon: FileSpreadsheet },
    { num: "13", title: "ගිණුම්කරණ අනුපාත", subtitle: "Grade 13", icon: BarChart3 },
    { num: "14", title: "පිරිවැය හා කළමනාකරණ", subtitle: "Grade 13", icon: Calculator },
    { num: "15", title: "ව්‍යාපෘති ඇගයීම", subtitle: "Grade 13", icon: Layers },
    { num: "16", title: "පරිගණක ගිණුම්කරණය", subtitle: "Grade 13", icon: BookOpen },
  ];

  const grade12Units = units.filter(u => u.subtitle === "Grade 12");
  const grade13Units = units.filter(u => u.subtitle === "Grade 13");

  const renderUnitCard = (unit: any, idx: number) => (
    <motion.div
      key={idx}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (idx % 4) * 0.1, duration: 0.5 }}
      className="bg-white p-6 sm:p-7 rounded-[1.75rem] border border-gray-100 shadow-lg hover:shadow-2xl transition-all group hover:-translate-y-1.5 relative overflow-hidden flex flex-col h-full"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-brand-aliceBlue text-brand-cerulean rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-brand-cerulean group-hover:text-white transition-all duration-300">
          <unit.icon size={24} />
        </div>
        <span className="text-3xl sm:text-4xl font-black text-brand-prussian/10 font-mono group-hover:text-brand-coral/20 transition-colors">
          {unit.num}
        </span>
      </div>
      <div className="flex-1">
        <h3 className="text-lg sm:text-xl font-bold text-brand-prussian mb-1.5 font-sinhala leading-tight">{unit.title}</h3>
      </div>
      <p className="text-brand-coral text-xs sm:text-sm font-bold font-sans mt-2">{unit.subtitle}</p>
    </motion.div>
  );

  return (
    <section
      id="features"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-brand-aliceBlue/30 to-white"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
          <span className="text-brand-coral font-bold tracking-widest uppercase text-xs sm:text-sm font-sans">
            Full Syllabus
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-brand-prussian font-sinhala mt-3 mb-4 sm:mb-6">
            සම්පූර්ණ විෂය නිර්දේශය
          </h2>
          <p className="text-gray-500 font-sans text-base sm:text-lg">
            Every unit on the A/L Accounting syllabus, broken into short video lessons, notes, and practice
            questions.
          </p>
        </div>

        <div className="mb-12">
          <h3 className="text-2xl font-bold text-brand-prussian font-sans mb-6 border-b-2 border-brand-aliceBlue pb-3 inline-block">Grade 12</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {grade12Units.map((unit, idx) => renderUnitCard(unit, idx))}
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-brand-prussian font-sans mb-6 border-b-2 border-brand-aliceBlue pb-3 inline-block">Grade 13</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {grade13Units.map((unit, idx) => renderUnitCard(unit, idx))}
          </div>
        </div>
      </div>
    </section>
  );
};

const ProcessSection = () => {
  const steps = [
    { num: "01", title: "Enroll Online", desc: "Sign up in minutes and get instant access — no waiting for a physical class seat." },
    { num: "02", title: "Learn on the LMS", desc: "Work through video lessons, notes, and quizzes at your own pace, any time of day." },
    { num: "03", title: "Track & Improve", desc: "Sit past papers and mock exams, and watch your progress dashboard fill in in real time." },
  ];
  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 bg-brand-prussian relative overflow-hidden">
      <div className="absolute -left-24 top-0 w-72 h-72 bg-brand-cerulean rounded-full blur-[120px] opacity-20"></div>
      <div className="absolute -right-24 bottom-0 w-72 h-72 bg-brand-coral rounded-full blur-[120px] opacity-20"></div>
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-brand-jasmine font-bold tracking-widest uppercase text-xs sm:text-sm font-sans">
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white font-sinhala mt-3">තුන් පියවරකින් ආරම්භය</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.5 }}
              className="relative"
            >
              <span className="text-5xl sm:text-6xl font-black text-white/10 font-mono">{step.num}</span>
              <h3 className="text-xl sm:text-2xl font-bold text-white mt-2 mb-3 font-sans">{step.title}</h3>
              <p className="text-white/60 font-sans leading-relaxed text-sm sm:text-base">{step.desc}</p>
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 -right-3 w-6 h-px bg-white/20"></div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TestimonialsSection = ({ testimonials }: { testimonials: any[] }) => {
  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-brand-coral font-bold tracking-widest uppercase text-xs sm:text-sm font-sans">
            Student Voices
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-brand-prussian font-sinhala mt-3">
            සිසුන් කියන කතාව
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.slice(0, 6).map((q, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.12, duration: 0.5 }}
              className="bg-brand-aliceBlue/40 border border-brand-cerulean/10 rounded-[1.75rem] p-6 sm:p-7 relative"
            >
              <Quote size={28} className="text-brand-cerulean/20 mb-3" fill="currentColor" />
              <p className="text-brand-prussian/80 font-sans text-sm sm:text-base leading-relaxed mb-5">{q.comment}</p>
              <div className="flex items-center gap-3 pt-4 border-t border-brand-prussian/10">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-cerulean to-brand-prussian flex items-center justify-center text-white font-bold text-xs font-sans uppercase">
                  {q.student?.firstName?.[0] || "S"}
                </div>
                <div>
                  <p className="font-bold text-brand-prussian text-sm font-sans">{q.student?.firstName} {q.student?.lastName}</p>
                  <p className="text-xs text-gray-400 font-sans uppercase">{q.student?.batch?.name || 'Student'}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const StatsBanner = () => {
  const stats: { val?: number; suffix?: string; label: string; staticVal?: string }[] = [
    { val: 1000, suffix: "+", label: "Students" },
    { val: 100, suffix: "%", label: "Syllabus Cover" },
    { val: 24, suffix: "/7", label: "LMS Access" },
    { staticVal: "A+", label: "Results" },
  ];
  return (
    <section className="w-full py-16 sm:py-20 bg-brand-prussian text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px]"></div>
      <div className="absolute -left-20 top-0 w-64 h-64 bg-brand-cerulean rounded-full blur-[100px] opacity-20"></div>
      <div className="absolute -right-20 bottom-0 w-64 h-64 bg-brand-coral rounded-full blur-[100px] opacity-20"></div>

      <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 text-center relative z-10">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="flex flex-col items-center justify-center"
          >
            <h3 className="text-3xl sm:text-4xl md:text-6xl font-black text-brand-jasmine mb-2 font-mono tracking-tight">
              {stat.staticVal ? stat.staticVal : <Counter value={stat.val as number} suffix={stat.suffix} />}
            </h3>
            <p className="text-brand-coral uppercase tracking-widest text-[10px] sm:text-xs font-bold font-sans">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const FinalCtaSection = () => (
  <section className="w-full py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-br from-brand-aliceBlue via-white to-brand-aliceBlue relative overflow-hidden">
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="container mx-auto max-w-4xl text-center relative z-10"
    >
      <Sparkles size={32} className="text-brand-coral mx-auto mb-5" />
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-brand-prussian font-sinhala mb-5 leading-tight">
        ඔබේ A ලකුණ අද ආරම්භ කරන්න
      </h2>
      <p className="text-gray-500 font-sans text-base sm:text-lg mb-8 max-w-xl mx-auto">
        Join over a thousand students already tracking their accounting mastery on SL Accounting's LMS.
      </p>
      <Link
        to="/register"
        className="inline-flex items-center gap-3 px-8 py-4 bg-brand-prussian text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-prussian/20 hover:scale-105 active:scale-95 transition-transform font-sans"
      >
        <Play fill="currentColor" size={18} /> Start Learning
      </Link>
    </motion.div>
  </section>
);


const Home = () => {
  const [settings, setSettings] = useState<SettingData | null>(null);
  const [testimonials, setTestimonials] = useState<any[]>(fallbackTestimonials);

  useEffect(() => {
    SettingService.getSettings()
      .then((res) => {
        if (res.success) {
          setSettings(res.data);
        }
      })
      .catch(console.error);

    ReviewService.getApprovedReviews()
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setTestimonials(res.data);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen w-full relative bg-white selection:bg-brand-cerulean selection:text-white">
      <HeroSection heroImageUrl={settings?.heroImageUrl} testimonials={testimonials} />
      <AboutSection />
      <DashboardPreviewSection />
      <CurriculumSection />
      <ProcessSection />
      <TestimonialsSection testimonials={testimonials} />
      <StatsBanner />
      <FinalCtaSection />
    </div>
  );
};

export default Home;