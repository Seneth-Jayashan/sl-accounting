import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { FaWindows, FaApple, FaLinux, FaAndroid } from "react-icons/fa";

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

const HeaderSection = () => (
  <header className="relative w-full pt-32 pb-20 px-4 sm:px-6 flex flex-col items-center justify-center text-center overflow-hidden">
    <div className="absolute top-[-10%] right-[-10%] w-64 h-64 sm:w-[600px] sm:h-[600px] bg-brand-cerulean/5 rounded-full blur-[60px] sm:blur-[120px] pointer-events-none" />
    <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 sm:w-[500px] sm:h-[500px] bg-brand-coral/10 rounded-full blur-[50px] sm:blur-[100px] pointer-events-none" />

    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="relative z-10 max-w-4xl mx-auto"
    >
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-brand-cerulean/20 mb-6 shadow-sm backdrop-blur-md">
        <Download size={14} className="text-brand-coral" />
        <span className="text-[10px] sm:text-xs font-bold text-brand-cerulean tracking-widest uppercase font-sans">Get the App</span>
      </div>
      
      <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-brand-prussian mb-6 font-sinhala leading-tight">
        Download <br/>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cerulean to-brand-coral">
          SL Accounting LMS
        </span>
      </h1>
      
      <p className="text-base sm:text-lg md:text-xl text-gray-500 font-sans max-w-2xl mx-auto leading-relaxed px-2">
        Experience seamless learning across all your devices. Choose your platform below and download the official application.
      </p>
    </motion.div>
  </header>
);

const downloadsData = [
  {
    id: "windows",
    title: "Windows",
    icon: FaWindows,
    color: "bg-blue-50 text-blue-600 border-blue-100",
    description: "For Windows 10 & 11",
    files: [
      {
        name: "Download .exe (Recommended)",
        filename: "SL.Accounting.LMS_1.0.49_x64-setup.exe",
        description: "Standard installer for most Windows users."
      },
      {
        name: "Download .msi",
        filename: "SL.Accounting.LMS_1.0.49_x64_en-US.msi",
        description: "For system administrators and enterprise deployment."
      }
    ]
  },
  {
    id: "macos",
    title: "macOS",
    icon: FaApple,
    color: "bg-gray-50 text-gray-800 border-gray-200",
    description: "For Apple Silicon (M1/M2/M3) Macs",
    files: [
      {
        name: "Download .dmg (Recommended)",
        filename: "SL.Accounting.LMS_1.0.49_aarch64.dmg",
        description: "Standard disk image installer for macOS."
      },
      {
        name: "Download .tar.gz",
        filename: "SL.Accounting.LMS_aarch64.app.tar.gz",
        description: "Portable application archive."
      }
    ]
  },
  {
    id: "linux",
    title: "Linux",
    icon: FaLinux,
    color: "bg-orange-50 text-orange-600 border-orange-100",
    description: "For all major Linux distributions",
    files: [
      {
        name: "Download .deb",
        filename: "SL.Accounting.LMS_1.0.49_amd64.deb",
        description: "For Debian, Ubuntu, Linux Mint and derivatives."
      },
      {
        name: "Download .rpm",
        filename: "SL.Accounting.LMS-1.0.49-1.x86_64.rpm",
        description: "For Red Hat, Fedora, CentOS and derivatives."
      },
      {
        name: "Download .AppImage",
        filename: "SL.Accounting.LMS_1.0.49_amd64.AppImage",
        description: "Portable format that works on most Linux distributions."
      }
    ]
  },
  {
    id: "android",
    title: "Android",
    icon: FaAndroid,
    color: "bg-green-50 text-green-600 border-green-100",
    description: "For Android smartphones and tablets",
    files: [
      {
        name: "Download APK",
        filename: "sl-accounting-android.apk",
        description: "Direct download for sideloading on Android devices."
      }
    ]
  }
];

const DownloadsList = () => (
  <section className="w-full py-16 sm:py-24 px-4 sm:px-6 bg-brand-aliceBlue/30 relative">
    <div className="container mx-auto max-w-6xl">
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8"
      >
        {downloadsData.map((platform) => (
          <motion.div 
            key={platform.id}
            variants={fadeInUp} 
            className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-xl border border-white hover:border-brand-cerulean/20 transition-all flex flex-col"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 ${platform.color} border rounded-2xl flex items-center justify-center text-3xl shadow-sm`}>
                <platform.icon />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-brand-prussian font-sans">{platform.title}</h3>
                <p className="text-gray-500 font-sans text-sm">{platform.description}</p>
              </div>
            </div>
            
            <div className="space-y-4 flex-1">
              {platform.files.map((file, idx) => (
                <div key={idx} className="bg-brand-aliceBlue/50 p-4 rounded-xl border border-gray-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-bold text-brand-prussian text-sm sm:text-base font-sans">{file.name}</h4>
                      <p className="text-gray-500 text-xs sm:text-sm font-sans mt-1">{file.description}</p>
                    </div>
                    <a 
                      href={`/releases/${file.filename}`}
                      download
                      className="inline-flex shrink-0 items-center gap-2 bg-brand-cerulean hover:bg-brand-prussian text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors w-full sm:w-auto justify-center"
                    >
                      <Download size={16} /> Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

const Downloads = () => {
  return (
    <div className="w-full bg-brand-aliceBlue/20 selection:bg-brand-cerulean selection:text-white min-h-screen">
      <HeaderSection />
      <DownloadsList />
    </div>
  );
};

export default Downloads;
