import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Award,
  BookOpen,
  Target,
  Users,
  CheckCircle2,
  GraduationCap,
  Play
} from "lucide-react";

// --- Animation Variants (Optimized) ---
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const AboutHero = () => (
  <header className="relative w-full pt-24 pb-10 sm:pt-32 sm:pb-12 px-4 sm:px-6 flex flex-col items-center justify-center text-center bg-[#f9fbff]">
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeInUp}
      className="relative z-10 max-w-4xl mx-auto"
    >
      <h1 className="text-4xl sm:text-5xl md:text-[4rem] font-black text-[#0d4b5b] mb-6 font-sans leading-tight">
        Shaping the Future of <br />
        Accountancy in <span className="text-[#f88f89]">Sri Lanka</span>
      </h1>

      <p className="text-base sm:text-lg text-gray-500 font-sans max-w-2xl mx-auto leading-relaxed px-2">
        We are dedicated to simplifying complex accounting concepts, making A/L success accessible to every student through innovation, technology, and expert guidance.
      </p>
    </motion.div>
  </header>
);

const InstructorSection = () => (
  <article className="w-full pt-8 pb-16 sm:pt-10 sm:pb-24 px-4 sm:px-6 bg-white relative">
    <div className="container mx-auto max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

        {/* Image Side */}
        <motion.figure
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative order-1"
        >
          <div className="w-full max-w-md mx-auto lg:max-w-full aspect-[4/3] sm:aspect-[4/5] lg:aspect-[4/3] rounded-[2rem] overflow-hidden shadow-xl border border-gray-100 relative group bg-[#f5f8fa]">
            <img
              src="/kalumwaduge.jpg"
              alt="Kalum Waduge - Lead Accounting Instructor"
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Overlay Details */}
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0d4b5b]/90 via-[#0d4b5b]/50 to-transparent p-6 sm:p-8 pt-24 text-white">
              <h2 className="text-2xl sm:text-3xl font-bold mb-1 font-sans">Kalum Waduge</h2>
              <p className="text-[#facc15] font-bold tracking-wider text-xs sm:text-sm mb-4 uppercase">Lead Instructor</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-white text-[#0d4b5b] rounded-md text-[10px] sm:text-xs font-bold">BSc. Accounting (Sp) USJP</span>
                <span className="px-3 py-1.5 bg-white text-[#0d4b5b] rounded-md text-[10px] sm:text-xs font-bold">5+ Years Exp</span>
              </div>
            </div>
          </div>
        </motion.figure>

        {/* Content Side */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="order-2"
        >
          <h2 className="text-3xl md:text-[2.5rem] font-bold text-[#0d4b5b] mb-6 font-sinhala leading-tight">
            ගුරුවරයෙකුට වඩා <br /><span className="text-[#0d4b5b]">මඟ පෙන්වන්නෙක්</span>
          </h2>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6 font-sans text-justify">
            Kalum Waduge is not just a teacher but a mentor who has guided thousands of students to achieve their dream results in A/L Accounting. A graduate of the University of Sri Jayewardenepura, he combines academic excellence with practical teaching methodologies.
          </p>
          <blockquote className="text-gray-600 text-sm sm:text-base leading-relaxed mb-8 font-sinhala text-justify bg-[#f5f8fa] p-6 rounded-r-xl border-l-4 border-[#0d4b5b]">
            "ගිණුම්කරණය හුදු විෂයයක් ලෙස නොව, ප්‍රායෝගික ජීවිතයට අදාළ කරගනිමින් තර්කානුකූලව උගන්වන ශෛලිය නිසා ඔහු සිසුන් අතර ඉමහත් ජනප්‍රියත්වයට පත්ව ඇත."
          </blockquote>

          <div className="space-y-4 mb-8">
            {[
              "University Lecturer & Resource Person",
              "Proven Track Record of Island Ranks",
              "Author of 'Accounting Master' Series"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[#0d4b5b] shrink-0">
                  <CheckCircle2 size={20} className="opacity-80" />
                </div>
                <span className="text-gray-700 font-medium font-sans text-sm sm:text-base">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  </article>
);

const VisionMission = () => (
  <section className="w-full py-16 sm:py-24 px-4 sm:px-6 bg-[#f9fbff]">
    <div className="container mx-auto max-w-6xl">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8"
      >
        {/* Mission Card */}
        <motion.div variants={fadeInUp} className="bg-white p-8 sm:p-10 rounded-[1.5rem] shadow-sm border border-gray-100 transition-all hover:shadow-md">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-[#e6ecef] rounded-full flex items-center justify-center text-[#0d4b5b]">
              <Target size={24} />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#0d4b5b] font-sans">Our Mission</h3>
          </div>
          <p className="text-gray-500 leading-relaxed font-sinhala text-sm sm:text-base text-justify">
            සිසුන්ට Accounting විෂයයෙහි විශ්වාසය සහ නිපුණතාව ලබා දී, ඔවුන්ගේ අනාගතයේ දී ඉහළ ප්‍රතිඵල ලබා ගැනීමට අත්වැල් පිරිනැමීම මඟින් සරසවි ප්‍රවේශයට මග පෙන්වීම
          </p>
        </motion.div>

        {/* Vision Card */}
        <motion.div variants={fadeInUp} className="bg-white p-8 sm:p-10 rounded-[1.5rem] shadow-sm border border-gray-100 transition-all hover:shadow-md">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-[#e6ecef] rounded-full flex items-center justify-center text-[#0d4b5b]">
              <Award size={24} />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#0d4b5b] font-sans">Our Vision</h3>
          </div>
          <p className="text-gray-500 leading-relaxed font-sans text-sm sm:text-base text-justify">
            To be the number one online accounting education platform in Sri Lanka, producing the highest number of Chartered Accountants and future business leaders for the nation.
          </p>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

const MethodologySection = () => (
  <section className="w-full py-16 sm:py-24 px-4 sm:px-6 bg-white relative">
    <div className="container mx-auto max-w-6xl text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-12 sm:mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-[#0d4b5b] mb-4 font-sinhala">
          ඉගැන්වීම් ක්‍රමවේදය
        </h2>
        {/* Gradient Line */}
        <div className="h-1 w-24 bg-gradient-to-r from-[#0d4b5b] to-[#f88f89] mx-auto rounded-full mb-6"></div>
        <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base">
          Our teaching methodology is scientifically designed to help students master Accounting from basics to advanced application.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {[
          {
            icon: BookOpen,
            title: "Theory to Practice",
            desc: "We connect every accounting standard to real-world business scenarios for better retention."
          },
          {
            icon: GraduationCap,
            title: "Exam Mastery",
            desc: "Specific techniques to manage time and answer questions accurately to score maximum marks."
          },
          {
            icon: Users,
            title: "Personal Attention",
            desc: "Despite being an online platform, we monitor individual student progress through LMS analytics."
          }
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.15 }}
            className="flex flex-col items-center bg-white p-8 sm:p-10 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-16 h-16 bg-[#f5f8fa] rounded-full flex items-center justify-center mb-6 text-[#0d4b5b]">
              <item.icon size={28} />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#0d4b5b] mb-3 font-sans">{item.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed text-center font-sans">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

const CTABanner = () => (
  <section className="w-full py-16 px-4 sm:px-6 bg-[#f9fbff]">
    <div className="container mx-auto max-w-5xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="bg-[#0d4b5b] rounded-[1.5rem] p-10 sm:p-16 text-center shadow-lg"
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 font-sinhala leading-snug">
          ඔබේ සිහිනය සැබෑ කරගන්න <br /> අදම අප හා එක්වන්න
        </h2>
        <p className="text-white/80 mb-8 sm:mb-10 max-w-xl mx-auto font-sans text-sm sm:text-base">
          Join the fastest growing online accounting community in Sri Lanka.
        </p>
        <Link to="/register" className="inline-flex items-center justify-center bg-white text-[#0d4b5b] px-8 py-3.5 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors gap-2 mx-auto">
          <Play size={18} fill="currentColor" /> Start Learning Now
        </Link>
      </motion.div>
    </div>
  </section>
);

const About = () => {
  return (
    <div className="w-full bg-white selection:bg-[#0d4b5b] selection:text-white">
      <AboutHero />
      <InstructorSection />
      <VisionMission />
      <MethodologySection />
      <CTABanner />
    </div>
  );
};

export default About;