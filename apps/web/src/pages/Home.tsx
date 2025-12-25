import { motion } from "framer-motion";
import { 
  Play, 
  BookOpen, 
  GraduationCap, 
  Users, 
  Star, 
  ChevronDown, 
  CheckCircle2, 
  ArrowRight
} from "lucide-react";

// --- Animation Variants ---
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

const floatingBadge = {
  animate: { y: [5, -5, 5], transition: { repeat: Infinity, duration: 4 } }
};

const HeroSection = () => (
  <section id="home" className="relative w-full min-h-screen flex items-center justify-center pt-28 pb-12 overflow-hidden bg-gradient-to-br from-brand-aliceBlue via-white to-brand-aliceBlue">
    
    {/* Background Decorative Blobs (Using your config animation) */}
    <div className="absolute top-0 left-[-10%] w-96 h-96 bg-brand-cerulean/10 rounded-full blur-3xl animate-blob opacity-70 mix-blend-multiply filter"></div>
    <div className="absolute top-0 right-[-10%] w-96 h-96 bg-brand-coral/10 rounded-full blur-3xl animate-blob animation-delay-2000 opacity-70 mix-blend-multiply filter"></div>
    <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-brand-jasmine/20 rounded-full blur-3xl animate-blob animation-delay-4000 opacity-70 mix-blend-multiply filter"></div>

    <div className="container mx-auto max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
      
      {/* Left Content */}
      <motion.div 
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="text-center lg:text-left flex flex-col items-center lg:items-start"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-brand-cerulean/20 shadow-sm mb-8 backdrop-blur-sm">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-600"></span>
          </span>
          <span className="text-xs font-bold text-brand-cerulean tracking-wider uppercase font-sans">2026 Enrollments Open</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-brand-prussian leading-[1.1] mb-6 font-sinhala drop-shadow-sm">
          තාරුණ්‍යයේ <br/>
          <span className="text-6xl text-transparent bg-clip-text bg-gradient-to-r from-brand-cerulean to-brand-coral">
            ගිණුම්කරණ හඩ
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-500 font-sinhala mb-10 max-w-2xl leading-relaxed">
          "සරසවියට - පෙර සවිය" <br/>
          <span className="text-base text-gray-400 mt-2 block font-sans">
            The most trusted Online Accounting platform for A/L students in Sri Lanka.
          </span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button className="group relative px-8 py-4 bg-brand-prussian text-brand-white rounded-2xl font-bold text-lg overflow-hidden shadow-xl shadow-brand-prussian/20 transition-all hover:scale-105 hover:shadow-2xl">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-brand-cerulean to-brand-prussian opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center gap-3 font-sans">
              <Play fill="currentColor" size={18} />
              Start Learning
            </div>
          </button>
          
          <button className="px-8 py-4 bg-white/60 backdrop-blur-md text-brand-prussian border border-white rounded-2xl font-bold text-lg shadow-lg hover:bg-white transition-all flex items-center justify-center gap-2 font-sans group">
            View Classes 
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>

      {/* Right Image Content */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative flex justify-center lg:justify-end mt-10 lg:mt-0"
      >
        <div className="relative w-[300px] h-[400px] sm:w-[450px] sm:h-[550px]">
           {/* Abstract Decoration */}
           <div className="absolute -inset-4 bg-gradient-to-tr from-brand-cerulean to-brand-coral opacity-20 blur-2xl rounded-[3rem] -z-10"></div>
           
           {/* Main Card */}
           <div className="relative w-full h-full bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-3 shadow-2xl border border-white/60">
              <div className="w-full h-full rounded-[2rem] overflow-hidden relative bg-gray-200">
                  <img 
                      src="kalumwaduge.jpg" 
                      alt="Kalum Waduge" 
                      className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-brand-prussian to-transparent p-6 pt-24">
                      <p className="text-brand-jasmine text-xs font-bold tracking-widest uppercase mb-1 font-sans">Instructor</p>
                      <h3 className="text-brand-white text-2xl font-bold font-sans">Kalum Waduge</h3>
                  </div>
              </div>

              {/* Floating Badge 1 (Students) */}
              <motion.div 
                  variants={floatingBadge}
                  animate="animate"
                  className="absolute -left-4 top-12 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl border border-white flex items-center gap-3"
              >
                  <div className="w-12 h-12 bg-brand-aliceBlue rounded-full flex items-center justify-center">
                      <GraduationCap className="text-brand-cerulean" size={24} />
                  </div>
                  <div>
                      <p className="text-xs text-gray-500 font-bold font-sans">Students</p>
                      <p className="text-brand-prussian font-bold text-xl font-sans">1000+</p>
                  </div>
              </motion.div>

              {/* Floating Badge 2 (Rating) */}
              <motion.div 
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                  className="absolute -right-4 bottom-24 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl border border-white flex items-center gap-3"
              >
                  <div className="w-12 h-12 bg-brand-jasmine/20 rounded-full flex items-center justify-center">
                      <Star className="text-yellow-500" fill="currentColor" size={24} />
                  </div>
                  <div>
                      <p className="text-xs text-gray-500 font-bold font-sans">Rating</p>
                      <p className="text-brand-prussian font-bold text-xl font-sans">4.9/5</p>
                  </div>
              </motion.div>
           </div>
        </div>
      </motion.div>
    </div>

    {/* Scroll Indicator */}
    <motion.div 
      animate={{ y: [0, 10, 0] }} 
      transition={{ repeat: Infinity, duration: 2 }}
      className="absolute bottom-8 text-brand-cerulean/40 hidden md:block"
    >
      <ChevronDown size={32} />
    </motion.div>
  </section>
);

const AboutSection = () => (
  <section id="about" className="w-full py-24 px-6 bg-white relative overflow-hidden">
    <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      
      {/* Left: Mission Card */}
      <motion.div 
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="bg-brand-aliceBlue/50 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] border border-brand-cerulean/10 shadow-2xl shadow-brand-prussian/5 relative overflow-hidden group hover:border-brand-cerulean/30 transition-colors duration-500"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none">
           <Star size={150} className="text-brand-cerulean" fill="currentColor" />
        </div>

        <h3 className="text-brand-coral font-bold tracking-widest uppercase text-sm mb-4 font-sans">Our Mission</h3>
        <h2 className="text-4xl md:text-5xl font-bold text-brand-prussian mb-6 font-sinhala leading-tight">
          ගිණුම්කරණයේ <br/><span className="text-brand-cerulean md:text-4xl">Online පෙරගමන්කරු</span>
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
            <motion.li 
              key={i} 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 text-brand-prussian font-bold font-sinhala bg-white p-3 rounded-xl shadow-sm border border-transparent hover:border-brand-cerulean/20 transition-all"
            >
              <CheckCircle2 className="text-brand-cerulean flex-shrink-0" size={20} /> {item}
            </motion.li>
          ))}
        </ul>

        <div className="flex items-center gap-4 pt-6 border-t border-brand-prussian/10">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-cerulean to-brand-prussian flex items-center justify-center text-white font-bold text-xl font-sans shadow-lg">
            KW
          </div>
          <div>
            <h4 className="font-bold text-brand-prussian text-lg font-sans">Kalum Waduge</h4>
            <p className="text-sm text-brand-coral font-sans font-medium">BSc. Accounting (Sp) USJ</p>
          </div>
        </div>
      </motion.div>
      
      {/* Right: Info Blocks */}
      <motion.div 
         variants={staggerContainer}
         initial="hidden"
         whileInView="visible"
         viewport={{ once: true }}
         className="flex flex-col gap-6"
      >
        <motion.div variants={fadeInUp} className="p-8 rounded-[2rem] bg-brand-prussian text-white shadow-xl hover:translate-x-2 transition-transform duration-300">
            <div className="w-14 h-14 bg-brand-white/10 rounded-2xl flex items-center justify-center mb-6">
                <GraduationCap size={32} className="text-brand-jasmine" />
            </div>
            <h3 className="text-2xl font-bold mb-2 font-sans">Top Island Rankers</h3>
            <p className="text-brand-white/80 font-sans leading-relaxed">Consistent track record of producing District and Island ranks every single year.</p>
        </motion.div>

        <motion.div variants={fadeInUp} className="p-8 rounded-[2rem] bg-brand-aliceBlue border border-brand-cerulean/20 shadow-lg hover:translate-x-2 transition-transform duration-300">
            <div className="w-14 h-14 bg-brand-coral/10 rounded-2xl flex items-center justify-center mb-6">
                <Users size={32} className="text-brand-coral" />
            </div>
            <h3 className="text-2xl font-bold text-brand-prussian mb-2 font-sans">Active Community</h3>
            <p className="text-gray-600 font-sans leading-relaxed">Join a network of thousands of students striving for excellence together.</p>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

const FeatureSection = () => (
  <section id="features" className="w-full py-24 px-6 bg-gradient-to-b from-brand-aliceBlue/30 to-white">
    <div className="container mx-auto max-w-6xl">
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold text-brand-prussian font-sinhala mb-6">ඇයි අපිව තෝරාගත යුත්තේ?</h2>
        <p className="text-gray-500 font-sans text-lg">
          SL Accounting is designed to transform complex concepts into simple, understandable logic using modern technology.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: BookOpen, title: "සරල ඉගැන්වීම්", desc: "සිසුන්ට පහසුවෙන් තේරුම් ගත හැකි සරල ඉගැන්වීම් ක්‍රමවේදය.", accent: "bg-brand-cerulean" },
          { icon: GraduationCap, title: "විභාග ජයග්‍රහණ", desc: "A සාමාර්ථයක් ඉලක්ක කරගත් විශේෂිත පුනරීක්ෂණ වැඩසටහන්.", accent: "bg-brand-coral" },
          { icon: Users, title: "Online සහාය", desc: "ඕනෑම වේලාවක සම්බන්ධ විය හැකි Online සහාය සේවාව.", accent: "bg-brand-jasmine text-brand-prussian" }
        ].map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.2, duration: 0.5 }}
            className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all group hover:-translate-y-2 relative overflow-hidden"
          >
            {/* Hover Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-aliceBlue to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className={`relative w-16 h-16 ${feature.accent === 'bg-brand-jasmine text-brand-prussian' ? 'bg-brand-jasmine text-brand-prussian' : 'bg-brand-aliceBlue text-brand-cerulean'} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
              <feature.icon size={32} />
            </div>
            
            <div className="relative z-10">
                <h3 className="text-xl font-bold text-brand-prussian mb-3 font-sinhala">{feature.title}</h3>
                <p className="text-gray-600 font-sinhala leading-relaxed">{feature.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const StatsBanner = () => (
  <section className="w-full py-20 bg-brand-prussian text-white relative overflow-hidden">
    {/* Geometric Pattern Overlay */}
    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px]"></div>
    <div className="absolute -left-20 top-0 w-64 h-64 bg-brand-cerulean rounded-full blur-[100px] opacity-20"></div>
    <div className="absolute -right-20 bottom-0 w-64 h-64 bg-brand-coral rounded-full blur-[100px] opacity-20"></div>

    <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8 text-center relative z-10">
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
            className="flex flex-col items-center justify-center"
        >
          <h3 className="text-4xl md:text-6xl font-black text-brand-jasmine mb-2 font-sans tracking-tight">{stat.val}</h3>
          <p className="text-brand-coral uppercase tracking-widest text-xs font-bold font-sans">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  </section>
);

const Home = () => {
  return (
    <div className="min-h-screen w-full relative bg-white selection:bg-brand-cerulean selection:text-white">
        <HeroSection />
        <AboutSection />
        <FeatureSection />
        <StatsBanner />
    </div>
  );
};

export default Home;