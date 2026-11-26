import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Megaphone,
  Bell,
  Calendar,
  Clock,
  Search,
  X,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import AnnouncementService from "../../../../services/AnnouncementService";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  priority?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// --- HELPERS ---
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getRelativeTime = (dateString: string) => {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return null;
};

const isRecent = (dateString: string) => {
  const diffHours = (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60);
  return diffHours <= 48;
};

export default function AnnouncementsTab({ classId }: { classId: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchAnnouncements = async () => {
      try {
        const res = await AnnouncementService.getStudentAnnouncements(classId);

        if (isMounted) {
          if (res.data) {
            setAnnouncements(Array.isArray(res.data) ? res.data : [res.data]);
          } else if (Array.isArray(res)) {
            setAnnouncements(res);
          } else {
            setAnnouncements([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAnnouncements();
    return () => {
      isMounted = false;
    };
  }, [classId]);

  const filteredAnnouncements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return announcements;
    return announcements.filter(
      (a) =>
        a.title?.toLowerCase().includes(q) || a.content?.toLowerCase().includes(q)
    );
  }, [announcements, searchQuery]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-5 animate-pulse">
        <div className="h-16 bg-white rounded-2xl border border-gray-100" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-3xl p-6 border border-gray-100 space-y-3"
          >
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-gray-200 rounded-full" />
              <div className="h-5 w-28 bg-gray-100 rounded-full" />
            </div>
            <div className="h-6 w-2/3 bg-gray-200 rounded-lg" />
            <div className="h-4 w-full bg-gray-100 rounded-lg" />
            <div className="h-4 w-4/5 bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* --- HEADER & SEARCH BAR --- */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-brand-cerulean/10 text-brand-cerulean flex items-center justify-center shrink-0">
            <Megaphone size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-brand-prussian tracking-tight">
                Class Updates
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-aliceBlue text-brand-cerulean text-xs font-bold">
                {announcements.length}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Important notices, schedule changes & exam alerts
            </p>
          </div>
        </div>

        {announcements.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search updates..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-brand-cerulean focus:ring-2 focus:ring-brand-cerulean/15 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* --- ANNOUNCEMENTS LIST --- */}
      {filteredAnnouncements.length > 0 ? (
        <div className="space-y-4">
          {filteredAnnouncements.map((item) => {
            const priority = (item.priority || "").toLowerCase();
            const isHighPriority = priority === "high" || priority === "urgent";
            const recent = isRecent(item.createdAt);
            const relativeTime = getRelativeTime(item.createdAt);

            return (
              <motion.article
                key={item._id}
                variants={itemVariants}
                className={`group relative bg-white rounded-3xl p-5 sm:p-7 border shadow-sm hover:shadow-lg hover:shadow-brand-prussian/5 transition-all duration-300 overflow-hidden ${isHighPriority
                    ? "border-brand-coral/30"
                    : "border-gray-100 hover:border-brand-cerulean/30"
                  }`}
              >
                {/* Left Accent Bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${isHighPriority ? "bg-brand-coral" : "bg-brand-cerulean"
                    }`}
                />

                {/* Subtle Watermark Icon */}
                <div className="pointer-events-none absolute -top-3 -right-3 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity rotate-12">
                  <Bell size={88} strokeWidth={1.5} />
                </div>

                <div className="relative z-10 pl-2">
                  {/* Meta Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {isHighPriority ? (
                        <span className="inline-flex items-center gap-1 bg-red-50 text-brand-coral border border-red-100 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                          <AlertTriangle size={11} />
                          Important
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-brand-aliceBlue text-brand-prussian text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Notice
                        </span>
                      )}

                      {recent && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200/70 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                          <Sparkles size={10} />
                          New
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                      {relativeTime && (
                        <>
                          <span className="inline-flex items-center gap-1 text-brand-cerulean font-semibold">
                            <Clock size={12} />
                            {relativeTime}
                          </span>
                          <span className="text-gray-300">•</span>
                        </>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Title & Body */}
                  <h3 className="text-base sm:text-lg font-extrabold text-brand-prussian mb-2 group-hover:text-brand-cerulean transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-[15px] whitespace-pre-line">
                    {item.content}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </div>
      ) : (
        <motion.div
          variants={itemVariants}
          className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-dashed border-gray-200 flex flex-col items-center shadow-sm"
        >
          <div className="w-16 h-16 bg-brand-aliceBlue rounded-2xl flex items-center justify-center mb-4 text-brand-cerulean">
            <Bell size={28} />
          </div>
          <h3 className="text-lg font-extrabold text-brand-prussian mb-1">
            {searchQuery ? "No Matching Updates" : "All Caught Up!"}
          </h3>
          <p className="text-gray-400 text-sm max-w-sm">
            {searchQuery
              ? `No announcements matched "${searchQuery}".`
              : "No announcements have been posted for this class yet."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-5 px-5 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors"
            >
              Clear Search
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}