import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  BookOpen, Calendar, Clock, Video, FileText, 
  AlertCircle, CheckCircle, DollarSign,MapPin
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import UserService, { type StudentDashboardData } from "../../services/UserService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// --- COMPONENTS ---

// 1. Responsive Stat Card
function StatCard({ 
  title, 
  value, 
  subValue,
  hint, 
  icon: Icon, 
  colorClass,
  isAlert = false
}: { 
  title: string; 
  value: string | number; 
  subValue?: string;
  hint?: string; 
  icon: any; 
  colorClass: string;
  isAlert?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden h-full ${isAlert ? 'ring-2 ring-red-100' : ''}`}>
      <div className="flex justify-between items-start">
        <div>
            <div className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">{title}</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">{value}</div>
            {subValue && <div className="text-sm font-semibold text-gray-600 mt-0.5">{subValue}</div>}
        </div>
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100 shrink-0`}>
            <Icon size={24} className={colorClass.replace("bg-", "text-")} />
        </div>
      </div>
      
      {hint && (
        <div className={`text-xs mt-4 font-medium flex items-center gap-1 ${isAlert ? 'text-red-500' : 'text-gray-400'}`}>
            {hint}
        </div>
      )}
    </div>
  );
}

// 2. Loading Skeleton
function SkeletonCard() {
  return <div className="rounded-2xl p-5 shadow-sm border border-gray-100 h-32 animate-pulse bg-gray-50"></div>;
}

// --- MAIN PAGE ---

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const dashboardData = await UserService.getStudentDashboard();
        console.log("Dashboard Data:", dashboardData);
        if (isMounted) setData(dashboardData);
      } catch (err) {
        console.error("Dashboard Load Error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, []);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
      <div className="space-y-6 pb-20 sm:pb-0"> 
        
        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Hello, {user?.firstName}! 👋
                </h1>
                <p className="text-gray-500 text-sm mt-1">Here is your academic overview.</p>
            </div>
            {/* Hide Date on very small screens to save space, show on SM+ */}
            <div className="hidden sm:flex text-sm text-gray-500 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm items-center gap-2">
                <Calendar size={16} className="text-brand-cerulean"/> 
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
        </div>

        {/* --- STATS GRID --- */}
        {/* Mobile: 1 col, Tablet: 2 cols, Desktop: 4 cols */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
                <>
                    <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                </>
            ) : (
                <>
                    {/* Active Classes */}
                    <StatCard 
                        title="My Classes" 
                        value={data?.stats.activeClasses || 0} 
                        hint="Active Enrollments" 
                        icon={BookOpen} 
                        colorClass="bg-brand-cerulean"
                    />

                    {/* Next Session */}
                    <StatCard 
                        title="Next Session" 
                        value={data?.nextSession ? formatTime(data.nextSession.startTime) : "No Class"}
                        subValue={data?.nextSession ? formatDate(data.nextSession.startTime) : ""}
                        hint={data?.nextSession?.title || "Free time!"} 
                        icon={Clock} 
                        colorClass="bg-brand-jasmine"
                    />

                    {/* Payments */}
                    <StatCard 
                        title="Payments" 
                        value={data?.stats.pendingPaymentsCount || 0}
                        subValue={(data?.stats.pendingPaymentsCount ?? 0) > 0 ? "Pending" : "Cleared"}
                        hint={(data?.stats.pendingPaymentsCount ?? 0) > 0 ? "Action Required" : "All Settled"}
                        icon={DollarSign} 
                        colorClass={(data?.stats.pendingPaymentsCount ?? 0) > 0 ? "bg-red-500" : "bg-emerald-500"}
                        isAlert={(data?.stats.pendingPaymentsCount ?? 0) > 0}
                    />

                    
                </>
            )}
        </div>

        {/* --- MAIN CONTENT GRID --- */}
        {/* Mobile: Stacked, Desktop: 2/3 Left, 1/3 Right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* 1. SCHEDULE LIST */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                            <Calendar className="text-brand-cerulean" size={20}/> Schedule
                        </h2>
                        <Link to="/student/classes" className="text-xs font-bold text-brand-cerulean hover:underline">View All</Link>
                    </div>
                    
                    {loading ? (
                        <div className="space-y-3 animate-pulse">
                            {[1, 2].map(i => <div key={i} className="h-20 bg-gray-50 rounded-xl"></div>)}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {(!data?.upcomingSessions || data.upcomingSessions.length === 0) ? (
                                <div className="text-center py-10 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    No upcoming sessions scheduled.
                                </div>
                            ) : (
                                data.upcomingSessions.map((session, idx) => (
                                    // Mobile: Stacked (flex-col), Desktop: Row (flex-row)
                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-brand-cerulean/30 hover:shadow-md transition-all bg-gray-50/30 gap-4">
                                        
                                        {/* Date & Info */}
                                        <div className="flex items-start gap-4">
                                            {/* Date Box */}
                                            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white border border-gray-200 text-brand-cerulean flex flex-col items-center justify-center font-bold shadow-sm">
                                                <span className="text-[10px] uppercase text-gray-500">{new Date(session.startTime).toLocaleString('default', { month: 'short' })}</span>
                                                <span className="text-xl leading-none">{new Date(session.startTime).getDate()}</span>
                                            </div>
                                            
                                            {/* Text */}
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-sm sm:text-base line-clamp-1">{session.title}</h4>
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                                                    <span className="flex items-center gap-1 font-medium text-brand-prussian">
                                                        <Clock size={12}/> {formatTime(session.startTime)}
                                                    </span>
                                                    {session.subject && (
                                                        <span className="px-2 py-0.5 bg-gray-200 rounded-full">{session.subject}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Action Button - Full width on mobile */}
                                        <div className="w-full sm:w-auto">
                                            {session.isOnline ? (
                                                <Link 
                                                    to={`/student/class/${session._id}`}
                                                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 bg-brand-cerulean text-white text-sm font-bold rounded-xl hover:bg-brand-prussian transition-all active:scale-95"
                                                >
                                                    <Video size={16} /> View Class
                                                </Link>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 bg-gray-100 text-gray-500 text-sm font-bold rounded-xl">
                                                    <MapPin size={16} /> Offline
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* 2. RECENT MATERIALS */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                            <BookOpen className="text-brand-cerulean" size={20}/> Recent Materials
                        </h2>
                        <Link to="/student/classes" className="text-xs font-bold text-brand-cerulean hover:underline">Library</Link>
                    </div>

                    <div className="space-y-3">
                        {!loading && data?.recentMaterials.map((material) => (
                            <a 
                                key={material._id} 
                                href={BASE_URL + material.fileUrl} // Using url from interface
                                target="_blank"
                                rel="noreferrer" 
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`p-2.5 rounded-lg shrink-0 ${material.fileType === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                        {material.fileType === 'pdf' ? <FileText size={20} /> : <Video size={20} />}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-medium text-gray-800 text-sm truncate group-hover:text-brand-cerulean transition-colors">{material.title}</h4>
                                        <span className="text-xs text-gray-400">Added {formatDate(material.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity text-brand-cerulean text-xs font-bold px-3 py-1 bg-brand-aliceBlue rounded-full">
                                    Open
                                </div>
                            </a>
                        ))}
                        {!loading && (!data?.recentMaterials || data.recentMaterials.length === 0) && (
                             <div className="text-center py-6 text-gray-400 text-sm">No new materials.</div>
                        )}
                    </div>
                </div>

            </div>

            {/* RIGHT COLUMN (Sidebar) */}
            <aside className="space-y-6">
                
                {/* 1. PAYMENT ALERT WIDGET */}
                <div className="bg-gradient-to-br from-brand-prussian to-[#0a2e38] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    
                    <h3 className="font-bold text-lg mb-4 relative z-10 flex items-center gap-2">
                        <AlertCircle className="text-brand-jasmine"/> Payment Status
                    </h3>
                    
                    {data?.nextPayment ? (
                        <div className="relative z-10">
                            {/* Alert Box */}
                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 mb-4">
                                <div className="flex justify-between items-end mb-1">
                                    <span className="text-xs text-white/70 uppercase">Amount Due</span>
                                    <span className="text-brand-jasmine font-bold text-xl">LKR {data.nextPayment.amount}</span>
                                </div>
                            </div>
                            
                            {/* Action Button */}
                            <Link to="/student/payments" className="block w-full text-center py-3 bg-brand-jasmine text-brand-prussian font-bold rounded-xl hover:bg-white transition-colors text-sm shadow-md">
                                View & Pay
                            </Link>
                        </div>
                    ) : (
                         <div className="relative z-10 py-4 flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-3">
                                <CheckCircle className="text-emerald-400" />
                            </div>
                            <p className="text-white/90 font-medium text-sm">All payments cleared.</p>
                            <p className="text-white/50 text-xs mt-1">Access valid until end of month.</p>
                        </div>
                    )}
                </div>

                {/* 2. QUICK LINKS (Desktop Only) */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hidden lg:block">
                     <h3 className="font-bold text-gray-800 mb-3 text-sm">Quick Actions</h3>
                     <div className="space-y-2">
                        <Link to="/student/profile" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-600 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                <span className="text-xs">👤</span>
                            </div>
                            Edit Profile
                        </Link>
                        <Link to="/student/payments" className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-600 transition-colors">
                             <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                <span className="text-xs">📜</span>
                            </div>
                            Payment History
                        </Link>
                     </div>
                </div>

            </aside>
        </div>
      </div>
  );
}