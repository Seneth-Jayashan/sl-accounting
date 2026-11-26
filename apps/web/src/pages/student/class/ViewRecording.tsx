import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Gauge,
  Maximize2,
  Volume2,
  Play,
  Lock,
} from "lucide-react";
import SessionService from "../../../services/SessionService";
import VideoProgressService from "../../../services/VideoProgressService";
import { useAuth } from "../../../contexts/AuthContext";

// @ts-ignore
import Plyr from "plyr";
import "plyr/dist/plyr.css";

// --- HELPERS ---
const extractVideoId = (urlOrId: string): string | null => {
  if (!urlOrId) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = urlOrId.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export default function ViewRecording() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string>("Class Recording");
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
        const s = res.session || res || {};

        if (isMounted && s.title) {
          setSessionTitle(s.title);
        }

        const rawString = s.youtubeVideoId || s.recordingUrl;
        const extractedId = extractVideoId(rawString);

        if (isMounted) {
          if (extractedId) {
            setYoutubeId(extractedId);
            VideoProgressService.updateRecordingProgress(sessionId, "started").catch(
              () => { }
            );
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
    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  // --- 2. PREVENT URL SHARING & COPY ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ["c", "x", "v", "s", "p"].includes(key)) {
        e.preventDefault();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        ["c", "i", "j"].includes(key)
      ) {
        e.preventDefault();
      }
      if (e.key === "F12") {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // --- 3. INITIALIZE PLYR ---
  useEffect(() => {
    if (youtubeId && playerRef.current) {
      if (playerInstance.current) playerInstance.current.destroy();

      const player = new Plyr(playerRef.current, {
        controls: [
          "play-large",
          "play",
          "progress",
          "current-time",
          "mute",
          "volume",
          "captions",
          "settings",
          "pip",
          "fullscreen",
        ],
        settings: ["speed"],
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
        youtube: {
          noCookie: true,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          controls: 1,
          disablekb: 0,
          fs: 1,
        },
        hideControls: false,
        clickToPlay: true,
        keyboard: { focused: true, global: true },
        fullscreen: { enabled: true, fallback: true, iosNative: true },
        resolution: { default: "1080p", options: ["360p", "480p", "720p", "1080p"] },
      } as any);

      playerInstance.current = player;

      player.on("ended", () => {
        if (sessionId) {
          VideoProgressService.updateRecordingProgress(sessionId, "completed").catch(
            () => { }
          );
        }
      });

      // Inject persistent shield (works in Fullscreen)
      player.on("ready", () => {
        const container = player.elements.container;
        if (!container || container.querySelector(".secure-shield-layer")) return;

        const shield = document.createElement("div");
        shield.className = "secure-shield-layer";

        Object.assign(shield.style, {
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          zIndex: "50",
          background: "transparent",
          cursor: "pointer",
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
        });

        shield.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          player.togglePlay();
        });

        shield.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          e.stopPropagation();
        });

        shield.addEventListener("dragstart", (e) => e.preventDefault());
        shield.addEventListener("dragover", (e) => e.preventDefault());
        shield.addEventListener("mousedown", (e) => e.preventDefault());

        container.appendChild(shield);
      });
    }

    return () => {
      if (playerInstance.current) {
        playerInstance.current.destroy();
        playerInstance.current = null;
      }
    };
  }, [youtubeId, sessionId]);

  const watermarkText = user
    ? `${user.firstName} ${user.lastName} • ${user.email} • IP Protected`
    : "Protected Content • Do Not Share";

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="h-screen bg-[#050a0f] flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-14 h-14 rounded-2xl bg-brand-cerulean/15 border border-brand-cerulean/30 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-brand-cerulean animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold tracking-wide text-white/90">
            Preparing Secure Stream
          </p>
          <p className="text-xs text-white/40 mt-1">Verifying playback permissions...</p>
        </div>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (error) {
    return (
      <div className="h-screen bg-[#050a0f] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-md w-full text-center text-white shadow-2xl"
        >
          <div className="w-16 h-16 bg-red-500/15 border border-red-500/25 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="text-red-400 w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold tracking-tight mb-2">
            Playback Unavailable
          </h3>
          <p className="text-sm text-white/60 leading-relaxed mb-7">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 px-5 bg-white text-brand-prussian font-bold text-sm rounded-xl hover:bg-brand-jasmine transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <ArrowLeft size={16} />
            <span>Back to Class</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="h-screen bg-[#050a0f] flex flex-col select-none overflow-hidden relative text-white"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Subtle Ambient Theater Glow */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[55vh] rounded-full bg-brand-cerulean/10 blur-[120px]" />

      {/* --- TOP THEATER HEADER --- */}
      <header className="relative z-50 px-4 sm:px-6 py-3.5 bg-white/[0.03] backdrop-blur-xl border-b border-white/10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go Back"
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="min-w-0">
            <h1 className="font-bold text-sm sm:text-base text-white truncate">
              {sessionTitle}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-white/50 mt-0.5">
              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck size={12} />
                Secure Playback
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline-flex items-center gap-1">
                <Gauge size={12} />
                0.5x – 2x Speed
              </span>
            </div>
          </div>
        </div>

        {/* Right Security Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-semibold text-white/70 shrink-0">
          <Lock size={12} className="text-brand-jasmine" />
          <span>Watermarked for {user?.firstName || "Student"}</span>
        </div>
      </header>

      {/* --- MAIN PLAYER STAGE --- */}
      <main
        className="flex-1 flex items-center justify-center p-3 sm:p-6 lg:p-8 relative z-10 min-h-0"
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onPaste={(e) => e.preventDefault()}
      >
        <div className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden relative bg-black border border-white/10 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.9)] ring-1 ring-brand-cerulean/20">
          {youtubeId ? (
            <div className="w-full h-full relative">
              {/* 1. PLYR VIDEO PLAYER */}
              <div
                ref={playerRef}
                className="plyr__video-embed w-full h-full"
                id="player"
              >
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId}?origin=${window.location.origin}&iv_load_policy=3&modestbranding=1&playsinline=1&showinfo=0&rel=0&enablejsapi=1&controls=0&fs=0`}
                  allowFullScreen
                  allow="autoplay"
                  title="Secure Player"
                />
              </div>

              {/* 2. DYNAMIC MARQUEE WATERMARK */}
              <div className="absolute inset-0 z-[55] pointer-events-none overflow-hidden flex flex-col justify-between py-10 opacity-20">
                <div className="whitespace-nowrap animate-marquee">
                  <span className="text-xl sm:text-2xl font-black text-white/60 uppercase tracking-[0.8rem] select-none">
                    {watermarkText} &nbsp;&nbsp;&nbsp; {watermarkText}
                  </span>
                </div>
                <div className="w-full flex justify-center">
                  <span className="text-3xl sm:text-4xl font-black text-white/50 uppercase -rotate-12 tracking-widest select-none">
                    {user?.firstName || "Student"}
                  </span>
                </div>
                <div className="whitespace-nowrap animate-marquee-reverse">
                  <span className="text-lg sm:text-xl font-black text-white/60 uppercase tracking-[0.8rem] select-none">
                    {watermarkText} &nbsp;&nbsp;&nbsp; {watermarkText}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white gap-2">
              <AlertTriangle className="text-brand-jasmine" size={28} />
              <p className="text-sm font-semibold text-white/80">
                Video Source Unavailable
              </p>
            </div>
          )}
        </div>
      </main>

      {/* --- SUBTLE THEATER FOOTER --- */}
      <footer className="relative z-20 px-6 py-3 border-t border-white/5 bg-white/[0.02] hidden sm:flex items-center justify-between text-[11px] text-white/40">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <Play size={12} className="text-brand-cerulean" />
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono text-[10px]">
              Space
            </kbd>
            Play / Pause
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Maximize2 size={12} className="text-brand-cerulean" />
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono text-[10px]">
              F
            </kbd>
            Fullscreen
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Volume2 size={12} className="text-brand-cerulean" />
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono text-[10px]">
              M
            </kbd>
            Mute
          </span>
        </div>

        <span>Screen recording & unauthorized sharing are strictly prohibited.</span>
      </footer>

      {/* --- STYLES FOR PLYR BRANDING, MARQUEE & PROTECTION --- */}
      <style>{`
        :root {
          --plyr-color-main: #0ea5e9;
          --plyr-video-control-background-hover: rgba(14, 165, 233, 0.85);
          --plyr-menu-background: rgba(10, 25, 36, 0.95);
          --plyr-menu-color: #f8fafc;
        }

        * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }

        .plyr {
          width: 100%;
          height: 100%;
        }

        .plyr__video-embed iframe {
          pointer-events: none !important;
        }

        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-marquee {
          animation: marquee 22s linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse 26s linear infinite;
        }

        .plyr__controls {
          z-index: 60 !important;
          pointer-events: auto !important;
        }

        .secure-shield-layer {
          pointer-events: auto !important;
        }

        [draggable="true"] {
          pointer-events: none !important;
        }
      `}</style>
    </div>
  );
}