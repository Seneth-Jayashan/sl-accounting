import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Lock, PlayCircle, ListVideo} from "lucide-react";
import LessonPackService, { type LessonPackData, type PlaylistItem } from "../../../services/LessonPackService";

// @ts-ignore
import Plyr from "plyr";
import "plyr/dist/plyr.css";

export default function WatchLessonPack() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pack, setPack] = useState<LessonPackData | null>(null);
  const [activeVideo, setActiveVideo] = useState<PlaylistItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstance = useRef<any>(null);

  // 1. Fetch Playlist Data
  useEffect(() => {
    const fetchPack = async () => {
      if (!id) return;
      try {
        const data = await LessonPackService.getById(id);
        setPack(data);
        if (data.videos && data.videos.length > 0) {
            // Sort by order and set the first video as active
            const sorted = [...data.videos].sort((a, b) => (a.order || 0) - (b.order || 0));
            setActiveVideo(sorted[0]);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load playlist.");
      } finally {
        setLoading(false);
      }
    };
    fetchPack();
  }, [id]);

  // 2. Security: Prevent Copy/Paste
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'v', 's', 'p'].includes(e.key.toLowerCase())) e.preventDefault();
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['c', 'i', 'j'].includes(e.key.toLowerCase())) e.preventDefault();
      if (e.key === 'F12') e.preventDefault();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 3. Initialize Plyr (Only if they have access and an active video exists)
  useEffect(() => {
    if (pack?.hasAccess && activeVideo?.youtubeId && playerRef.current) {
        
        // Strict Cleanup for React 19
        if (playerInstance.current) {
            playerInstance.current.destroy();
            playerInstance.current = null;
        }

        const player = new Plyr(playerRef.current, {
            controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
            settings: ['speed'], 
            speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
            youtube: { noCookie: true, rel: 0, showinfo: 0, iv_load_policy: 3, modestbranding: 1, controls: 1, disablekb: 0, fs: 1 },
        } as any);

        playerInstance.current = player;

        // Secure Shield Overlay
        player.on('ready', () => {
            const container = player.elements.container;
            if (!container || container.querySelector('.secure-shield-layer')) return;

            const shield = document.createElement('div');
            shield.className = 'secure-shield-layer';
            Object.assign(shield.style, {
                position: 'absolute', top: '0', left: '0', width: '100%', height: '100%',
                zIndex: '50', background: 'transparent', cursor: 'pointer',
                userSelect: 'none', WebkitUserSelect: 'none'
            });

            shield.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); player.togglePlay(); });
            shield.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); });
            shield.addEventListener('dragstart', (e) => e.preventDefault());

            container.appendChild(shield);
        });
    }

    return () => {
        if (playerInstance.current) {
            playerInstance.current.destroy();
            playerInstance.current = null;
        }
    };
  }, [activeVideo, pack?.hasAccess]);


  if (loading) return <div className="h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-10 h-10 text-brand-cerulean animate-spin"/></div>;
  if (error || !pack) return <div className="h-screen flex items-center justify-center">Error loading playlist.</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans select-none" onContextMenu={e => e.preventDefault()}>
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={20} className="text-gray-500"/></button>
          <div>
            <h1 className="text-lg font-bold text-brand-prussian">{pack.title}</h1>
            <p className="text-xs text-brand-cerulean font-bold uppercase tracking-widest">{pack.videos.length} Videos</p>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto">
        
        {/* LEFT: Video Player Area */}
        <div className="flex-1 p-4 lg:p-6 flex flex-col">
          
          {!pack.hasAccess ? (
             /* LOCKED STATE */
             <div className="w-full aspect-video bg-brand-prussian rounded-2xl shadow-2xl flex flex-col items-center justify-center text-center p-8 border border-gray-800 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-cerulean via-brand-prussian to-black"></div>
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 relative z-10 backdrop-blur-sm border border-white/20">
                   <Lock size={32} className="text-white" />
                </div>
                <h2 className="text-3xl font-black text-white mb-2 relative z-10">Premium Playlist</h2>
                <p className="text-brand-aliceBlue/70 max-w-md mb-8 relative z-10">You need to purchase this lesson pack to unlock the videos and materials inside.</p>
                <button 
                  onClick={() => navigate(`/student/payment/lesson-pack/${pack._id}`)}
                  className="bg-brand-cerulean hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg active:scale-95 relative z-10"
                >
                  Unlock for LKR {pack.price}
                </button>
             </div>
          ) : (
             /* UNLOCKED STATE (PLAYER) */
             <div className="w-full aspect-video bg-black rounded-2xl shadow-xl overflow-hidden relative border border-gray-200">
                {activeVideo?.youtubeId ? (
                   <>
                      <div ref={playerRef} className="plyr__video-embed w-full h-full">
                        <iframe
                            src={`https://www.youtube-nocookie.com/embed/${activeVideo.youtubeId}?origin=${window.location.origin}&iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&rel=0&enablejsapi=1&controls=0&fs=0`}
                            allowFullScreen allow="autoplay" title={activeVideo.title}
                        ></iframe>
                      </div>
                      
                      {/* Watermark overlay using CSS animation instead of marquee */}
                      <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between py-10 opacity-20 overflow-hidden">
                          <div className="whitespace-nowrap animate-marquee-fast">
                             <span className="text-xl font-black text-white uppercase tracking-[1rem]">
                                PROTECTED CONTENT • DO NOT SHARE &nbsp;&nbsp;&nbsp; PROTECTED CONTENT • DO NOT SHARE
                             </span>
                          </div>
                      </div>
                   </>
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-500"><Loader2 className="animate-spin"/></div>
                )}
             </div>
          )}

          {/* Video Info (Below Player) */}
          <div className="mt-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
             <h2 className="text-2xl font-bold text-brand-prussian mb-2">{activeVideo?.title || pack.title}</h2>
             <p className="text-sm text-gray-500 leading-relaxed">{pack.description}</p>
          </div>

        </div>

        {/* RIGHT: Sidebar Playlist */}
        <div className="w-full lg:w-96 bg-white border-l border-gray-200 flex flex-col h-[calc(100vh-73px)] lg:sticky lg:top-[73px]">
           <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 shrink-0">
              <ListVideo className="text-brand-cerulean" size={20} />
              <h3 className="font-bold text-gray-800">Course Content</h3>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {pack.videos.map((vid, idx) => {
                 const isActive = activeVideo?._id === vid._id;
                 return (
                    <button 
                      key={vid._id || idx}
                      onClick={() => pack.hasAccess && setActiveVideo(vid)}
                      disabled={!pack.hasAccess}
                      className={`w-full text-left p-3 rounded-xl mb-1 transition-all flex gap-3 items-start group ${
                          isActive ? 'bg-brand-aliceBlue/50 border border-brand-cerulean/30' : 'hover:bg-gray-50 border border-transparent'
                      } ${!pack.hasAccess ? 'cursor-not-allowed opacity-75' : ''}`}
                    >
                       <div className="shrink-0 mt-0.5">
                          {!pack.hasAccess ? (
                             <Lock size={16} className="text-gray-400" />
                          ) : isActive ? (
                             <PlayCircle size={18} className="text-brand-cerulean fill-brand-cerulean/20" />
                          ) : (
                             <PlayCircle size={18} className="text-gray-400 group-hover:text-brand-cerulean" />
                          )}
                       </div>
                       <div>
                          <p className={`text-sm font-bold line-clamp-2 ${isActive ? 'text-brand-cerulean' : 'text-gray-700 group-hover:text-brand-prussian'}`}>
                             {idx + 1}. {vid.title}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium mt-1">{vid.durationMinutes} mins</p>
                       </div>
                    </button>
                 );
              })}
           </div>
        </div>

      </div>

      <style>{`
        .plyr__video-embed iframe { pointer-events: none !important; }
        .plyr__controls { z-index: 60 !important; pointer-events: auto !important; }
        .secure-shield-layer { pointer-events: auto !important; }
        
        /* Custom Marquee Animation replacing the deprecated tag */
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee-fast {
          display: inline-block;
          animation: marquee 15s linear infinite;
        }
      `}</style>
    </div>
  );
}