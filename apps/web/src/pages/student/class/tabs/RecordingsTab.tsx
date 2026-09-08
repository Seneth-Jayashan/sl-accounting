import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayCircle, Video, Calendar, Lock, AlertCircle, ChevronDown, Folder } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EnrollmentService, { type EnrollmentResponse } from "../../../../services/EnrollmentService";

// Helper to format dates safely
const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Helper to get YYYY-MM from a date string
const getMonthString = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function RecordingsTab({ sessions }: { sessions: any[] }) {
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState<EnrollmentResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Enrollment to get Paid History
  useEffect(() => {
    let isMounted = true;
    const fetchEnrollment = async () => {
      try {
        const myEnrollments = await EnrollmentService.getMyEnrollments();

        if (sessions?.length > 0) {
          // 1. Find the first session in the array that actually has a 'class' property
          const sessionWithClass = sessions.find((session: any) => session.class != null);

          if (sessionWithClass) {
            const sessionClass = sessionWithClass.class;

            // 2. Extract the classId (whether it's a string or a populated object)
            const classId = typeof sessionClass === 'string' ? sessionClass : sessionClass?._id;


            if (classId) {
              // 3. Find the matching enrollment
              const match = myEnrollments.find((e: any) => {
                const enrollClassId = typeof e.class === 'string' ? e.class : e.class?._id;
                return enrollClassId === classId;
              });

              if (isMounted) setEnrollment(match || null);
            }
          } else {
            if (isMounted) setEnrollment(null);
          }
        }
      } catch (err) {
        console.error("Failed to load enrollment rights", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (sessions.length > 0) fetchEnrollment();
    else setLoading(false);

    return () => { isMounted = false; };
  }, [sessions]);

  // 2. Filter & Sort Recordings
  const recordings = useMemo(() => {
    return sessions
      .filter(s => s.youtubeVideoId || s.recordingUrl)
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [sessions]);

  // 3. STRICT MONTHLY ACCESS LOGIC
  const getAccessStatus = (session: any) => {
    if (!enrollment) return { locked: true, reason: "Not Enrolled" };

    // A. Check Join Date (Optional: Prevent accessing content from before they joined at all)
    // You can disable this if you want back-payments to unlock old content regardless of join date.
    /*
    const sessionDate = new Date(session.startAt);
    const joinDate = new Date(enrollment.createdAt);
    if (sessionDate < joinDate) {
        return { locked: true, reason: "Session occurred before you joined" };
    }
    */

    // B. Check Payment for Specific Month
    const sessionMonth = getMonthString(session.startAt); // e.g. "2026-02"
    const paidMonths = enrollment.paidMonths || [];

    if (!paidMonths.includes(sessionMonth)) {
      // Format readable month name for the error message
      const monthName = new Date(session.startAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return { locked: true, reason: `Payment required for ${monthName}` };
    }

    return { locked: false, reason: "" };
  };

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Group by Month and Category
  const groupedRecordings = useMemo(() => {
    const grouped: { month: string, sortDate: number, categories: { category: string, sessions: any[] }[] }[] = [];

    recordings.forEach(session => {
      const monthName = new Date(session.startAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const categoryName = session.recordingCategory || "General";

      let monthObj = grouped.find(g => g.month === monthName);
      if (!monthObj) {
        monthObj = { month: monthName, sortDate: new Date(session.startAt).getTime(), categories: [] };
        grouped.push(monthObj);
      }

      let catObj = monthObj.categories.find(c => c.category === categoryName);
      if (!catObj) {
        catObj = { category: categoryName, sessions: [] };
        monthObj.categories.push(catObj);
      }

      catObj.sessions.push(session);
    });

    grouped.sort((a, b) => b.sortDate - a.sortDate);
    grouped.forEach(g => {
      g.categories.sort((a, b) => a.category.localeCompare(b.category));
      g.categories.forEach(c => {
        c.sessions.sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
      });
    });

    return grouped;
  }, [recordings]);

  if (loading) {
    return <div className="py-20 text-center text-gray-400 animate-pulse font-medium">Verifying Access Rights...</div>;
  }

  if (recordings.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-brand-aliceBlue shadow-sm">
        <Video className="mx-auto text-brand-aliceBlue mb-4" size={48} strokeWidth={1.5} />
        <p className="text-gray-400 font-medium text-lg">No session recordings are available yet.</p>
        <p className="text-gray-400 text-sm mt-2">Check back later when the teacher uploads new content.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {groupedRecordings.map((monthGroup, mIndex) => (
        <motion.div
          key={monthGroup.month}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: mIndex * 0.1, duration: 0.4, ease: "easeOut" }}
          className="space-y-8"
        >
          {/* Month Header */}
          <div className="flex items-center gap-4">
            <h2 className="text-2xl md:text-3xl font-black text-brand-prussian tracking-tight">{monthGroup.month}</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-brand-aliceBlue via-brand-aliceBlue to-transparent"></div>
          </div>

          <div className="space-y-6 pl-2 md:pl-4 border-l-2 border-brand-aliceBlue/50">
            {monthGroup.categories.map((catGroup, cIndex) => {
              const categoryId = `${monthGroup.month}-${catGroup.category}`;
              const isExpanded = expandedCategory === categoryId;

              return (
                <motion.div
                  key={catGroup.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: cIndex * 0.05, duration: 0.3 }}
                  className="bg-white rounded-3xl border border-brand-aliceBlue shadow-sm overflow-hidden"
                >
                  {/* Category Header */}
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : categoryId)}
                    className={`w-full flex items-center justify-between p-5 md:p-6 transition-colors ${isExpanded ? "bg-brand-aliceBlue/20" : "hover:bg-gray-50"
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center shrink-0">
                        <Folder size={24} />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg md:text-xl font-bold text-brand-prussian">{catGroup.category}</h3>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">
                          {catGroup.sessions.length} {catGroup.sessions.length === 1 ? 'Recording' : 'Recordings'}
                        </p>
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 ${isExpanded ? "bg-brand-prussian text-white rotate-180" : "bg-gray-100 text-gray-500"}`}>
                      <ChevronDown size={20} />
                    </div>
                  </button>

                  {/* Grid of Recordings */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 md:p-6 border-t border-brand-aliceBlue bg-gray-50/30">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {catGroup.sessions.map((session, sIndex) => {
                              const { locked, reason } = getAccessStatus(session);

                              const youtubeThumbnail = session.youtubeVideoId ? `https://img.youtube.com/vi/${session.youtubeVideoId}/hqdefault.jpg` : null;
                              const classBanner = typeof session.class === 'object' && session.class !== null ? (session.class.bannerUrl || session.class.imageUrl) : null;
                              const thumbnail = youtubeThumbnail || classBanner;

                              return (
                                <motion.div
                                  key={session._id}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: sIndex * 0.05, duration: 0.3 }}
                                  className={`group relative flex flex-col rounded-3xl border transition-all duration-300 overflow-hidden ${locked
                                      ? "bg-gray-50/80 border-gray-200"
                                      : "bg-white border-brand-aliceBlue shadow-sm hover:border-brand-cerulean/30 hover:shadow-lg hover:-translate-y-1"
                                    }`}
                                >
                                  {/* Thumbnail Section */}
                                  <div className="relative aspect-video w-full bg-gradient-to-br from-brand-aliceBlue to-gray-200 overflow-hidden flex items-center justify-center">
                                    {thumbnail ? (
                                      <img src={thumbnail} alt={session.recordingTitle || "Recording"} className={`w-full h-full object-cover transition-transform duration-500 ${!locked ? "group-hover:scale-105" : ""}`} />
                                    ) : (
                                      <Video size={48} className="text-gray-300" />
                                    )}

                                    {/* Overlays */}
                                    {locked ? (
                                      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center">
                                        <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                                          <Lock size={28} className="text-white" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="absolute inset-0 bg-brand-prussian/0 group-hover:bg-brand-prussian/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <div className="w-16 h-16 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-brand-cerulean transform scale-75 group-hover:scale-100 transition-all duration-300">
                                          <PlayCircle size={32} className="ml-1" strokeWidth={2.5} />
                                        </div>
                                      </div>
                                    )}

                                    {/* Category Badge */}
                                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg">
                                      {catGroup.category}
                                    </div>
                                  </div>

                                  {/* Content Section */}
                                  <div className="p-5 flex flex-col flex-1">
                                    <div className="space-y-1.5 flex-1 mb-5">
                                      <h4 className={`text-base font-bold line-clamp-2 leading-snug transition-colors ${locked ? "text-gray-400" : "text-brand-prussian group-hover:text-brand-cerulean"
                                        }`}>
                                        {session.recordingTitle || session.title || `Session ${session.index}`}
                                      </h4>
                                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        <Calendar size={13} className="mb-0.5" />
                                        {formatDate(session.startAt)}
                                      </div>
                                    </div>

                                    {locked ? (
                                      <div className="flex flex-col gap-3 mt-auto">
                                        <div className="w-full bg-gray-100/80 py-2.5 rounded-xl font-bold text-xs text-gray-500 flex items-center justify-center gap-2 border border-gray-200/80 cursor-not-allowed">
                                          <AlertCircle size={15} /> {reason}
                                        </div>
                                        <button
                                          onClick={() => navigate(`/student/payment/create/${typeof session.class === 'string' ? session.class : session.class._id}`)}
                                          className="text-[11px] font-black text-brand-cerulean uppercase tracking-wider hover:underline text-center"
                                        >
                                          Pay Now to Unlock
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => navigate(`/student/class/recording/${session._id}`)}
                                        className="w-full mt-auto bg-brand-aliceBlue/50 py-3 rounded-xl font-bold text-sm text-brand-prussian hover:bg-brand-prussian hover:text-white transition-all transform active:scale-95 shadow-sm flex items-center justify-center gap-2"
                                      >
                                        <PlayCircle size={18} /> Watch Recording
                                      </button>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}