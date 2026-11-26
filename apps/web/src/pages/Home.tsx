import { useEffect, useRef, useState, useMemo } from "react";
import { motion, useInView, animate, AnimatePresence, type Variants } from "framer-motion";
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
  Clock,
  Megaphone,
  ExternalLink,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Award,
  Youtube,
} from "lucide-react";

import SettingService, { type SettingData } from "../services/SettingService";
import ReviewService from "../services/ReviewService";

// --- Animation Variants ---
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.55, ease: "easeOut" } },
};

// --- Data ---
const YOUTUBE_LINKS = [
  "https://www.youtube.com/embed/NxeVtENI6ns?si=Dj1plsOSde0cSiIg",
  "https://www.youtube.com/embed/AEj1xpnpISc?si=LmULx1YYZNgAG3bw",
  "https://www.youtube.com/embed/1x9cifc7aa8?si=ChKkbjX51hHmCxX-",
  "https://www.youtube.com/embed/Uk3aPqX_8-g?si=bar4sO3rknALMrqB",
  "https://www.youtube.com/embed/ia63S3YOJi8?si=LU1acEBXMb2hriJR",
];

const FALLBACK_TESTIMONIALS = [
  {
    _id: "1",
    student: { firstName: "Sanduni", lastName: "Perera", batch: { name: "A/L 2025" } },
    comment: "The progress dashboard and structured unit breakdown changed everything for me! Tracking my weak areas became effortless.",
  },
  {
    _id: "2",
    student: { firstName: "Kasun", lastName: "Dissanayake", batch: { name: "A/L 2026" } },
    comment: "Rewatching company accounts and adjustments at 11 PM before a paper saved me. Explanations are crystal clear.",
  },
  {
    _id: "3",
    student: { firstName: "Nethmi", lastName: "Fernando", batch: { name: "A/L 2025" } },
    comment: "From double-entry basics to past paper speed drills, it genuinely feels like having a mentor guiding every step.",
  },
];

const SYLLABUS_UNITS = [
  { num: "01", title: "ගිණුම්කරණයට හැඳින්වීම", grade: "Grade 12", icon: BookOpen },
  { num: "02", title: "ගිණුම්කරණ සමීකරණය", grade: "Grade 12", icon: Layers },
  { num: "03", title: "ද්විත්ව සටහන් ක්‍රමය", grade: "Grade 12", icon: Users },
  { num: "04", title: "මූලික පොත්, බැංකු සැසඳුම්, පාලන ගිණුම්, වැරැදි නිවැරදි කිරීම්", grade: "Grade 12", icon: FileSpreadsheet },
  { num: "05", title: "ගිණුම්කරණ සංකල්ප", grade: "Grade 12", icon: Calculator },
  { num: "06", title: "තනි පුද්ගල ව්‍යාපාර ගැලපිලි", grade: "Grade 12", icon: BarChart3 },
  { num: "07", title: "නිෂ්පාදන පිරිවැය", grade: "Grade 12", icon: Layers },
  { num: "08", title: "අසම්පූර්ණ සටහන්", grade: "Grade 12", icon: BookOpen },
  { num: "09", title: "ලාභ අරමුණු කර නොගත්", grade: "Grade 12", icon: Users },
  { num: "10", title: "හවුල් ව්‍යාපාර", grade: "Grade 12", icon: Calculator },
  { num: "11", title: "ගිණුම්කරණ ප්‍රමිත", grade: "Grade 13", icon: BookOpen },
  { num: "12", title: "සමාගම් ගිණුම්කරණය", grade: "Grade 13", icon: FileSpreadsheet },
  { num: "13", title: "ගිණුම්කරණ අනුපාත", grade: "Grade 13", icon: BarChart3 },
  { num: "14", title: "කළමණාකරණ ගිණුම්කරණය", grade: "Grade 13", icon: Calculator },
  { num: "15", title: "ආන්තික පිරිවැය", grade: "Grade 13", icon: Layers },
  { num: "16", title: "ආයෝජන තීරණ", grade: "Grade 13", icon: BookOpen },
];

const getApiOrigin = () => {
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:3000/api/v1";
  try {
    return new URL(API_BASE).origin;
  } catch {
    return "http://localhost:3000";
  }
};

// --- Shared UI Primitives ---

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

// Live Countdown Hook (connects to AdminSettings examDate)
function useCountdown(targetDateStr?: string | null) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!targetDateStr) {
      setTimeLeft(null);
      return;
    }
    const targetMs = new Date(targetDateStr).getTime();
    if (isNaN(targetMs)) {
      setTimeLeft(null);
      return;
    }

    const update = () => {
      const diff = targetMs - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [targetDateStr]);

  return timeLeft;
}

// --- 1. HERO SECTION ---

const HeroSection = ({
  settings,
  testimonials,
}: {
  settings: SettingData | null;
  testimonials: any[];
}) => {
  const countdown = useCountdown(settings?.examDate);
  const [activeQuoteIdx, setActiveQuoteIdx] = useState(0);

  // Auto-cycle student voice card every 6s
  useEffect(() => {
    if (testimonials.length <= 1) return;
    const interval = setInterval(() => {
      setActiveQuoteIdx((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  const currentReview = testimonials[activeQuoteIdx] || testimonials[0];
  const heroSrc = settings?.heroImageUrl
    ? settings.heroImageUrl.startsWith("http")
      ? settings.heroImageUrl
      : `${getApiOrigin()}${settings.heroImageUrl.startsWith("/") ? "" : "/"
      }${settings.heroImageUrl}`
    : "Kalum_Hero.jpeg";

  return (
    <header
      id="home"
      className="relative w-full min-h-[100dvh] flex items-center justify-center pt-28 pb-16 overflow-hidden bg-[#FAFCFF]"
    >
      {/* Subtle Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#053A4E_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.035]" />
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -35, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -left-24 w-[42vw] h-[42vw] bg-brand-cerulean/15 rounded-full blur-[110px]"
        />
        <motion.div
          animate={{ x: [0, -35, 0], y: [0, 45, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-28 -right-20 w-[45vw] h-[45vw] bg-brand-coral/12 rounded-full blur-[120px]"
        />
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
        {/* LEFT COLUMN: Value Proposition & CTAs */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start"
        >
          {/* Dynamic News Ticker (if configured in Admin Settings) */}
          {settings?.newsTitle && (
            <motion.div variants={fadeInUp} className="mb-4 max-w-full">
              {settings.newsLink ? (
                <a
                  href={settings.newsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-prussian text-white text-xs font-medium shadow-md hover:bg-brand-cerulean transition-colors max-w-full"
                >
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-jasmine text-brand-prussian text-[10px] font-extrabold uppercase tracking-wider shrink-0">
                    <Megaphone size={11} /> News
                  </span>
                  <span className="truncate font-sinhala">
                    {settings.newsTitle}
                  </span>
                  <ExternalLink size={12} className="shrink-0 opacity-80" />
                </a>
              ) : (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-aliceBlue border border-brand-cerulean/20 text-brand-prussian text-xs font-semibold max-w-full">
                  <Megaphone size={13} className="text-brand-cerulean shrink-0" />
                  <span className="truncate font-sinhala">
                    {settings.newsTitle}
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* Enrollment Status Pill */}
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-slate-200/80 shadow-sm mb-6"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
            </span>
            <span className="text-[11px] font-bold text-brand-prussian tracking-widest uppercase font-sans">
              2027 · 2028 A/L Enrollments Open
            </span>
          </motion.div>

          {/* Main Sinhala Headline */}
          <motion.h1
            variants={fadeInUp}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-[4.85rem] font-black text-brand-prussian leading-[1.08] mb-5 font-sinhala tracking-tight"
          >
            A ලෙවල් 1ට <br />
            <span className="relative inline-block mt-1">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cerulean via-brand-prussian to-brand-coral">
                Online Accounting
              </span>
            </span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            variants={fadeInUp}
            className="text-base sm:text-lg md:text-xl text-brand-prussian/80 font-sinhala mb-5 max-w-xl leading-relaxed border-l-4 border-brand-coral pl-4 py-1 bg-white/70 backdrop-blur-sm rounded-r-xl shadow-sm"
          >
            "වැඩ වැඩ වැඩ එක්ක හදවතට Accounting"
          </motion.p>

          <motion.p
            variants={fadeInUp}
            className="text-sm sm:text-base text-slate-500 mb-8 max-w-xl font-sans leading-relaxed"
          >
            Sri Lanka’s complete A/L Accounting LMS — structured video lessons, live timed exams, instant answer keys, and real-time mastery tracking.
          </motion.p>

          {/* Live Exam Countdown Banner (if configured in Admin Settings) */}
          {countdown && (
            <motion.div
              variants={fadeInUp}
              className="mb-8 inline-flex flex-wrap items-center gap-3 bg-white border border-slate-200/80 rounded-2xl px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-brand-prussian font-sinhala">
                <Clock size={16} className="text-brand-coral" />
                <span>විභාගයට තව:</span>
              </div>
              <div className="flex items-center gap-2 font-mono tabular-nums text-xs">
                {[
                  { val: countdown.days, label: "දින" },
                  { val: countdown.hours, label: "පැය" },
                  { val: countdown.minutes, label: "මිනි" },
                  { val: countdown.seconds, label: "තත්" },
                ].map((unit) => (
                  <div
                    key={unit.label}
                    className="px-2.5 py-1 rounded-lg bg-brand-aliceBlue text-brand-prussian font-bold flex items-baseline gap-1"
                  >
                    <span className="text-sm">
                      {String(unit.val).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] font-sinhala text-brand-cerulean">
                      {unit.label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Primary & Secondary CTAs */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto mb-10"
          >
            <Link
              to="/register"
              className="group relative px-8 py-4 bg-brand-prussian hover:bg-brand-cerulean text-white rounded-2xl font-bold text-base shadow-xl shadow-brand-prussian/20 transition-all duration-200 active:scale-[0.98] hover:-translate-y-0.5 flex items-center justify-center gap-2.5 font-sans"
            >
              <Play fill="currentColor" size={16} />
              <span>Start Learning Free</span>
            </Link>
            <Link
              to="/classes"
              className="group px-8 py-4 bg-white text-brand-prussian border border-slate-200/90 hover:border-brand-cerulean/40 rounded-2xl font-bold text-base shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] hover:-translate-y-0.5 flex items-center justify-center gap-2 font-sans"
            >
              <span>Explore Classes</span>
              <ArrowRight
                size={17}
                className="group-hover:translate-x-1 transition-transform text-brand-cerulean"
              />
            </Link>
          </motion.div>

          {/* Key Proof Metrics */}
          <motion.div
            variants={fadeInUp}
            className="flex items-center justify-center lg:justify-start gap-7 sm:gap-10"
          >
            <div>
              <span className="text-2xl sm:text-3xl font-black text-brand-prussian">
                <Counter value={1000} suffix="+" />
              </span>
              <p className="text-[11px] text-slate-400 font-sans uppercase tracking-wider font-bold mt-0.5">
                Active Students
              </p>
            </div>
            <div className="w-px h-9 bg-slate-200" />
            <div>
              <span className="text-2xl sm:text-3xl font-black text-brand-prussian">
                <Counter value={98} suffix="%" />
              </span>
              <p className="text-[11px] text-slate-400 font-sans uppercase tracking-wider font-bold mt-0.5">
                Pass Rate
              </p>
            </div>
            <div className="w-px h-9 bg-slate-200" />
            <div>
              <div className="flex items-center gap-1 text-2xl sm:text-3xl font-black text-brand-prussian font-mono tabular-nums">
                4.9
                <Star
                  className="text-brand-jasmine"
                  fill="currentColor"
                  size={19}
                />
              </div>
              <p className="text-[11px] text-slate-400 font-sans uppercase tracking-wider font-bold mt-0.5">
                Student Rating
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* RIGHT COLUMN: Instructor Card + Interactive Student Review Widget */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="lg:col-span-5 relative flex flex-col items-center"
        >
          <div className="relative w-full max-w-[380px] sm:max-w-[420px]">
            {/* Ambient Glow */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-brand-cerulean/25 to-brand-coral/20 blur-2xl rounded-[2.5rem] -z-10" />

            {/* Instructor Portrait Card */}
            <div className="relative w-full aspect-[4/5] bg-white rounded-[2rem] p-3 shadow-xl border border-slate-200/70">
              <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative bg-slate-100 group">
                <img
                  src={heroSrc}
                  alt="Kalum Waduge — A/L Accounting Instructor"
                  loading="eager"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-prussian/95 via-brand-prussian/25 to-transparent" />

                {/* Top Floating LMS Badges */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold text-brand-prussian shadow-sm">
                    <GraduationCap size={13} className="text-brand-cerulean" />
                    USJP Alumni
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-prussian/80 backdrop-blur-md text-[11px] font-semibold text-brand-jasmine border border-white/15">
                    16 Units Covered
                  </span>
                </div>

                {/* Instructor Identity */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-brand-jasmine text-[11px] font-bold tracking-widest uppercase font-sans">
                    Lead Lecturer
                  </p>
                  <h3 className="text-white text-2xl sm:text-3xl font-black font-sans tracking-tight mt-0.5">
                    Kalum Waduge
                  </h3>
                  <p className="text-white/80 text-xs sm:text-sm font-sans mt-1">
                    BSc. Accounting (Special) · University of Sri Jayewardenepura
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Student Voice Floating Card */}
            {currentReview && (
              <div className="mt-4 sm:-mt-8 sm:mx-4 relative z-20 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-200/80">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentReview._id || activeQuoteIdx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22 }}
                    className="space-y-2.5"
                  >
                    <p className="text-xs sm:text-sm text-brand-prussian/85 italic leading-relaxed line-clamp-2">
                      "{currentReview.comment}"
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-brand-aliceBlue text-brand-cerulean font-bold text-xs flex items-center justify-center shrink-0">
                          {currentReview.student?.firstName?.[0] || "S"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-brand-prussian truncate">
                            {currentReview.student?.firstName}{" "}
                            {currentReview.student?.lastName}
                          </p>
                          <p className="text-[10px] font-semibold text-brand-coral uppercase tracking-wider">
                            {currentReview.student?.batch?.name || "Student"}
                          </p>
                        </div>
                      </div>

                      {testimonials.length > 1 && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            aria-label="Previous review"
                            onClick={() =>
                              setActiveQuoteIdx(
                                (prev) =>
                                  (prev - 1 + testimonials.length) %
                                  testimonials.length
                              )
                            }
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-prussian transition-colors"
                          >
                            <ChevronLeft size={15} />
                          </button>
                          <button
                            type="button"
                            aria-label="Next review"
                            onClick={() =>
                              setActiveQuoteIdx(
                                (prev) => (prev + 1) % testimonials.length
                              )
                            }
                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-prussian transition-colors"
                          >
                            <ChevronRight size={15} />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Scroll Cue */}
      <motion.button
        type="button"
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="absolute bottom-5 text-brand-prussian/40 hidden md:flex flex-col items-center gap-1 cursor-pointer hover:text-brand-cerulean transition-colors z-20"
        onClick={() =>
          document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })
        }
      >
        <span className="text-[10px] font-bold tracking-widest uppercase font-sans">
          Scroll
        </span>
        <ChevronDown size={20} />
      </motion.button>
    </header>
  );
};

// --- 2. ABOUT & MISSION SECTION ---

const AboutSection = () => (
  <section
    id="about"
    className="w-full py-16 sm:py-24 px-4 sm:px-6 bg-white relative overflow-hidden"
  >
    <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="lg:col-span-7 bg-brand-aliceBlue/50 p-7 sm:p-10 rounded-[2rem] border border-brand-cerulean/15 shadow-sm relative overflow-hidden flex flex-col justify-between"
      >
        <Calculator
          size={130}
          className="text-brand-cerulean/5 absolute -top-4 -right-4 pointer-events-none"
        />

        <div>
          <span className="text-brand-coral font-bold tracking-widest uppercase text-xs font-sans">
            Our Mission
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-prussian mt-2 mb-5 font-sinhala leading-tight">
            ගිණුම්කරණයේ{" "}
            <span className="text-brand-cerulean">Online පෙරගමන්කරු</span>
          </h2>
          <p className="text-slate-600 text-base leading-relaxed mb-7 font-sinhala">
            සිසුන්ට Accounting විෂයයෙහි විශ්වාසය සහ නිපුණතාව ලබා දී, ඔවුන්ගේ අනාගතයේ දී ඉහළ ප්‍රතිඵල ලබා ගැනීමට අත්වැල් පිරිනැමීම මඟින් සරසවි ප්‍රවේශයට මග පෙන්වීම.
          </p>

          <ul className="space-y-3 mb-8">
            {[
              "සරල සිද්ධාන්ත පැහැදිලි කිරීම් (Concept Clarity)",
              "ප්‍රායෝගික ගිණුම්කරණ දැනුම (Double-Entry Mastery)",
              "විභාග ඉලක්කගත ප්‍රශ්න පත්‍ර (Timed Past Papers)",
            ].map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-3 text-brand-prussian font-semibold font-sinhala bg-white px-4 py-3 rounded-xl border border-slate-200/70 shadow-sm text-sm"
              >
                <CheckCircle2
                  className="text-brand-cerulean shrink-0"
                  size={18}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-4 pt-5 border-t border-brand-prussian/10">
          <div className="w-12 h-12 rounded-2xl bg-brand-prussian text-white flex items-center justify-center font-bold text-base font-sans shadow-md shrink-0">
            KW
          </div>
          <div>
            <h4 className="font-bold text-brand-prussian text-base font-sans">
              Kalum Waduge
            </h4>
            <p className="text-xs text-brand-coral font-sans font-semibold">
              BSc. Accounting (Sp) USJP
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="lg:col-span-5 flex flex-col gap-6"
      >
        <motion.div
          variants={fadeInUp}
          className="flex-1 p-7 sm:p-8 rounded-[2rem] bg-gradient-to-br from-brand-prussian via-[#07273D] to-[#02121E] text-white shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 bg-white/10 border border-white/15 rounded-2xl flex items-center justify-center mb-5">
              <GraduationCap size={26} className="text-brand-jasmine" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2 font-sans">
              Top Island & District Rankers
            </h3>
            <p className="text-white/75 font-sans leading-relaxed text-sm">
              Consistent track record of producing District and Island ranks across Sri Lanka through structured exam coaching.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-brand-jasmine font-semibold">
            <span>Structured A/L Roadmap</span>
            <span>2027 · 2028</span>
          </div>
        </motion.div>

        <motion.a
          href="https://whatsapp.com/channel/0029Va5mmNGJf05WQhSOTn1W"
          target="_blank"
          rel="noopener noreferrer"
          variants={fadeInUp}
          className="flex-1 p-7 sm:p-8 rounded-[2rem] bg-white border border-slate-200/80 hover:border-brand-cerulean/50 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 rounded-2xl flex items-center justify-center mb-5">
              <Users size={26} />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-brand-prussian mb-2 font-sans flex items-center justify-between">
              <span>Active Student Community</span>
              <ArrowRight
                size={20}
                className="text-brand-cerulean group-hover:translate-x-1 transition-transform"
              />
            </h3>
            <p className="text-slate-500 font-sans leading-relaxed text-sm">
              Join thousands of A/L Commerce students receiving free exam tips, past paper updates, and live class alerts on WhatsApp.
            </p>
          </div>
          <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-brand-cerulean">
            Join Official WhatsApp Channel →
          </span>
        </motion.a>
      </motion.div>
    </div>
  </section>
);

// --- 3. RANDOM YOUTUBE LESSONS SECTION ---

const YoutubeLessonsSection = () => {
  // Selects a random YouTube embed URL on every page load / refresh
  const [randomLink] = useState<string>(
    () => YOUTUBE_LINKS[Math.floor(Math.random() * YOUTUBE_LINKS.length)]
  );

  return (
    <section
      id="dashboard"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 bg-slate-50/70 border-y border-slate-200/60"
    >
      <div className="container mx-auto max-w-5xl">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <span className="text-brand-coral font-bold tracking-widest uppercase text-xs font-sans">
            Inside the LMS
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-brand-prussian font-sinhala mt-2.5 mb-4">
            Our YouTube Lessons
          </h2>
          <p className="text-slate-500 font-sans text-sm sm:text-base">
            Free high-quality A/L Accounting lessons and live streams directly from our YouTube channel.
          </p>
        </div>

        <motion.div
          variants={scaleIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="rounded-3xl bg-white border border-slate-200/80 shadow-xl shadow-brand-prussian/5 overflow-hidden"
        >
          {/* Browser Chrome Top Bar */}
          <div className="px-4 py-3 bg-slate-100/80 border-b border-slate-200/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-400/80" />
              <span className="w-3 h-3 rounded-full bg-amber-400/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-400/80" />
            </div>

            <div className="px-4 py-1 rounded-lg bg-white border border-slate-200/70 text-[11px] font-mono text-slate-400 truncate max-w-xs sm:max-w-md flex items-center gap-1.5">
              <Youtube size={13} className="text-rose-500 shrink-0" />
              <span>youtube.com/@SLAccounting</span>
            </div>

            <Link
              to="/lesson-packs"
              className="text-[11px] font-semibold text-brand-cerulean hover:text-brand-prussian transition-colors hidden sm:inline-flex items-center gap-1"
            >
              <span>Full Packs</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {/* 16:9 YouTube Player */}
          <div className="p-3 sm:p-4 bg-white">
            <div className="w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden relative shadow-inner">
              {randomLink && (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={randomLink}
                  title="SL Accounting YouTube Lesson"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// --- 4. INTERACTIVE SYLLABUS CURRICULUM SECTION ---

const CurriculumSection = () => {
  const [gradeFilter, setGradeFilter] = useState<"all" | "Grade 12" | "Grade 13">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUnits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return SYLLABUS_UNITS.filter((u) => {
      if (gradeFilter !== "all" && u.grade !== gradeFilter) return false;
      if (!q) return true;
      return (
        u.title.toLowerCase().includes(q) ||
        u.num.includes(q) ||
        u.grade.toLowerCase().includes(q)
      );
    });
  }, [gradeFilter, searchQuery]);

  return (
    <section
      id="features"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 bg-white"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-10 sm:mb-12 max-w-2xl mx-auto">
          <span className="text-brand-coral font-bold tracking-widest uppercase text-xs font-sans">
            Complete A/L Syllabus
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-brand-prussian font-sinhala mt-2.5 mb-4">
            සම්පූර්ණ විෂය නිර්දේශය
          </h2>
          <p className="text-slate-500 font-sans text-sm sm:text-base">
            All 16 units of the GCE A/L Accounting syllabus, organized into structured lessons, tutes, and past-paper drills.
          </p>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/70">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/70 self-start">
            {(
              [
                { key: "all", label: "All Units", count: 16 },
                { key: "Grade 12", label: "Grade 12", count: 10 },
                { key: "Grade 13", label: "Grade 13", count: 6 },
              ] as const
            ).map((tab) => {
              const active = gradeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setGradeFilter(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${active
                    ? "bg-brand-prussian text-white shadow-sm"
                    : "text-slate-600 hover:text-brand-prussian"
                    }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] tabular-nums ${active
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                      }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative sm:w-72">
            <Search
              size={15}
              className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search unit name or number..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200/80 rounded-xl text-xs text-brand-prussian placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-cerulean/20 focus:border-brand-cerulean transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Units Grid */}
        {filteredUnits.length === 0 ? (
          <div className="text-center py-14 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-sm font-semibold text-brand-prussian">
              No matching syllabus units
            </p>
            <button
              type="button"
              onClick={() => {
                setGradeFilter("all");
                setSearchQuery("");
              }}
              className="mt-3 px-4 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-brand-cerulean hover:bg-brand-aliceBlue transition-colors"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredUnits.map((unit) => {
              const Icon = unit.icon;
              const isGrade13 = unit.grade === "Grade 13";
              return (
                <motion.div
                  layout
                  key={unit.num}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3 }}
                  className="bg-white p-6 rounded-2xl border border-slate-200/75 hover:border-brand-cerulean/40 shadow-sm hover:shadow-lg transition-all group hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-11 h-11 bg-brand-aliceBlue text-brand-cerulean rounded-xl flex items-center justify-center group-hover:bg-brand-prussian group-hover:text-white transition-colors">
                        <Icon size={21} />
                      </div>
                      <span className="text-2xl font-black text-brand-prussian/15 font-mono group-hover:text-brand-cerulean/30 transition-colors tabular-nums">
                        {unit.num}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-brand-prussian font-sinhala leading-snug mb-3">
                      {unit.title}
                    </h3>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${isGrade13
                        ? "bg-amber-50 text-amber-700"
                        : "bg-brand-aliceBlue text-brand-cerulean"
                        }`}
                    >
                      {unit.grade}
                    </span>
                    <Link
                      to="/lesson-packs"
                      className="text-xs font-semibold text-slate-400 group-hover:text-brand-cerulean inline-flex items-center gap-1 transition-colors"
                    >
                      Lessons <ArrowRight size={13} />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

// --- 5. THREE-STEP PROCESS SECTION ---

const ProcessSection = () => {
  const steps = [
    {
      num: "01",
      title: "Enroll Online",
      desc: "Create your student profile in minutes and enroll in your A/L batch or individual lesson packs.",
    },
    {
      num: "02",
      title: "Learn on the LMS",
      desc: "Watch HD video lessons, download structured PDF tutes, and receive printed packs via courier.",
    },
    {
      num: "03",
      title: "Track & Master",
      desc: "Attempt timed quizzes and essay papers with teacher feedback and live leaderboard analytics.",
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-br from-brand-prussian via-[#07273D] to-[#02121E] relative overflow-hidden">
      <div className="absolute -left-24 top-0 w-72 h-72 bg-brand-cerulean rounded-full blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute -right-24 bottom-0 w-72 h-72 bg-brand-coral rounded-full blur-[120px] opacity-20 pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-brand-jasmine font-bold tracking-widest uppercase text-xs font-sans">
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white font-sinhala mt-2.5">
            තුන් පියවරකින් ආරම්භය
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.12, duration: 0.45 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 hover:border-brand-jasmine/40 rounded-3xl p-7 transition-colors"
            >
              <span className="inline-block text-4xl sm:text-5xl font-black text-brand-jasmine/30 font-mono tabular-nums">
                {step.num}
              </span>
              <h3 className="text-xl font-bold text-white mt-3 mb-2.5 font-sans">
                {step.title}
              </h3>
              <p className="text-white/70 font-sans leading-relaxed text-sm">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- 6. TESTIMONIALS SECTION ---

const TestimonialsSection = ({ testimonials }: { testimonials: any[] }) => (
  <section className="w-full py-16 sm:py-24 px-4 sm:px-6 bg-white">
    <div className="container mx-auto max-w-6xl">
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
        <span className="text-brand-coral font-bold tracking-widest uppercase text-xs font-sans">
          Student Voices
        </span>
        <h2 className="text-3xl md:text-5xl font-bold text-brand-prussian font-sinhala mt-2.5">
          සිසුන් කියන කතාව
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.slice(0, 6).map((q, idx) => (
          <motion.div
            key={q._id || idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.08, duration: 0.4 }}
            className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-6 flex flex-col justify-between hover:bg-white hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <Quote size={24} className="text-brand-cerulean/30" />
                <div className="flex items-center gap-0.5 text-brand-jasmine">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} size={13} fill="currentColor" />
                  ))}
                </div>
              </div>
              <p className="text-brand-prussian/85 font-sans text-sm leading-relaxed mb-6">
                "{q.comment}"
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-200/70">
              <div className="w-9 h-9 rounded-full bg-brand-aliceBlue text-brand-cerulean ring-1 ring-brand-cerulean/20 flex items-center justify-center font-bold text-xs font-sans uppercase shrink-0">
                {q.student?.firstName?.[0] || "S"}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-brand-prussian text-sm font-sans truncate">
                  {q.student?.firstName} {q.student?.lastName}
                </p>
                <p className="text-[11px] font-semibold text-slate-400 font-sans uppercase">
                  {q.student?.batch?.name || "Student"}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// --- 7. STATS BANNER ---

const StatsBanner = () => {
  const stats: { val?: number; suffix?: string; label: string; staticVal?: string }[] = [
    { val: 1000, suffix: "+", label: "Students Enrolled" },
    { val: 100, suffix: "%", label: "Syllabus Covered" },
    { val: 24, suffix: "/7", label: "LMS Access" },
    { staticVal: "A+", label: "Exam Results" },
  ];

  return (
    <section className="w-full py-14 sm:py-18 bg-brand-prussian text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px]" />
      <div className="container mx-auto max-w-6xl px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="flex flex-col items-center justify-center"
          >
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-brand-jasmine mb-1.5 font-mono tabular-nums tracking-tight">
              {stat.staticVal ? (
                stat.staticVal
              ) : (
                <Counter value={stat.val as number} suffix={stat.suffix} />
              )}
            </h3>
            <p className="text-white/75 uppercase tracking-widest text-[11px] font-bold font-sans">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

// --- 8. FINAL CTA SECTION ---

const FinalCtaSection = () => (
  <section className="w-full py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-br from-brand-aliceBlue/70 via-white to-brand-aliceBlue/70">
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="container mx-auto max-w-4xl bg-white rounded-[2.25rem] p-8 sm:p-14 border border-slate-200/80 shadow-xl shadow-brand-prussian/5 text-center relative overflow-hidden"
    >
      <div className="w-12 h-12 rounded-2xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center mx-auto mb-5">
        <Sparkles size={24} />
      </div>
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-brand-prussian font-sinhala mb-4 leading-tight">
        ඔබේ A ලකුණ අද ආරම්භ කරන්න
      </h2>
      <p className="text-slate-500 font-sans text-sm sm:text-base mb-8 max-w-xl mx-auto leading-relaxed">
        Join over a thousand Sri Lankan A/L students already mastering Accounting on SL Accounting’s LMS.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
        <Link
          to="/register"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-brand-prussian hover:bg-brand-cerulean text-white rounded-2xl font-bold text-base shadow-lg shadow-brand-prussian/20 transition-all active:scale-[0.98] font-sans"
        >
          <Play fill="currentColor" size={16} />
          <span>Create Free Account</span>
        </Link>
        <Link
          to="/classes"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-50 hover:bg-brand-aliceBlue text-brand-prussian border border-slate-200/80 rounded-2xl font-bold text-base transition-colors font-sans"
        >
          <Award size={17} className="text-brand-cerulean" />
          <span>Browse 2027 · 2028 Classes</span>
        </Link>
      </div>
    </motion.div>
  </section>
);

// --- MAIN HOME PAGE ---

const Home = () => {
  const [settings, setSettings] = useState<SettingData | null>(null);
  const [testimonials, setTestimonials] = useState<any[]>(FALLBACK_TESTIMONIALS);

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
      <HeroSection settings={settings} testimonials={testimonials} />
      <AboutSection />
      <YoutubeLessonsSection />
      <CurriculumSection />
      <ProcessSection />
      <TestimonialsSection testimonials={testimonials} />
      <StatsBanner />
      <FinalCtaSection />
    </div>
  );
};

export default Home;