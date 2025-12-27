import { motion } from "framer-motion";
import { 
  Award, 
  BookOpen, 
  Target, 
  Users, 
  CheckCircle2, 
  GraduationCap,
  Sparkles,
  Play
} from "lucide-react";

// --- Animation Variants ---
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

const AboutHero = () => (
  <section className="relative w-full py-32 px-6 flex flex-col items-center justify-center text-center overflow-hidden">
    {/* Background Blobs matching Home Page theme */}
    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-cerulean/5 rounded-full blur-[120px] pointer-events-none" />
    <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand-coral/10 rounded-full blur-[100px] pointer-events-none" />

    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeInUp}
      className="relative z-10 max-w-4xl mx-auto"
    >
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-brand-cerulean/20 mb-6 shadow-sm backdrop-blur-sm">
        <Sparkles size={14} className="text-brand-coral" />
        <span className="text-xs font-bold text-brand-cerulean tracking-widest uppercase font-sans">Our Story</span>
      </div>
      
      <h1 className="text-4xl md:text-6xl font-black text-brand-prussian mb-6 font-sinhala leading-tight">
        Shaping the Future of <br/>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cerulean to-brand-coral">
          Accountancy in Sri Lanka
        </span>
      </h1>
      
      <p className="text-lg md:text-xl text-gray-500 font-sans max-w-2xl mx-auto leading-relaxed">
        We are dedicated to simplifying complex accounting concepts, making A/L success accessible to every student through innovation, technology, and expert guidance.
      </p>
    </motion.div>
  </section>
);

const InstructorSection = () => (
  <section className="w-full py-20 px-6 bg-white relative">
    <div className="container mx-auto max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Image Side */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative order-2 lg:order-1"
        >
           {/* Decorative Backdrops */}
           <div className="absolute -inset-4 bg-gradient-to-tr from-brand-cerulean to-brand-coral opacity-20 blur-2xl rounded-[3rem] -z-10"></div>
           
           <div className="w-full aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white relative group bg-brand-aliceBlue">
              {/* Replace with actual image path */}
              <img 
                src="/kalumwaduge.jpg" 
                alt="Kalum Waduge" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              
              {/* Overlay Details */}
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-brand-prussian/95 via-brand-prussian/70 to-transparent p-8 pt-24 text-white">
                 <h3 className="text-3xl font-bold mb-1 font-sans">Kalum Waduge</h3>
                 <p className="text-brand-jasmine font-bold tracking-wider text-sm mb-4 uppercase">Lead Instructor</p>
                 <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs border border-white/30 font-medium">BSc. Accounting (Sp) USJ</span>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs border border-white/30 font-medium">10+ Years Exp</span>
                 </div>
              </div>
           </div>
        </motion.div>

        {/* Content Side */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="order-1 lg:order-2"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-brand-prussian mb-6 font-sinhala leading-tight">
            ගුරුවරයෙකුට වඩා <br/><span className="text-brand-cerulean">මඟ පෙන්වන්නෙක්</span>
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-6 font-sans text-justify">
            Kalum Waduge is not just a teacher but a mentor who has guided thousands of students to achieve their dream results in A/L Accounting. A graduate of the University of Sri Jayewardenepura, he combines academic excellence with practical teaching methodologies.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed mb-8 font-sinhala text-justify bg-brand-aliceBlue/50 p-6 rounded-2xl border-l-4 border-brand-cerulean">
            "ගිණුම්කරණය හුදු විෂයයක් ලෙස නොව, ප්‍රායෝගික ජීවිතයට අදාළ කරගනිමින් තර්කානුකූලව උගන්වන ශෛලිය නිසා ඔහු සිසුන් අතර ඉමහත් ජනප්‍රියත්වයට පත්ව ඇත."
          </p>

          <div className="space-y-4 mb-8">
             {[
                "University Lecturer & Resource Person",
                "Proven Track Record of Island Ranks",
                "Author of 'Accounting Master' Series"
             ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 group">
                   <div className="w-8 h-8 rounded-full bg-brand-aliceBlue flex items-center justify-center text-brand-cerulean group-hover:bg-brand-cerulean group-hover:text-white transition-colors">
                      <CheckCircle2 size={18} />
                   </div>
                   <span className="text-brand-prussian font-medium font-sans group-hover:translate-x-1 transition-transform">{item}</span>
                </div>
             ))}
          </div>
        </motion.div>

      </div>
    </div>
  </section>
);

const VisionMission = () => (
  <section className="w-full py-24 px-6 bg-brand-aliceBlue/30">
    <div className="container mx-auto max-w-6xl">
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        {/* Mission Card */}
        <motion.div variants={fadeInUp} className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-white hover:border-brand-cerulean/30 transition-all group relative overflow-hidden">
           <div className="absolute -top-10 -right-10 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500 rotate-12">
              <Target size={200} className="text-brand-cerulean" />
           </div>
           
           <div className="w-16 h-16 bg-brand-aliceBlue rounded-2xl flex items-center justify-center text-brand-cerulean mb-6 shadow-sm">
              <Target size={32} />
           </div>
           
           <h3 className="text-2xl font-bold text-brand-prussian mb-4 font-sans">Our Mission</h3>
           <p className="text-gray-600 leading-relaxed font-sans">
             To provide high-quality, accessible, and comprehensive accounting education to every A/L student in Sri Lanka, empowering them to secure their university dreams through state-of-the-art LMS technology.
           </p>
        </motion.div>

        {/* Vision Card */}
        <motion.div variants={fadeInUp} className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-white hover:border-brand-coral/30 transition-all group relative overflow-hidden">
           <div className="absolute -top-10 -right-10 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500 rotate-12">
              <Award size={200} className="text-brand-coral" />
           </div>

           <div className="w-16 h-16 bg-brand-coral/10 rounded-2xl flex items-center justify-center text-brand-coral mb-6 shadow-sm">
              <Award size={32} />
           </div>
           
           <h3 className="text-2xl font-bold text-brand-prussian mb-4 font-sans">Our Vision</h3>
           <p className="text-gray-600 leading-relaxed font-sans">
             To be the number one online accounting education platform in Sri Lanka, producing the highest number of Chartered Accountants and future business leaders for the nation.
           </p>
        </motion.div>
      </motion.div>
    </div>
  </section>
);

const MethodologySection = () => (
  <section className="w-full py-24 px-6 bg-white relative">
    <div className="container mx-auto max-w-5xl text-center">
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         whileInView={{ opacity: 1, y: 0 }}
         viewport={{ once: true }}
         className="mb-16"
       >
          <h2 className="text-3xl md:text-5xl font-bold text-brand-prussian mb-6 font-sinhala">
            ඉගැන්වීම් ක්‍රමවේදය
          </h2>
          <div className="h-1.5 w-24 bg-gradient-to-r from-brand-cerulean to-brand-coral mx-auto rounded-full"></div>
          <p className="mt-6 text-gray-500 max-w-2xl mx-auto">
            Our teaching methodology is scientifically designed to help students master Accounting from basics to advanced application.
          </p>
       </motion.div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
               icon: BookOpen, 
               title: "Theory to Practice", 
               desc: "We connect every accounting standard to real-world business scenarios for better retention.",
               color: "bg-blue-50 text-brand-cerulean"
            },
            {
               icon: GraduationCap, 
               title: "Exam Mastery", 
               desc: "Specific techniques to manage time and answer questions accurately to score maximum marks.",
               color: "bg-pink-50 text-brand-coral"
            },
            {
               icon: Users, 
               title: "Personal Attention", 
               desc: "Despite being an online platform, we monitor individual student progress through LMS analytics.",
               color: "bg-yellow-50 text-yellow-600"
            }
          ].map((item, idx) => (
             <motion.div 
               key={idx}
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: idx * 0.2 }}
               className="flex flex-col items-center bg-white p-8 rounded-3xl border border-gray-100 shadow-lg hover:shadow-xl transition-all hover:-translate-y-2"
             >
                <div className={`w-20 h-20 ${item.color} rounded-full flex items-center justify-center mb-6 shadow-sm`}>
                   <item.icon size={36} />
                </div>
                <h3 className="text-xl font-bold text-brand-prussian mb-3 font-sans">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed text-center font-sans">{item.desc}</p>
             </motion.div>
          ))}
       </div>
    </div>
  </section>
);

const CTABanner = () => (
    <section className="w-full py-16 px-6">
        <div className="container mx-auto max-w-6xl">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-brand-prussian rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-brand-cerulean rounded-full blur-[100px] opacity-40"></div>
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-brand-coral rounded-full blur-[100px] opacity-40"></div>
                
                <div className="relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 font-sinhala">
                        ඔබේ සිහිනය සැබෑ කරගන්න <br/> අදම අප හා එක්වන්න
                    </h2>
                    <p className="text-brand-aliceBlue/80 mb-10 max-w-xl mx-auto font-sans">
                        Join the fastest growing online accounting community in Sri Lanka.
                    </p>
                    <button className="bg-white text-brand-prussian px-8 py-4 rounded-xl font-bold text-lg hover:bg-brand-jasmine transition-colors shadow-xl flex items-center gap-2 mx-auto">
                        <Play size={20} fill="currentColor" /> Start Learning Now
                    </button>
                </div>
            </motion.div>
        </div>
    </section>
);

const About = () => {
  return (
    // No Navbar/Footer needed here as they are in MainLayout
    <div className="w-full bg-brand-aliceBlue/20">
       <AboutHero />
       <InstructorSection />
       <VisionMission />
       <MethodologySection />
       <CTABanner />
    </div>
  );
};

export default About;