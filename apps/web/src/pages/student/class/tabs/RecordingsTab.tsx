import { useMemo } from "react";
import { motion } from "framer-motion";
import { PlayCircle, Video, Calendar } from "lucide-react";
import moment from "moment";
import { useNavigate } from "react-router-dom";

export default function RecordingsTab({ sessions }: { sessions: any[] }) {
  const navigate = useNavigate();

  const recordings = useMemo(() => {
    return sessions
      .filter(s => s.youtubeVideoId)
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [sessions]);

  if (recordings.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-brand-aliceBlue">
        <Video className="mx-auto text-brand-aliceBlue mb-4" size={48} strokeWidth={1.5} />
        <p className="text-gray-400 font-medium">No session recordings are available yet.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {recordings.map((session) => (
        <div 
          key={session._id} 
          className="group bg-white rounded-[2rem] p-6 border border-brand-aliceBlue shadow-sm hover:border-brand-cerulean/20 hover:shadow-md transition-all duration-300"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-brand-aliceBlue rounded-2xl flex items-center justify-center text-brand-cerulean group-hover:bg-brand-cerulean group-hover:text-white transition-all duration-300 shrink-0">
              <PlayCircle size={22} strokeWidth={2} />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-semibold text-brand-prussian line-clamp-2 leading-snug group-hover:text-brand-cerulean transition-colors">
                {session.title || `Session ${session.index}`}
              </h4>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                <Calendar size={12} />
                {moment(session.startAt).format("MMM DD, YYYY")}
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => navigate(`/student/class/recording/${session._id}`)}
            className="w-full bg-brand-aliceBlue py-3.5 rounded-xl font-medium text-sm text-brand-prussian hover:bg-brand-prussian hover:text-white transition-all transform active:scale-[0.98]"
          >
            Watch Session
          </button>
        </div>
      ))}
    </motion.div>
  );
}