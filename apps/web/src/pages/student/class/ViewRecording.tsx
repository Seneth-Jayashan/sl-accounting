import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Loader2, ShieldAlert } from "lucide-react";
import SessionService from "../../../services/SessionService";
import { useAuth } from "../../../contexts/AuthContext"; // Assuming you have this

// @ts-ignore
import Plyr from "plyr";
import "plyr/dist/plyr.css";

// --- HELPERS ---
const extractVideoId = (urlOrId: string): string | null => {
    if (!urlOrId) return null;
    if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = urlOrId.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export default function ViewRecording() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get logged-in user for watermark

  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const playerRef = useRef<HTMLDivElement>(null);
  const playerInstance = useRef<any>(null);

  // --- 1. FETCH & EXTRACT ID ---
  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      try {
        if (!sessionId) throw new Error("Invalid Session ID");
        
        const res: any = await SessionService.getSessionById(sessionId);
        // Handle inconsistent API responses (res.session or just res)
        const s = res.session || res || {};

        const rawString = s.youtubeVideoId || s.recordingUrl;
        const extractedId = extractVideoId(rawString);

        if (isMounted) {
            if (extractedId) {
                setYoutubeId(extractedId);
            } else {
                throw new Error("Recording not available yet.");
            }
        }
      } catch (err: any) {
        console.error("Video Load Error:", err);
        if (isMounted) setError(err.message || "Failed to load recording.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSession();
    return () => { isMounted = false; };
  }, [sessionId]);

  // --- 2. INITIALIZE PLYR ---
  useEffect(() => {
    if (youtubeId && playerRef.current) {
        if (playerInstance.current) playerInstance.current.destroy();

        playerInstance.current = new Plyr(playerRef.current, {
            controls: [
                'play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'fullscreen'
            ],
            youtube: { 
                noCookie: true, 
                rel: 0, 
                showinfo: 0, 
                iv_load_policy: 3, 
                modestbranding: 1,
                controls: 0, // Hide native YT controls
                disablekb: 1 // Disable YT keyboard shortcuts
            },
            hideControls: true, 
            clickToPlay: true,
            keyboard: { focused: true, global: true },
        });
    }

    return () => {
        if (playerInstance.current) playerInstance.current.destroy();
    };
  }, [youtubeId]);

  // --- RENDER HELPERS ---
  const watermarkText = user 
    ? `${user.firstName} ${user.lastName} • ${user.email} • IP Protected` 
    : "Protected Content • Do Not Share";

  if (loading) {
    return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="w-10 h-10 text-brand-cerulean animate-spin"/></div>;
  }

  if (error) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white gap-4 p-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
            <ShieldAlert className="text-red-500 w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold">Access Restricted</h3>
        <p className="text-gray-400 max-w-md">{error}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">Go Back</button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col select-none overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
      
      {/* Header */}
      <div className="p-4 bg-gray-900/50 backdrop-blur-sm text-white flex items-center gap-4 border-b border-gray-800 z-50">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
            <h1 className="font-bold text-sm md:text-base">Class Recording</h1>
            <p className="text-xs text-gray-500">Secure Playback Mode</p>
        </div>
      </div>

      {/* Main Player Area */}
      <div className="flex-1 flex items-center justify-center bg-black p-4 relative">
        <div className="w-full max-w-5xl aspect-video border border-gray-800 bg-gray-900 shadow-2xl rounded-xl overflow-hidden relative group">
          
          {youtubeId ? (
              <div className="w-full h-full relative">
                
                {/* 1. PLYR VIDEO PLAYER */}
                <div ref={playerRef} className="plyr__video-embed w-full h-full" id="player">
                    <iframe
                        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?origin=${window.location.origin}&iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&rel=0&enablejsapi=1&controls=0`}
                        allowFullScreen
                        allow="autoplay"
                        title="Secure Player"
                    ></iframe>
                </div>

                {/* 2. SECURITY SHIELD (Prevents Clicking YouTube Logo/Title) */}
                {/* Top Bar Shield */}
                <div 
                    className="absolute top-0 left-0 w-full h-[15%] z-[60] bg-transparent cursor-default"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onContextMenu={(e) => e.preventDefault()}
                ></div>
                
                {/* 3. DYNAMIC MARQUEE WATERMARK */}
                <div className="absolute inset-0 z-[55] pointer-events-none overflow-hidden flex flex-col justify-between py-10 opacity-30">
                    
                    {/* Top Watermark */}
                    <div className="whitespace-nowrap animate-marquee">
                        <span className="text-2xl font-black text-white/50 uppercase tracking-[1rem] select-none">
                            {watermarkText} &nbsp;&nbsp;&nbsp; {watermarkText}
                        </span>
                    </div>

                    {/* Middle Random Watermark (Static Center) */}
                    <div className="w-full flex justify-center">
                         <span className="text-4xl font-black text-white/50 uppercase -rotate-12 tracking-widest select-none">
                            {user?.firstName || "Student"}
                        </span>
                    </div>

                    {/* Bottom Watermark (Reverse Direction) */}
                    <div className="whitespace-nowrap animate-marquee-reverse">
                        <span className="text-xl font-black text-white/50 uppercase tracking-[1rem] select-none">
                            {watermarkText} &nbsp;&nbsp;&nbsp; {watermarkText}
                        </span>
                    </div>
                </div>

              </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white">
                <AlertTriangle className="mb-2 text-yellow-500" />
                <p>Video Source Unavailable</p>
            </div>
          )}

        </div>
      </div>
      
      {/* CSS for Marquee Animation */}
      <style>{`
        @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
        }
        @keyframes marquee-reverse {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        .animate-marquee {
            animation: marquee 20s linear infinite;
        }
        .animate-marquee-reverse {
            animation: marquee-reverse 25s linear infinite;
        }
      `}</style>
    </div>
  );
}