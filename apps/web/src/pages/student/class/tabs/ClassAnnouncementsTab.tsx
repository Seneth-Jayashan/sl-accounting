import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, Bell } from "lucide-react";
import moment from "moment";
import AnnouncementService from "../../../../services/AnnouncementService";

export default function AnnouncementsTab({ classId }: { classId: string }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await AnnouncementService.getStudentAnnouncements(classId);
        
        if (res.data) {
          setAnnouncements(Array.isArray(res.data) ? res.data : [res.data]);
        } else {
          setAnnouncements([]);
        }
        
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [classId]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="text-sm font-medium text-gray-400 animate-pulse uppercase tracking-widest">
          Syncing updates...
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
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-brand-coral/10 rounded-2xl text-brand-coral">
          <Megaphone size={22} className="opacity-90" />
        </div>
        <h2 className="text-2xl font-semibold text-brand-prussian tracking-tight">
          Class Updates
        </h2>
      </div>

      {announcements.length > 0 ? (
        announcements.map((item) => (
          <div 
            key={item._id} 
            className="bg-white p-7 rounded-[2rem] border border-brand-aliceBlue shadow-sm relative overflow-hidden group hover:border-brand-coral/20 transition-colors"
          >
            {/* Background Decorative Bell */}
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
                <Bell size={80} strokeWidth={1.5} />
            </div>

            <div className="flex items-center gap-3 mb-4">
              <span className="bg-brand-aliceBlue text-brand-prussian text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                Notice
              </span>
              <span className="text-xs text-gray-400 font-medium italic">
                {moment(item.createdAt).fromNow()}
              </span>
            </div>

            <h4 className="text-lg font-semibold text-brand-prussian mb-2 group-hover:text-brand-coral transition-colors">
              {item.title}
            </h4>
            
            <p className="text-gray-500 leading-relaxed text-sm font-normal whitespace-pre-line">
              {item.content}
            </p>
          </div>
        ))
      ) : (
        <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-brand-aliceBlue">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="text-gray-300" size={28} />
          </div>
          <p className="text-gray-400 font-medium">No announcements have been posted yet.</p>
        </div>
      )}
    </motion.div>
  );
}