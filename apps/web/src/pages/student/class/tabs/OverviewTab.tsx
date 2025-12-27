import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import moment from "moment";
import { 
  Video, 
  Calendar, 
  Clock, 
  Lock, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  LayoutDashboard,
  ShieldCheck
} from "lucide-react";

interface OverviewTabProps {
  classData: any;
  sessions: any[];
}

export default function OverviewTab({ classData, sessions }: OverviewTabProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const upcomingSession = useMemo(() => {
    const now = new Date();
    return [...sessions]
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      .find(s => new Date(s.endAt) > now);
  }, [sessions]);

  const activeZoomLink = upcomingSession?.zoomJoinUrl || classData?.zoomLink;
  const activeMeetingId = upcomingSession?.zoomMeetingId || classData?.zoomMeetingId;
  const activePassword = classData?.zoomPassword;

  const handleCopyPassword = () => {
    if (activePassword) {
      navigator.clipboard.writeText(activePassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* 1. HERO SECTION */}
      <div className="bg-gradient-to-br from-brand-prussian to-[#022c3d] rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-cerulean/15 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <p className="text-green-400 text-[10px] font-bold uppercase tracking-[0.15em]">Class Status: Live Ready</p>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-semibold mb-8 leading-tight font-sinhala tracking-tight">
              {upcomingSession ? (upcomingSession.title || "Next Live Session") : "Check Back Later"}
            </h2>
            
            {upcomingSession ? (
              <div className="flex flex-wrap gap-4 mb-10">
                <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl backdrop-blur-md border border-white/10">
                  <Calendar size={18} className="text-brand-jasmine/80" />
                  <span className="text-sm font-medium text-brand-aliceBlue">{moment(upcomingSession.startAt).format("MMM DD, YYYY")}</span>
                </div>
                <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl backdrop-blur-md border border-white/10">
                  <Clock size={18} className="text-brand-coral/80" />
                  <span className="text-sm font-medium text-brand-aliceBlue">{moment(upcomingSession.startAt).format("h:mm A")}</span>
                </div>
              </div>
            ) : (
              <p className="text-brand-aliceBlue/60 mb-10 max-w-sm font-normal leading-relaxed">
                No live sessions are currently scheduled. Past recordings are available in the recordings tab.
              </p>
            )}

            {activeZoomLink ? (
              <a 
                href={activeZoomLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-brand-cerulean hover:bg-brand-cerulean/90 text-white font-medium py-4 px-10 rounded-2xl transition-all shadow-lg shadow-brand-cerulean/20 transform hover:-translate-y-0.5 w-full sm:w-auto justify-center group"
              >
                <Video size={20} className="opacity-90" /> 
                Join Live Classroom
              </a>
            ) : (
              <button disabled className="inline-flex items-center gap-3 bg-white/5 text-gray-400 font-medium py-4 px-10 rounded-2xl cursor-not-allowed border border-white/5">
                <Lock size={20} /> Portal Not Open
              </button>
            )}
          </div>

          {/* 2. ZOOM ACCESS PANEL */}
          <div className="bg-white/[0.03] rounded-[2rem] p-8 backdrop-blur-xl border border-white/10 shadow-inner">
            <div className="flex items-center gap-2 mb-8 text-brand-jasmine/90">
                <ShieldCheck size={18} />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em]">Security Credentials</h3>
            </div>
            
            <div className="space-y-8">
              <div>
                <p className="text-[10px] text-brand-aliceBlue/40 mb-2 uppercase font-medium tracking-widest">Meeting ID</p>
                <p className="font-mono text-2xl font-semibold tracking-wide select-all text-brand-aliceBlue">{activeMeetingId || "N/A"}</p>
              </div>
              
              <div>
                <p className="text-[10px] text-brand-aliceBlue/40 mb-2 uppercase font-medium tracking-widest">Passcode</p>
                <div className="flex items-center gap-4">
                  <p className="font-mono text-2xl font-semibold tracking-widest text-brand-aliceBlue">
                    {activePassword 
                      ? (showPassword ? activePassword : "••••••") 
                      : "---"
                    }
                  </p>
                  {activePassword && (
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                      <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-brand-aliceBlue/70"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button 
                        onClick={handleCopyPassword}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-brand-aliceBlue/70"
                      >
                        {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-10 pt-6 border-t border-white/5">
                <p className="text-[10px] text-brand-aliceBlue/30 leading-relaxed font-normal italic">
                    Credentials are for personal use only. Sharing will result in immediate access revocation.
                </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. QUICK INSIGHTS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-brand-aliceBlue flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-brand-aliceBlue/50 rounded-2xl flex items-center justify-center text-brand-cerulean">
                <LayoutDashboard size={22} className="opacity-80" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Module Progress</p>
                <h4 className="text-lg font-semibold text-brand-prussian">{sessions.length} Sessions Available</h4>
            </div>
        </div>
      </div>
    </motion.div>
  );
}