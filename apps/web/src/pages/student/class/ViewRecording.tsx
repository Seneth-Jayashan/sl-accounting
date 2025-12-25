import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import SessionService from "../../../services/SessionService";

// FIX: Tell TypeScript to ignore the "no default export" warning.
// The library works fine at runtime.
// @ts-ignore
import Plyr from "plyr";
import "plyr/dist/plyr.css";

// --- SECURITY HELPER: Robust ID Extraction ---
const extractVideoId = (urlOrId: string): string | null => {
    if (!urlOrId) return null;
    
    // 1. If it is already a clean ID (11 chars), return it.
    if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) {
        return urlOrId;
    }

    // 2. Regex to find ID in any YouTube URL format
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = urlOrId.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : null;
};

export default function ViewRecording() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const playerRef = useRef<HTMLDivElement>(null);
  // FIX: Type as 'any' to avoid TS conflicts with the Plyr instance
  const playerInstance = useRef<any>(null);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchSession = async () => {
      try {
        if (!sessionId) return;
        
        const res: any = await SessionService.getSessionById(sessionId);
        const s = res.session || res;

        const rawString = s.youtubeVideoId || s.recordingUrl;
        const extractedId = extractVideoId(rawString);

        if (extractedId) {
            setYoutubeId(extractedId);
        } else {
            setError("No valid video ID found.");
        }

      } catch (err) {
        console.error(err);
        setError("Failed to load recording.");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  // --- 2. INITIALIZE PLAYER ---
  useEffect(() => {
    if (youtubeId && playerRef.current) {
        if (playerInstance.current) playerInstance.current.destroy();

        // Initialize Plyr
        playerInstance.current = new Plyr(playerRef.current, {
            controls: [
                'play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
            ],
            youtube: { 
                noCookie: true, 
                rel: 0, 
                showinfo: 0, 
                iv_load_policy: 3, 
                modestbranding: 1
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

  if (loading) {
    return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="w-10 h-10 text-blue-500 animate-spin"/></div>;
  }

  if (error) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <AlertTriangle className="text-red-500 w-12 h-12" />
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col select-none" onContextMenu={(e) => e.preventDefault()}>
      
      {/* Header */}
      <div className="p-4 bg-gray-900 text-white flex items-center gap-4 border-b border-gray-800">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
          <ArrowLeft />
        </button>
        <h1 className="font-bold">Class Recording</h1>
      </div>

      {/* Main Player Area */}
      <div className="flex-1 flex items-center justify-center bg-black p-4">
        <div className="w-full max-w-5xl aspect-video border border-gray-800 bg-gray-900 shadow-2xl rounded-xl overflow-hidden relative group">
          
          {youtubeId ? (
              <div className="w-full h-full relative">
                
                {/* PLYR TARGET */}
                <div ref={playerRef} className="plyr__video-embed" id="player">
                    <iframe
                        src={`https://www.youtube-nocookie.com/embed/${youtubeId}?origin=${window.location.origin}&iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&rel=0&enablejsapi=1`}
                        allowFullScreen
                        allow="autoplay"
                        title="Class Video"
                    ></iframe>
                </div>

                {/* SECURITY SHIELD (Blocks top clicks) */}
                <div 
                    className="absolute top-0 left-0 w-full h-[15%] z-[50] bg-transparent cursor-default"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onContextMenu={(e) => e.preventDefault()}
                    title="Protected Content"
                ></div>

              </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white">
                <AlertTriangle className="mb-2 text-yellow-500" />
                <p>Video ID not found.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}