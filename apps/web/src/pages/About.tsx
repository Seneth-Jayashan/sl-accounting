import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  animate,
  AnimatePresence,
  type Variants,
} from "framer-motion";
import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
  Target,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Play,
  ArrowRight,
  BarChart3,
  Clock,
  Lightbulb,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

// --- Animation Variants ---
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// --- Shared Count-Up Primitive ---
const Counter = ({
  value,
  suffix = "",
  duration = 1.3,
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

// --- 1. ABOUT HERO SECTION ---
const AboutHero = () => {
  const quickNav = [
    { label: "Lead Instructor", href: "#instructor" },
    { label: "Mission & Vision", href: "#vision-mission" },
    { label: "Teaching Methodology", href: "#methodology" },
  ];

  const highlights = [
    { val: 1000, suffix: "+", label: "Students Mentored" },
    { val: 98, suffix: "%", label: "A/L Pass Rate" },
    { val: 16, suffix: "", label: "Syllabus Units" },
    { val: 5, suffix: "+ Yrs", label: "Teaching Excellence" },
  ];

  return (
    <header className="relative w-full pt-32 pb-16 sm:pt-36 sm:pb-20 px-4 sm:px-6 flex flex-col items-center justify-center text-center overflow-hidden bg-[#FAFCFF] border-b border-slate-200/60">
      {/* Subtle Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#053A4E_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.035]" />
        <div className="absolute -top-24 right-[-8%] w-72 h-72 sm:w-[520px] sm:h-[520px] bg-brand-cerulean/12 rounded-full blur-[90px] sm:blur-[120px]" />
        <div className="absolute -bottom-24 left-[-8%] w-72 h-72 sm:w-[460px] sm:h-[460px] bg-brand-coral/10 rounded-full blur-[80px] sm:blur-[110px]" />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-4xl mx-auto"
      >
        <motion.div
          variants={fadeInUp}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200/80 mb-6 shadow-sm"
        >
          <Sparkles size={14} className="text-brand-coral" />
          <span className="text-[11px] font-bold text-brand-cerulean tracking-widest uppercase font-sans">
            Our Story & Purpose
          </span>
        </motion.div>

        <motion.h1
          variants={fadeInUp}
          className="text-3xl sm:text-5xl md:text-6xl font-black text-brand-prussian mb-6 font-sans leading-[1.1] tracking-tight"
        >
          Shaping the Future of <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cerulean via-brand-prussian to-brand-coral">
            Accountancy in Sri Lanka
          </span>
        </motion.h1>

        <motion.p
          variants={fadeInUp}
          className="text-base sm:text-lg text-slate-500 font-sans max-w-2xl mx-auto leading-relaxed mb-8"
        >
          We are dedicated to simplifying complex accounting concepts—making G.C.E. A/L success accessible to every student across the island through structured teaching and modern LMS technology.
        </motion.p>

        {/* Quick Section Jump Pills */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-wrap items-center justify-center gap-2 mb-12"
        >
          {quickNav.map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() =>
                document
                  .querySelector(item.href)
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="px-4 py-2 rounded-full bg-white hover:bg-brand-aliceBlue text-xs font-semibold text-brand-prussian hover:text-brand-cerulean border border-slate-200/80 shadow-sm transition-colors"
            >
              {item.label}
            </button>
          ))}
        </motion.div>

        {/* Proof Metrics Strip */}
        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto bg-white/90 backdrop-blur-md p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm"
        >
          {highlights.map((item, idx) => (
            <div
              key={item.label}
              className={`flex flex-col items-center justify-center ${idx < highlights.length - 1
                ? "sm:border-r sm:border-slate-100"
                : ""
                }`}
            >
              <span className="text-2xl sm:text-3xl font-black text-brand-prussian">
                <Counter value={item.val} suffix={item.suffix} />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1 font-sans">
                {item.label}
              </span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </header>
  );
};

// --- 2. INSTRUCTOR SECTION ---
const InstructorSection = () => (
  <article
    id="instructor"
    className="w-full py-16 sm:py-24 px-4 sm:px-6 bg-white relative scroll-mt-20"
  >
    <div className="container mx-auto max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Image Side (5 cols) */}
        <motion.figure
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="lg:col-span-5 relative order-1"
        >
          <div className="absolute -inset-4 bg-gradient-to-tr from-brand-cerulean/20 to-brand-coral/20 blur-2xl rounded-[2.5rem] -z-10" />

          <div className="w-full max-w-md mx-auto lg:max-w-full aspect-[4/5] rounded-[2rem] p-3 bg-white shadow-xl border border-slate-200/75">
            <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative group bg-brand-aliceBlue">
              <img
                src="/kalumwaduge.jpg"
                alt="Kalum Waduge - Lead Accounting Instructor"
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Top Floating Badges */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold text-brand-prussian shadow-sm">
                  <GraduationCap size={13} className="text-brand-cerulean" />
                  USJP Special Graduate
                </span>
                <span className="px-2.5 py-1 rounded-full bg-brand-prussian/85 backdrop-blur-md text-[11px] font-semibold text-brand-jasmine border border-white/15">
                  5+ Years Exp
                </span>
              </div>

              {/* Bottom Identity Overlay */}
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-brand-prussian/95 via-brand-prussian/65 to-transparent p-6 sm:p-7 pt-20 text-white">
                <p className="text-brand-jasmine font-bold tracking-widest text-[11px] uppercase mb-1">
                  Lead Instructor
                </p>
                <h2 className="text-2xl sm:text-3xl font-black font-sans tracking-tight">
                  Kalum Waduge
                </h2>
                <p className="text-white/80 text-xs sm:text-sm font-sans mt-1">
                  BSc. Accounting (Sp) · University of Sri Jayewardenepura
                </p>
              </div>
            </div>
          </div>
        </motion.figure>

        {/* Content Side (7 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="lg:col-span-7 order-2 space-y-6"
        >
          <div>
            <span className="text-brand-coral font-bold tracking-widest uppercase text-xs font-sans">
              Meet Your Mentor
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-brand-prussian mt-2 font-sinhala leading-tight">
              ගුරුවරයෙකුට වඩා <br />
              <span className="text-brand-cerulean">මඟ පෙන්වන්නෙක්</span>
            </h2>
          </div>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-sans">
            Kalum Waduge is more than a classroom lecturer—he is a dedicated mentor who has guided thousands of students to achieve top results in G.C.E. A/L Accounting. A graduate of the University of Sri Jayewardenepura, he blends deep academic rigor with practical business intuition.
          </p>

          <blockquote className="text-brand-prussian/90 text-base sm:text-lg leading-relaxed font-sinhala bg-brand-aliceBlue/60 p-6 rounded-2xl border-l-4 border-brand-cerulean italic">
            "ගිණුම්කරණය හුදු විෂයයක් ලෙස නොව, ප්‍රායෝගික ජීවිතයට අදාළ කරගනිමින් තර්කානුකූලව උගන්වන ශෛලිය නිසා ඔහු සිසුන් අතර ඉමහත් ජනප්‍රියත්වයට පත්ව ඇත."
          </blockquote>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {[
              "University Lecturer & Resource Person",
              "Proven Track Record of Island Ranks",
              "Author of 'Accounting Master' Series",
              "100% Concept-Driven Double Entry Logic",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/70 group hover:border-brand-cerulean/30 hover:bg-white transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-aliceBlue flex items-center justify-center text-brand-cerulean group-hover:bg-brand-prussian group-hover:text-white transition-colors shrink-0">
                  <CheckCircle2 size={16} />
                </div>
                <span className="text-brand-prussian font-semibold font-sans text-xs sm:text-sm">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </article>
);

// --- 3. VISION & MISSION SECTION ---
const VisionMission = () => {
  const values = [
    {
      icon: Lightbulb,
      title: "Clarity Over Memorization",
      desc: "Every rule is traced back to core accounting principles so students can solve unfamiliar exam adjustments with confidence.",
    },
    {
      icon: Clock,
      title: "Exam-Speed Discipline",
      desc: "Structured timed drills and past-paper workshops train students to finish full papers accurately within time limits.",
    },
    {
      icon: ShieldCheck,
      title: "Equal Access Island-Wide",
      desc: "High-definition lessons, couriered printed tutes, and instant online assessments reach students in every district.",
    },
  ];

  return (
    <section
      id="vision-mission"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 bg-slate-50/70 border-y border-slate-200/60 scroll-mt-20"
    >
      <div className="container mx-auto max-w-6xl space-y-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8"
        >
          {/* Mission Card */}
          <motion.div
            variants={fadeInUp}
            className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-sm border border-slate-200/75 hover:border-brand-cerulean/40 transition-all group relative overflow-hidden flex flex-col justify-between"
          >
            <Target
              size={140}
              className="text-brand-cerulean/5 absolute -top-6 -right-6 group-hover:scale-110 transition-transform duration-500 rotate-12 pointer-events-none"
            />

            <div>
              <div className="w-13 h-13 w-12 h-12 bg-brand-aliceBlue rounded-2xl flex items-center justify-center text-brand-cerulean mb-6">
                <Target size={25} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-cerulean">
                Purpose
              </span>
              <h3 className="text-2xl font-bold text-brand-prussian mt-1 mb-4 font-sans">
                Our Mission
              </h3>
              <p className="text-slate-600 leading-relaxed font-sinhala text-base">
                සිසුන්ට Accounting විෂයයෙහි විශ්වාසය සහ නිපුණතාව ලබා දී, ඔවුන්ගේ අනාගතයේ දී ඉහළ ප්‍රතිඵල ලබා ගැනීමට අත්වැල් පිරිනැමීම මඟින් සරසවි ප්‍රවේශයට මග පෙන්වීම.
              </p>
            </div>
          </motion.div>

          {/* Vision Card */}
          <motion.div
            variants={fadeInUp}
            className="bg-gradient-to-br from-brand-prussian via-[#07273D] to-[#02121E] text-white p-8 sm:p-10 rounded-[2rem] shadow-lg transition-all group relative overflow-hidden flex flex-col justify-between"
          >
            <Award
              size={140}
              className="text-white/5 absolute -top-6 -right-6 group-hover:scale-110 transition-transform duration-500 rotate-12 pointer-events-none"
            />

            <div>
              <div className="w-12 h-12 bg-white/10 border border-white/15 rounded-2xl flex items-center justify-center text-brand-jasmine mb-6">
                <Award size={25} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-jasmine">
                Long-Term Ambition
              </span>
              <h3 className="text-2xl font-bold text-white mt-1 mb-4 font-sans">
                Our Vision
              </h3>
              <p className="text-white/80 leading-relaxed font-sans text-base">
                To be the number one online accounting education platform in Sri Lanka, producing the highest number of Chartered Accountants and future business leaders for the nation.
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Core Pillars Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {values.map((val, idx) => {
            const Icon = val.icon;
            return (
              <motion.div
                key={val.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.4 }}
                className="bg-white p-6 rounded-2xl border border-slate-200/75 shadow-sm flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-aliceBlue text-brand-cerulean flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-prussian font-sans">
                    {val.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1 font-sans">
                    {val.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// --- 4. INTERACTIVE METHODOLOGY SECTION ---
const METHODOLOGY_PILLARS = [
  {
    num: "01",
    icon: BookOpen,
    title: "Theory to Practice",
    sinhalaTitle: "සිද්ධාන්තයේ සිට ප්‍රායෝගික භාවිතයට",
    desc: "We connect every Sri Lanka Accounting Standard (LKAS/SLFRS) to real-world business transactions so formulas become intuitive.",
    deliverables: [
      "Visual T-account & double-entry logic breakdowns",
      "Real company financial statement case studies",
      "Structured downloadable PDF & printed tute packs",
    ],
    badgeStyle: "bg-blue-50 text-brand-cerulean ring-blue-100",
  },
  {
    num: "02",
    icon: GraduationCap,
    title: "Exam & Speed Mastery",
    sinhalaTitle: "විභාග ඉලක්කගත කාල කළමනාකරණය",
    desc: "Proven answering frameworks and timed past-paper simulations engineered to maximize marks under A/L exam pressure.",
    deliverables: [
      "Unit-wise timed MCQ & structured quizzes",
      "Essay paper submissions with personalized teacher marks",
      "Step-by-step marking scheme walkthroughs",
    ],
    badgeStyle: "bg-rose-50 text-brand-coral ring-rose-100",
  },
  {
    num: "03",
    icon: BarChart3,
    title: "Personal LMS Analytics",
    sinhalaTitle: "පුද්ගලික ප්‍රගති විශ්ලේෂණය",
    desc: "Even in an online classroom, every student’s quiz scores, attendance, and unit completion are tracked to identify weak spots early.",
    deliverables: [
      "Live batch leaderboards & score analytics",
      "Instant answer keys with double-entry explanations",
      "24/7 replay access for revision before exams",
    ],
    badgeStyle: "bg-amber-50 text-amber-600 ring-amber-100",
  },
];

const MethodologySection = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const activePillar = METHODOLOGY_PILLARS[activeIdx];

  return (
    <section
      id="methodology"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 bg-white relative scroll-mt-20"
    >
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-12 sm:mb-14"
        >
          <span className="text-brand-coral font-bold tracking-widest uppercase text-xs font-sans">
            How We Teach
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-brand-prussian mt-2.5 mb-4 font-sinhala">
            ඉගැන්වීම් ක්‍රමවේදය
          </h2>
          <p className="text-slate-500 text-sm sm:text-base font-sans">
            Our three-pillar teaching framework guides students step-by-step from foundational double-entry concepts to island-rank exam execution.
          </p>
        </motion.div>

        {/* Interactive 3-Card Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {METHODOLOGY_PILLARS.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = idx === activeIdx;
            return (
              <button
                key={item.num}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`text-left p-6 sm:p-7 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${isSelected
                  ? "bg-brand-aliceBlue/55 border-brand-cerulean/50 shadow-md -translate-y-0.5"
                  : "bg-white border-slate-200/75 hover:border-slate-300 shadow-sm"
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ring-1 ${item.badgeStyle}`}
                    >
                      <Icon size={24} />
                    </div>
                    <span className="text-2xl font-black font-mono text-brand-prussian/15 tabular-nums">
                      {item.num}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-brand-prussian mb-2 font-sans">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-sans">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold">
                  <span
                    className={
                      isSelected ? "text-brand-cerulean" : "text-slate-400"
                    }
                  >
                    {isSelected ? "Viewing Details" : "Click to explore"}
                  </span>
                  <ArrowRight
                    size={14}
                    className={
                      isSelected
                        ? "text-brand-cerulean translate-x-0.5 transition-transform"
                        : "text-slate-300"
                    }
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Pillar Detail Panel */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePillar.num}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
            >
              <div className="lg:col-span-5 space-y-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-cerulean">
                  <TrendingUp size={14} /> Step {activePillar.num} in Practice
                </span>
                <h4 className="text-xl sm:text-2xl font-bold text-brand-prussian font-sinhala">
                  {activePillar.sinhalaTitle}
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 font-sans">
                  Included in every 2027 & 2028 A/L batch inside the SL Accounting LMS.
                </p>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {activePillar.deliverables.map((point, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded-xl border border-slate-200/75 shadow-sm flex flex-col justify-between gap-3"
                  >
                    <CheckCircle2
                      size={18}
                      className="text-emerald-600 shrink-0"
                    />
                    <p className="text-xs font-semibold text-brand-prussian leading-relaxed font-sans">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

// --- 5. CTA BANNER ---
const CTABanner = () => (
  <section className="w-full py-16 sm:py-20 px-4 sm:px-6 bg-white">
    <div className="container mx-auto max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-gradient-to-br from-brand-prussian via-[#07273D] to-[#02121E] rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-14 text-center relative overflow-hidden shadow-xl"
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-brand-cerulean rounded-full blur-[90px] opacity-30 pointer-events-none" />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-coral rounded-full blur-[90px] opacity-25 pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-brand-jasmine text-xs font-semibold mb-5">
            <Sparkles size={13} /> Join SL Accounting Today
          </span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-5 font-sinhala leading-tight">
            ඔබේ සිහිනය සැබෑ කරගන්න <br /> අදම අප හා එක්වන්න
          </h2>
          <p className="text-white/75 mb-8 font-sans text-sm sm:text-base leading-relaxed">
            Join the fastest-growing online A/L Accounting learning community in Sri Lanka.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-white text-brand-prussian px-8 py-4 rounded-2xl font-bold text-base hover:bg-brand-jasmine transition-colors shadow-lg gap-2.5 active:scale-[0.98]"
            >
              <Play size={17} fill="currentColor" />
              <span>Start Learning Now</span>
            </Link>
            <Link
              to="/classes"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-white/10 hover:bg-white/15 text-white border border-white/20 px-8 py-4 rounded-2xl font-bold text-base transition-colors gap-2"
            >
              <span>View Class Timetable</span>
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

const About = () => {
  return (
    <div className="w-full bg-white selection:bg-brand-cerulean selection:text-white">
      <AboutHero />
      <InstructorSection />
      <VisionMission />
      <MethodologySection />
      <CTABanner />
    </div>
  );
};

export default About;