import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, Bell, Calendar } from "lucide-react";
import AnnouncementService from "../../../../services/AnnouncementService";

// Interface for type safety
interface Announcement {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  priority?: string; // Optional if you have this field
}

export default function AnnouncementsTab({ classId }: { classId: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetch = async () => {
      try {
        const res = await AnnouncementService.getStudentAnnouncements(classId);
        
        if (isMounted) {
            // Handle various response structures safely
            if (res.data) {
                setAnnouncements(Array.isArray(res.data) ? res.data : [res.data]);
            } else if (Array.isArray(res)) {
                setAnnouncements(res);
            } else {
                setAnnouncements([]);
            }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetch();
    return () => { isMounted = false; };
  }, [classId]);

  // Native Date Formatter
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit' 
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-6 h-6 border-2 border-brand-coral border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
          Checking for updates...
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-6"
    >
      {/* Header Section */}
      <div className="flex items-center gap-3 sm:mb-8 mb-6">
        <div className="p-2.5 sm:p-3 bg-brand-coral/10 rounded-2xl text-brand-coral">
          <Megaphone size={20} className="opacity-90" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-brand-prussian tracking-tight">
          Class Updates
        </h2>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {announcements.length > 0 ? (
            announcements.map((item) => (
            <div 
                key={item._id} 
                className="bg-white p-5 sm:p-7 rounded-[1.5rem] sm:rounded-[2rem] border border-brand-aliceBlue shadow-sm relative overflow-hidden group hover:border-brand-coral/30 hover:shadow-md transition-all duration-300"
            >
                {/* Background Decorative Bell */}
                <div className="absolute -top-2 -right-2 p-6 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity pointer-events-none transform rotate-12">
                    <Bell size={80} strokeWidth={1.5} />
                </div>

                {/* Meta Row */}
                <div className="flex flex-wrap items-center gap-3 mb-3 sm:mb-4">
                    <span className="bg-brand-aliceBlue text-brand-prussian text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                        Notice
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                        <Calendar size={12} />
                        <span>{formatDate(item.createdAt)}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <h4 className="text-base sm:text-lg font-bold text-brand-prussian mb-2 group-hover:text-brand-coral transition-colors">
                        {item.title}
                    </h4>
                    
                    <p className="text-gray-500 leading-relaxed text-sm font-normal whitespace-pre-line">
                        {item.content}
                    </p>
                </div>
            </div>
            ))
        ) : (
            <div className="bg-white rounded-[2rem] p-10 sm:p-20 text-center border-2 border-dashed border-brand-aliceBlue flex flex-col items-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Bell className="text-gray-300" size={24} />
                </div>
                <h3 className="text-gray-900 font-semibold mb-1">All Caught Up!</h3>
                <p className="text-gray-400 text-sm">No announcements have been posted yet.</p>
            </div>
        )}
      </div>
    </motion.div>
  );
}