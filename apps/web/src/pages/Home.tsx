import { motion } from "framer-motion";
import { Play, BookOpen, GraduationCap, Users, Star, ChevronDown, CheckCircle2,} from "lucide-react";

const HeroSection = () => (
  <section id="home" className="relative w-full min-h-screen flex items-center justify-center p-6 pt-28 overflow-hidden">
    <div className="container mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
      
      {/* Left Content */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }} 
        whileInView={{ opacity: 1, x: 0 }} 
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center lg:text-left"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#05668A]/10 border border-[#05668A]/20 backdrop-blur-md mb-8">
          <span className="w-2 h-2 rounded-full bg-[#009914] animate-pulse"></span>
          <span className="text-sm font-bold text-[#05668A] tracking-wide">2026 ENROLLMENTS OPEN</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-[#053A4E] mb-6 leading-[1.1] font-sinhala drop-shadow-sm">
          තාරුණ්‍යයේ <br/>
          <span className="text-transparent md:text-6xl bg-clip-text bg-gradient-to-r from-[#05668A] via-[#05668A] to-[#EF8D8E]">
            ගිණුම්කරණ හඩ
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-500 font-sinhala mb-10 max-w-2xl mx-auto lg:mx-0">
          "සරසවියට - පෙර සවිය" <br/>
          <span className="text-base text-gray-400 mt-2 block font-sans">
            The most trusted Online Accounting platform for A/L students in Sri Lanka.
          </span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
          <button className="group relative px-8 py-4 bg-[#053A4E] text-white rounded-2xl font-bold text-lg overflow-hidden shadow-xl shadow-[#053A4E]/20 transition-all hover:scale-105 hover:shadow-2xl">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#05668A] to-[#053A4E] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center gap-3">
              <Play fill="currentColor" size={20} />
              Start Learning
            </div>
          </button>
          
          <button className="px-8 py-4 bg-white/60 backdrop-blur-md text-[#053A4E] border border-white rounded-2xl font-bold text-lg shadow-lg hover:bg-white transition-all flex items-center gap-2">
            View Classes <BookOpen size={20} />
          </button>
        </div>
      </motion.div>

      {/* Right Image Content */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative flex justify-center lg:justify-end"
      >
         <motion.div
            animate={{ y: [-15, 15, -15] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="relative"
         >
            {/* Background Blob */}
            <div className="absolute top-10 right-10 w-full h-full bg-[#EF8D8E]/20 rounded-full blur-3xl -z-10"></div>
            
            {/* Image Card */}
            <div className="relative w-[320px] h-[420px] md:w-[500px] md:h-[500px] bg-white rounded-[2rem] p-3 shadow-2xl shadow-[#05668A]/20 border border-white/50 backdrop-blur-sm">
                <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative">
                    {/* Placeholder image for instructor */}
                    <img 
                        src="kalumwaduge.jpg" 
                        alt="Kalum Waduge" 
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#053A4E] to-transparent p-6 pt-20">
                        <p className="text-[#FFE787] text-xs font-bold tracking-widest uppercase mb-1">Instructor</p>
                        <h3 className="text-white text-2xl font-bold">Kalum Waduge</h3>
                    </div>
                </div>

                {/* Floating Badge 1 */}
                <motion.div 
                    animate={{ y: [5, -5, 5] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.5 }}
                    className="absolute -left-6 top-12 bg-white p-3 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3"
                >
                    <div className="w-10 h-10 bg-[#E8EFF7] rounded-full flex items-center justify-center">
                        <GraduationCap className="text-[#05668A]" size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold">Students</p>
                        <p className="text-[#053A4E] font-bold text-lg">1000+</p>
                    </div>
                </motion.div>

                {/* Floating Badge 2 */}
                <motion.div 
                    animate={{ y: [-5, 5, -5] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
                    className="absolute -right-6 bottom-20 bg-white p-3 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3"
                >
                    <div className="w-10 h-10 bg-[#FFF4CC] rounded-full flex items-center justify-center">
                        <Star className="text-[#F59E0B]" fill="currentColor" size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold">Rating</p>
                        <p className="text-[#053A4E] font-bold text-lg">4.9/5</p>
                    </div>
                </motion.div>
            </div>
         </motion.div>
      </motion.div>
    </div>

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
  <section id="about" className="w-full py-24 px-6">
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
          ගිණුම්කරණයේ <br/><span className="text-[#05668A] md:text-4xl">Online පෙරගමන්කරු</span>
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
      
      {/* Right side static content/image replacement */}
      <motion.div 
         initial={{ opacity: 0, scale: 0.9 }}
         whileInView={{ opacity: 1, scale: 1 }}
         viewport={{ once: true }}
         transition={{ duration: 0.8 }}
         className="hidden lg:flex flex-col gap-6"
      >
        <div className="p-8 rounded-3xl bg-[#053A4E] text-white shadow-xl transform translate-x-12">
            <GraduationCap size={48} className="text-[#FFE787] mb-4" />
            <h3 className="text-2xl font-bold mb-2">Top Island Rankers</h3>
            <p className="text-white/80">Consistent track record of producing District and Island ranks every year.</p>
        </div>
        <div className="p-8 rounded-3xl bg-white border border-white/50 shadow-xl backdrop-blur-sm -translate-x-4">
            <Users size={48} className="text-[#EF8D8E] mb-4" />
            <h3 className="text-2xl font-bold text-[#053A4E] mb-2">Community</h3>
            <p className="text-gray-600">Join a network of thousands of students striving for excellence.</p>
        </div>
      </motion.div>
    </div>
  </section>
);

const FeatureSection = () => (
  <section id="features" className="w-full py-24 px-6">
    <div className="container mx-auto max-w-6xl">
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
            className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl border border-white shadow-xl hover:shadow-2xl hover:bg-white transition-all group hover:-translate-y-2"
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
        <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
        >
          <h3 className="text-4xl md:text-5xl font-bold text-[#FFE787] mb-2">{stat.val}</h3>
          <p className="text-[#EF8D8E] uppercase tracking-widest text-xs font-bold">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  </section>
);

const Home = () => {
  return (
    <div className="min-h-screen w-full relative">
        <HeroSection />
        <AboutSection />
        <FeatureSection />
        <StatsBanner />
    </div>
  );
};

export default Home;