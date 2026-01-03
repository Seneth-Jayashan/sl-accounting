import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns"; // Import date formatting
import { 
  LayoutDashboard, 
  PlayCircle, 
  FolderOpen, 
  MessageSquare, 
  Megaphone, 
  ArrowLeft,
  CreditCard 
} from "lucide-react";
import { ArrowPathIcon, LockClosedIcon } from "@heroicons/react/24/outline";

// Layouts & Services
import ClassService, { type ClassData } from "../../../services/ClassService";
import SessionService, { type SessionData } from "../../../services/SessionService";
import EnrollmentService from "../../../services/EnrollmentService"; // Import Enrollment Service
import { useAuth } from "../../../contexts/AuthContext"; // Import Auth

// Separate Tab Components
import OverviewTab from "./tabs/OverviewTab";
import RecordingsTab from "./tabs/RecordingsTab";
import ResourcesTab from "./tabs/ResourcesTab";
import AnnouncementsTab from "./tabs/ClassAnnouncementsTab";
import ChatTab from "./tabs/ChatTab";

export default function ViewClass() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user

  // State
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false); // New State for blocking UI

  // Fetch Data & Check Payment
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!id || !user) return;

      try {
        // 1. Check Payment Status First
        // We assume 'enrollInClass' gets the current enrollment record safely
        const enrollmentRes = await EnrollmentService.enrollInClass(id, user._id);
        const paidMonths = enrollmentRes.enrollment.paidMonths || [];
        const currentMonth = format(new Date(), "yyyy-MM");

        // --- SECURITY CHECK ---
        // If current month is NOT paid, block access immediately
        if (!paidMonths.includes(currentMonth)) {
            if (isMounted) {
                setAccessDenied(true); 
                setLoading(false);
                // Optional: Auto-redirect immediately
                // navigate(`/student/payment/create/${id}`, { replace: true });
            }
            return; 
        }

        // 2. If Paid, Load Class Content
        const [classRes, sessionsRes] = await Promise.all([
          ClassService.getClassById(id),
          SessionService.getSessionsByClassId(id)
        ]);
        
        if (isMounted) {
            const cls = Array.isArray(classRes) ? classRes[0] : classRes;
            setClassData(cls);

            const sess = Array.isArray(sessionsRes) ? sessionsRes : (sessionsRes as any)?.data || [];
            setSessions(sess);
        }
      } catch (err) {
        console.error("Failed to load class data", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [id, user, navigate]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'announcements', label: 'News', icon: Megaphone },
    { id: 'recordings', label: 'Recordings', icon: PlayCircle },
    { id: 'resources', label: 'Resources', icon: FolderOpen },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
  ];

  if (loading) return <LoadingState />;

  // --- RESTRICTED ACCESS VIEW ---
  if (accessDenied) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-md w-full">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <LockClosedIcon className="w-8 h-8 text-red-500" />
                  </div>
                  <h1 className="text-2xl font-black text-brand-prussian mb-2">Access Locked</h1>
                  <p className="text-gray-500 mb-8">
                      You need to pay the fees for <strong>{format(new Date(), "MMMM yyyy")}</strong> to access this class content.
                  </p>
                  
                  <button 
                      onClick={() => navigate(`/student/payment/create/${id}`)}
                      className="w-full py-4 rounded-xl font-bold text-white bg-brand-prussian hover:bg-brand-cerulean shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                      <CreditCard size={20} />
                      Pay Now to Unlock
                  </button>
                  
                  <button 
                      onClick={() => navigate(-1)}
                      className="mt-4 text-sm text-gray-400 hover:text-gray-600 font-medium"
                  >
                      Go Back
                  </button>
              </div>
          </div>
      );
  }

  return (
      <div className="min-h-screen bg-brand-aliceBlue/30 pb-24">
        
        {/* --- Sticky Navigation Header --- */}
        <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 transition-all">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            
            {/* Top Row: Back, Title & Actions */}
            <div className="py-3 flex items-center justify-between gap-4">
              
              {/* Left: Back & Title */}
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  onClick={() => navigate(-1)} 
                  className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors shrink-0"
                  aria-label="Go Back"
                >
                  <ArrowLeft size={20}/>
                </button>
                <h1 className="text-lg sm:text-xl font-black text-brand-prussian truncate">
                  {classData?.name || "Loading..."}
                </h1>
              </div>

              {/* Right: Payment Action */}
              <button
                onClick={() => navigate(`/student/payment/create/${classData?._id}`)}
                className="flex items-center gap-2 bg-brand-prussian text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-cerulean transition-all shadow-sm active:scale-95 shrink-0"
              >
                <CreditCard size={16} />
                <span className="hidden sm:inline">Payments</span>
                <span className="sm:hidden">Pay</span>
              </button>

            </div>

            {/* Bottom Row: Scrollable Tabs */}
            <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-bold transition-all whitespace-nowrap outline-none ${
                        isActive 
                            ? "border-brand-cerulean text-brand-cerulean bg-brand-aliceBlue/50" 
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        <tab.icon size={18} className={isActive ? "text-brand-cerulean" : "text-gray-400"} /> 
                        {tab.label}
                    </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* --- Content Area --- */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <AnimatePresence mode="wait">
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
            >
                {activeTab === 'overview' && <OverviewTab classData={classData} sessions={sessions} />}
                {activeTab === 'announcements' && <AnnouncementsTab classId={id!} />}
                {activeTab === 'recordings' && <RecordingsTab sessions={sessions} />}
                {activeTab === 'resources' && <ResourcesTab classId={id!} />}
                {activeTab === 'chat' && <ChatTab />}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
  );
}

const LoadingState = () => (
    <div className="flex h-[70vh] items-center justify-center flex-col gap-4">
      <ArrowPathIcon className="w-8 h-8 text-brand-cerulean animate-spin" />
      <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Loading Curriculum...</span>
    </div>
);