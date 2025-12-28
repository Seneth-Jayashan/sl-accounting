import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  BookOpen, Calendar, Clock, Video, FileText, 
  AlertCircle, CheckCircle, DollarSign, ArrowRight 
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import UserService, { type StudentDashboardData } from "../../services/UserService";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
// --- Components ---

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
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group h-full ${isAlert ? 'ring-2 ring-red-100' : ''}`}>
      <div className="flex justify-between items-start">
        <div>
            <div className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wide">{title}</div>
            <div className="text-2xl font-extrabold text-gray-800">{value}</div>
            {subValue && <div className="text-sm font-semibold text-gray-600 mt-0.5">{subValue}</div>}
        </div>
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100`}>
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

function SkeletonCard() {
  return <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-36 animate-pulse"></div>;
}

// --- Main Page ---

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const dashboardData = await UserService.getStudentDashboard();
        console.log(dashboardData);
        setData(dashboardData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Hello, {user?.firstName}! 👋
                </h1>
                <p className="text-gray-500 text-sm mt-1">Here's your academic overview.</p>
            </div>
            <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-2">
                <Calendar size={16} className="text-brand-cerulean"/> 
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
                <>
                    <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                </>
            ) : (
                <>
                    {/* 1. Active Classes */}
                    <StatCard 
                        title="Enrolled Classes" 
                        value={data?.stats.activeClasses || 0} 
                        hint="Active Courses" 
                        icon={BookOpen} 
                        colorClass="bg-brand-cerulean"
                    />

                    {/* 2. Next Session */}
                    <StatCard 
                        title="Next Session" 
                        value={data?.nextSession ? formatTime(data.nextSession.startTime) : "No Sessions"}
                        subValue={data?.nextSession ? formatDate(data.nextSession.startTime) : ""}
                        hint={data?.nextSession?.title || "Relax, no classes soon."} 
                        icon={Clock} 
                        colorClass="bg-brand-jasmine"
                    />

                    {/* 3. Pending Payments & Next Date */}
                    <StatCard 
                        title="Payments Due" 
                        value={data?.stats.pendingPaymentsCount || 0}
                        subValue={data?.nextPayment ? `Next: ${formatDate(data.nextPayment.dueDate)}` : ""}
                        hint={(data?.stats.pendingPaymentsCount ?? 0) > 0 ? "Action Required" : "All Clear"} 
                        icon={DollarSign} 
                        colorClass={(data?.stats.pendingPaymentsCount ?? 0) > 0 ? "bg-red-500" : "bg-emerald-500"}
                        isAlert={(data?.stats.pendingPaymentsCount ?? 0) > 0}
                    />

                    {/* 4. Attendance */}
                    <StatCard 
                        title="Attendance" 
                        value={`${data?.stats.attendancePercentage || 0}%`} 
                        hint="Last 30 Days" 
                        icon={CheckCircle} 
                        colorClass="bg-emerald-500"
                    />
                </>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Upcoming Schedule */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                            <Calendar className="text-brand-cerulean" size={20}/> Schedule
                        </h2>
                        <Link to="/student/classes" className="text-xs font-bold text-brand-cerulean hover:underline">Full Schedule</Link>
                    </div>
                    
                    {loading ? (
                        <div className="space-y-3 animate-pulse">
                            {[1, 2].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl"></div>)}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {data?.upcomingSessions.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm">No upcoming sessions.</div>
                            ) : (
                                data?.upcomingSessions.map((session, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-brand-cerulean/30 hover:shadow-md transition-all bg-gray-50/30">
                                        <div className="flex items-start gap-4 mb-3 sm:mb-0">
                                            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-brand-aliceBlue text-brand-cerulean flex flex-col items-center justify-center font-bold shadow-sm">
                                                <span className="text-xs uppercase">{new Date(session.startTime).toLocaleString('default', { month: 'short' })}</span>
                                                <span className="text-lg leading-none">{new Date(session.startTime).getDate()}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800">{session.title}</h4>
                                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                    <span className="flex items-center gap-1"><Clock size={12}/> {formatTime(session.startTime)}</span>
                                                    {session.subject && <span className="capitalize px-2 py-0.5 bg-gray-100 rounded-full">{session.subject}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <Link 
                                                to={`/student/classes/${session._id}`}
                                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-bold rounded-xl hover:bg-brand-cerulean hover:text-white hover:border-transparent transition-all"
                                            >
                                                View Class <ArrowRight size={14} />
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Recent Materials */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                            <BookOpen className="text-brand-cerulean" size={20}/> Recent Materials
                        </h2>
                        <Link to="/student/classes" className="text-xs font-bold text-brand-cerulean hover:underline">View Library</Link>
                    </div>

                    <div className="space-y-3">
                        {!loading && data?.recentMaterials.map((material) => (
                            <a 
                                key={material._id} 
                                href={BASE_URL + material.fileUrl}
                                target="_blank"
                                rel="noreferrer" 
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${material.fileType === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                                        {material.fileType === 'pdf' ? <FileText size={20} /> : <Video size={20} />}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-800 group-hover:text-brand-cerulean transition-colors">{material.title}</h4>
                                        <span className="text-xs text-gray-400">Added {formatDate(material.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-cerulean text-xs font-bold px-3 py-1 bg-brand-aliceBlue rounded-full">
                                    Open
                                </div>
                            </a>
                        ))}
                        {!loading && data?.recentMaterials.length === 0 && (
                             <div className="text-center py-6 text-gray-400 text-sm">No new materials.</div>
                        )}
                    </div>
                </div>

            </div>

            {/* Right Sidebar: Payments Widget */}
            <aside className="space-y-6">
                
                {/* Pending Payments Alert */}
                <div className="bg-gradient-to-br from-brand-prussian to-[#0a2e38] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    
                    <h3 className="font-bold text-lg mb-4 relative z-10 flex items-center gap-2">
                        <AlertCircle className="text-brand-jasmine"/> Payment Status
                    </h3>
                    
                    {data?.nextPayment ? (
                        <div className="relative z-10">
                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 mb-4">
                                <p className="text-brand-jasmine font-bold text-xl">LKR {data.nextPayment.amount}</p>
                                <p className="text-white/80 text-sm">{data.nextPayment.title}</p>
                                <div className="mt-2 text-xs text-white/50 border-t border-white/10 pt-2">
                                    Due: {new Date(data.nextPayment.dueDate).toLocaleDateString()}
                                </div>
                            </div>
                            <Link to="/student/payments" className="block w-full text-center py-2.5 bg-brand-jasmine text-brand-prussian font-bold rounded-xl hover:bg-white transition-colors">
                                Pay Now
                            </Link>
                        </div>
                    ) : (
                         <div className="relative z-10 py-4">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-3">
                                <CheckCircle className="text-emerald-400" />
                            </div>
                            <p className="text-white/90 font-medium">All payments cleared.</p>
                            <p className="text-white/50 text-xs mt-1">Thank you!</p>
                        </div>
                    )}
                </div>

            </aside>
        </div>
      </div>
  );
}