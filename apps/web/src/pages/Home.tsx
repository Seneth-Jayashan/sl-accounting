import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Newspaper,
  ArrowRightSquare,
  X,
  Bell,
  Search,
  FileText
} from "lucide-react";

// --- Animation Variants ---
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const HeroSection = () => (
  <header id="home" className="relative w-full min-h-[100dvh] flex items-center justify-center pt-28 pb-12 bg-[#f9fbff] overflow-hidden">
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center relative z-10">

      {/* Left Content */}
      <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex flex-col items-start text-left">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-100 shadow-sm mb-6 sm:mb-8">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-full w-full bg-green-500"></span>
          </span>
          <span className="text-[11px] sm:text-xs font-bold text-gray-700 tracking-wide font-sans">2026 2027 2028 Enrollments Open</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl md:text-[5.5rem] font-black text-[#0d4b5b] leading-[1.1] mb-4 font-sinhala drop-shadow-sm">
          A ලෙවල් 1ට <br />
          Online <br />
          <span className="text-[#f88f89]">
            Accounting
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-[#0d4b5b] font-sinhala font-bold mb-2">
          " වැඩ එක්ක හදවතට Accounting "
        </p>
        <p className="text-sm sm:text-base text-gray-400 font-sans mb-8 sm:mb-10 max-w-md leading-relaxed">
          The most trusted Online Accounting platform for A/L students in Sri Lanka.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link to="/register" className="px-8 py-3.5 bg-[#0d4b5b] text-white rounded-lg font-semibold text-sm hover:bg-[#093946] transition-colors flex items-center justify-center gap-2 font-sans shadow-md">
            <Play fill="currentColor" size={16} /> Start Learning
          </Link>
          <Link to="/classes" className="px-8 py-3.5 bg-[#f4f7f9] text-[#0d4b5b] rounded-lg font-semibold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 font-sans">
            View Classes <ArrowRight size={16} />
          </Link>
        </div>

        {/* Stats Row (Moved from image to here) */}
        <div className="flex items-center gap-8 mt-12 pt-6 border-t border-gray-200 w-full sm:w-auto">
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-sans mb-1">Students</p>
            <p className="text-[#0d4b5b] font-bold text-lg sm:text-xl font-sans">1000 +</p>
          </div>
          <div className="w-px h-10 bg-gray-300"></div>
          <div>
            <p className="text-gray-500 text-xs sm:text-sm font-sans mb-1">Rating</p>
            <p className="text-[#0d4b5b] font-bold text-lg sm:text-xl font-sans">4.9 / 5</p>
          </div>
        </div>

      </motion.div>

      {/* Right Image */}
      <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }} className="flex justify-center lg:justify-end">
        <div className="w-full max-w-[500px] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
          <img src="Kalum_Hero.jpeg" alt="AL Online Accounting" loading="eager" className="w-full h-auto object-cover" />
        </div>
      </motion.div>
    </div>
  </header>
);

const AboutSection = () => (
  <section id="about" className="w-full py-16 sm:py-24 px-4 sm:px-6 bg-white">
    <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

      {/* Left Card - Our Mission */}
      <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-[#f8f9fa] p-8 sm:p-10 rounded-[1.5rem] border border-gray-100">
        <h3 className="text-[#f88f89] font-bold tracking-widest uppercase text-xs mb-4 font-sans">Our Mission</h3>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0d4b5b] mb-6 font-sinhala leading-snug">
          ගිණුම්කරණයේ <br />
          <span className="text-[#0d4b5b]">Online පෙරගමන්කරු</span>
        </h2>
        <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-8 font-sinhala text-justify">
          සිසුන්ට Accounting විෂයයෙහි විශ්වාසය සහ නිපුණතාව ලබා දී, ඔවුන්ගේ අනාගතයේ දී ඉහළ ප්‍රතිඵල ලබා ගැනීමට අත්වැල් පිරිනැමීම මඟින් සරසවි ප්‍රවේශයට මග පෙන්වීම
        </p>

        <ul className="space-y-4 mb-10">
          {["සරල සිද්ධාන්ත පැහැදිලි කිරීම්", "ප්‍රායෝගික ගිණුම්කරණ දැනුම", "විභාග ඉලක්කගත ප්‍රශ්න පත්‍ර"].map((item, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-3 text-gray-600 font-medium font-sinhala bg-white p-3.5 rounded-lg border border-gray-100 shadow-sm text-sm">
              <Search className="text-[#0d4b5b] flex-shrink-0" size={18} /> {item}
            </motion.li>
          ))}
        </ul>

        {/* Profile Row */}
        <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
          <div className="w-12 h-12 rounded-full bg-[#0d4b5b] flex items-center justify-center text-white font-bold text-sm shadow-md">KW</div>
          <div>
            <h4 className="font-bold text-[#0d4b5b] text-base font-sans">Kalum Waduge</h4>
            <p className="text-xs text-[#f88f89] font-sans font-medium mt-0.5">BSc. Accounting (Sp) USJP</p>
          </div>
        </div>
      </motion.div>

      {/* Right Column Cards */}
      <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex flex-col gap-6">

        {/* Top Island Rankers */}
        <motion.div variants={fadeInUp} className="p-8 sm:p-10 rounded-[1.5rem] bg-[#0d4b5b] text-white h-full flex flex-col justify-center">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 border border-white/5">
            <GraduationCap size={24} className="text-white" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold mb-3 font-sans">Top Island Rankers</h3>
          <p className="text-white/80 font-sans leading-relaxed text-sm sm:text-base">
            Consistent track record of producing District and Island ranks every single year.
          </p>
        </motion.div>

        {/* Active Community */}
        <motion.div variants={fadeInUp} className="p-8 sm:p-10 rounded-[1.5rem] bg-[#f5f8fa] border border-gray-100 h-full flex flex-col justify-center">
          <div className="w-12 h-12 bg-[#e6ecef] rounded-xl flex items-center justify-center mb-6">
            <Users size={24} className="text-[#0d4b5b]" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#0d4b5b] mb-3 font-sans">Active Community</h3>
          <p className="text-gray-500 font-sans leading-relaxed text-sm sm:text-base">
            Join a network of thousands of students striving for excellence together.
          </p>
        </motion.div>

      </motion.div>
    </div>
  </section>
);

const FeatureSection = () => (
  <section id="features" className="w-full py-16 sm:py-20 px-4 sm:px-6 bg-[#f9fbff]">
    <div className="container mx-auto max-w-6xl">
      <div className="text-center mb-12 max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-[#0d4b5b] font-sinhala mb-4">ඇයි අපිව තෝරාගත යුත්තේ?</h2>
        <p className="text-gray-500 font-sans text-sm sm:text-base px-4">
          SL Accounting is designed to transform complex concepts into simple, understandable logic using modern technology.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: BookOpen, title: "සරල ඉගැන්වීම්", desc: "සිසුන්ට පහසුවෙන් තේරුම් ගත හැකි සරල ඉගැන්වීම් ක්‍රමවේදය." },
          { icon: GraduationCap, title: "විභාග ජයග්‍රහණ", desc: "A සාමාර්ථයක් ඉලක්ක කරගත් විශේෂිත පුනරීක්ෂණ වැඩසටහන්." },
          { icon: Users, title: "Online සහාය", desc: "ඕනෑම වේලාවක සම්බන්ධ විය හැකි Online සහාය සේවාව." }
        ].map((feature, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.2, duration: 0.5 }}
            className="bg-white p-8 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-[#e6ecef] rounded-xl flex items-center justify-center mb-6">
              <feature.icon size={26} className="text-[#0d4b5b]" />
            </div>
            <h3 className="text-lg font-bold text-[#0d4b5b] mb-3 font-sinhala">{feature.title}</h3>
            <p className="text-gray-500 font-sinhala leading-relaxed text-sm">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const StatsBanner = () => (
  <section className="w-full py-16 bg-[#f5f8fa] text-center px-4">
    <div className="container mx-auto max-w-5xl bg-white p-10 sm:p-12 rounded-[2rem] shadow-sm border border-gray-100">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
        {[
          { val: "1000 +", label: "Students" },
          { val: "100%", label: "Syllabus Cover" },
          { val: "24/7", label: "LMS Access" },
          { val: "A+", label: "Results" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex flex-col items-center justify-center">
            <h3 className="text-2xl sm:text-3xl font-black text-[#0d4b5b] mb-2 font-sans tracking-tight">{stat.val}</h3>
            <p className="text-[#f88f89] capitalize font-bold text-sm sm:text-base font-sans">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// --- FLOATING WIDGET COMPONENT ---
interface NewsItem {
  title: string;
  source: string;
  date: string;
  summary: string;
  url: string;
}

const FloatingEducationalWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchFact = async () => {
      try {
        setLoading(true);
        const response = await fetch("https://si.wikipedia.org/api/rest_v1/page/random/summary");
        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();

        setNews({
          title: data.title,
          source: "විකිපීඩියාවෙන්",
          date: new Date().toLocaleDateString(),
          summary: data.extract.length > 120 ? data.extract.substring(0, 120) + "..." : data.extract,
          url: data.content_urls.desktop.page
        });
        setError(false);
      } catch (err) {
        console.error("Fact fetch error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchFact();
  }, []);

  return (
    <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="mb-4 w-[320px] sm:w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            <div className="bg-[#0d4b5b] px-5 py-4 flex justify-between items-center relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
              <div className="flex items-center gap-2 relative z-10">
                <Bell size={18} className="text-[#f88f89]" />
                <h3 className="text-white font-bold text-sm tracking-wide font-sans">Did You Know?</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors relative z-10 bg-white/10 p-1 rounded-full hover:bg-white/20">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 relative bg-gradient-to-b from-gray-50 to-white min-h-[160px]">
              {loading ? (
                <div className="animate-pulse flex flex-col gap-3">
                  <div className="h-3 w-20 bg-gray-200 rounded"></div>
                  <div className="h-5 w-full bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 w-full bg-gray-100 rounded"></div>
                  <div className="h-3 w-5/6 bg-gray-100 rounded"></div>
                </div>
              ) : error || !news ? (
                <div className="text-center py-6 text-gray-400">
                  <Newspaper size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-bold font-sans">Unable to load fact</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-[#0d4b5b] uppercase tracking-widest bg-[#f5f8fa] px-2 py-1 rounded-md">
                      {news.source}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">{news.date}</span>
                  </div>

                  <h4 className="text-[#0d4b5b] font-bold text-base mb-2 font-sans leading-tight">
                    {news.title}
                  </h4>

                  <p className="text-gray-500 text-xs leading-relaxed mb-4 font-sans">
                    {news.summary}
                  </p>

                  <a
                    href={news.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0d4b5b] bg-white border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors group w-full justify-center shadow-sm"
                  >
                    Read Full Article <ArrowRightSquare size={14} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 ${isOpen ? 'bg-[#f88f89] text-white rotate-90 scale-90' : 'bg-[#0d4b5b] text-white hover:scale-105 hover:bg-[#093946]'}`}
      >
        {isOpen ? <X size={24} /> : <FileText size={24} />}

        {!isOpen && (
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f88f89] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-full w-full bg-[#f88f89] border-2 border-white"></span>
          </span>
        )}
      </button>

    </div>
  );
};

const Home = () => {
  return (
    <div className="min-h-screen w-full relative bg-white selection:bg-[#0d4b5b] selection:text-white">
      <HeroSection />
      <AboutSection />
      <FeatureSection />
      <StatsBanner />
      <FloatingEducationalWidget />
    </div>
  );
};

export default Home;