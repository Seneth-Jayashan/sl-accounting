import { useMemo } from "react";
import { motion } from "framer-motion";

type SeasonMode = "christmas" | "newyear" | "none";

export const SeasonalDecorations = () => {
    const seasonMode: SeasonMode = useMemo(() => {
        const now = new Date();
        const month = now.getMonth(); // 0 = Jan, 10 = Nov, 11 = Dec
        const date = now.getDate();

        // After December 10 (Dec 11 - Dec 25) -> Christmas
        if (month === 11 && date >= 11 && date <= 25) {
            return "christmas";
        }
        // Dec 26 to Dec 31 -> New Year 2027
        if (month === 11 && date >= 26) {
            return "newyear";
        }
        // Jan 1 to Jan 7 -> New Year 2027
        if (month === 0 && date <= 7) {
            return "newyear";
        }

        return "none";
    }, []);

    const particles = useMemo(() => {
        return Array.from({ length: 30 }).map((_, i) => ({
            id: i,
            left: `${(i * 3.3) % 100}%`,
            size: (i % 6) + 6,
            duration: (i % 7) + 8,
            delay: (i % 5) * 1.2,
            drift: i % 2 === 0 ? 30 : -30,
            color:
                i % 3 === 0
                    ? "bg-amber-400"
                    : i % 3 === 1
                        ? "bg-yellow-300"
                        : "bg-orange-300",
        }));
    }, []);

    if (seasonMode === "none") return null;

    return (
        <div
            aria-hidden="true"
            className="fixed inset-0 pointer-events-none z-[9990] overflow-hidden select-none"
        >
            {/* ================= CHRISTMAS MODE (Dec 11 - Dec 25) ================= */}
            {seasonMode === "christmas" && (
                <>
                    {/* Top Festive Accent Bar */}
                    <div className="fixed top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 via-emerald-500 to-amber-400 shadow-md" />

                    {/* Medium-Large 3D-Shaded Santa & Reindeer Team across full screen */}
                    <motion.div
                        initial={{ x: "-480px", y: 20 }}
                        animate={{
                            x: ["-480px", "108vw"],
                            y: [25, 8, 35, 12, 25], // Gentle soaring wave across upper screen
                            rotate: [-2.5, 2.5, -2, 2, 0],
                        }}
                        transition={{
                            x: {
                                duration: 20,
                                repeat: Infinity,
                                repeatDelay: 7,
                                ease: "easeInOut",
                            },
                            y: {
                                duration: 20,
                                repeat: Infinity,
                                repeatDelay: 7,
                                ease: "easeInOut",
                            },
                            rotate: {
                                duration: 20,
                                repeat: Infinity,
                                repeatDelay: 7,
                                ease: "easeInOut",
                            },
                        }}
                        className="fixed top-4 left-0 flex items-center opacity-85 drop-shadow-[0_14px_24px_rgba(220,38,38,0.4)]"
                    >
                        {/* Wide Golden Stardust Trail */}
                        <div className="w-40 h-3 rounded-full bg-gradient-to-r from-transparent via-amber-300/60 to-yellow-200/90 blur-[3px] -mr-6" />

                        {/* Medium-Size 3D-Styled SVG Sleigh, Santa & 3 Reindeer */}
                        <svg
                            width="360"
                            height="115"
                            viewBox="0 0 300 95"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="overflow-visible"
                        >
                            <defs>
                                {/* 3D Sleigh Red Gradient */}
                                <linearGradient id="sleighRed" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ff5555" />
                                    <stop offset="55%" stopColor="#dc2626" />
                                    <stop offset="100%" stopColor="#7f1d1d" />
                                </linearGradient>
                                {/* 3D Gold Trim Gradient */}
                                <linearGradient id="goldTrim" x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor="#fef08a" />
                                    <stop offset="50%" stopColor="#f59e0b" />
                                    <stop offset="100%" stopColor="#b45309" />
                                </linearGradient>
                                {/* 3D Reindeer Fur Gradient */}
                                <linearGradient id="deerBrown" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#c26319" />
                                    <stop offset="100%" stopColor="#451a03" />
                                </linearGradient>
                            </defs>

                            {/* Golden Reins connecting Sleigh to all 3 Reindeer */}
                            <path
                                d="M84 52 Q120 62 150 48"
                                stroke="url(#goldTrim)"
                                strokeWidth="1.8"
                                strokeDasharray="3 2"
                            />
                            <path
                                d="M162 48 Q185 55 205 43"
                                stroke="url(#goldTrim)"
                                strokeWidth="1.8"
                            />
                            <path
                                d="M215 43 Q238 50 258 38"
                                stroke="url(#goldTrim)"
                                strokeWidth="1.8"
                            />

                            {/* Overflowing Gift Sack in Sleigh */}
                            <circle cx="34" cy="42" r="13" fill="#15803d" />
                            <rect x="38" y="29" width="11" height="11" rx="2" fill="#eab308" transform="rotate(-12 38 29)" />
                            <rect x="24" y="31" width="10" height="10" rx="2" fill="#2563eb" transform="rotate(15 24 31)" />

                            {/* Santa Claus */}
                            <circle cx="58" cy="43" r="10.5" fill="#dc2626" /> {/* Coat */}
                            <path d="M48 44 H68" stroke="#1e293b" strokeWidth="3" /> {/* Belt */}
                            <rect x="56" y="42" width="4" height="4" stroke="#facc15" strokeWidth="1" fill="none" /> {/* Buckle */}
                            <circle cx="59" cy="30" r="6.8" fill="#fed7aa" /> {/* Face */}
                            <path d="M53 32 Q59 41 65 32 Z" fill="#ffffff" /> {/* Beard */}
                            <path d="M52 26 L59 14 L66 26 Z" fill="#dc2626" /> {/* Hat */}
                            <rect x="52" y="25" width="14" height="3" rx="1.5" fill="#ffffff" /> {/* Hat Brim */}
                            <circle cx="59" cy="13" r="3" fill="#ffffff" /> {/* Pom-pom */}

                            {/* 3D Sleigh Body */}
                            <path
                                d="M16 42 C16 62, 30 67, 58 67 L78 67 C85 67, 89 58, 82 50 L68 50 L63 57 L32 57 L25 42 Z"
                                fill="url(#sleighRed)"
                                stroke="url(#goldTrim)"
                                strokeWidth="2.2"
                            />
                            {/* Sleigh Runners */}
                            <path
                                d="M12 74 L82 74 C92 74, 96 66, 90 61"
                                stroke="url(#goldTrim)"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                            />
                            <line x1="32" y1="67" x2="32" y2="74" stroke="url(#goldTrim)" strokeWidth="2.8" />
                            <line x1="66" y1="67" x2="66" y2="74" stroke="url(#goldTrim)" strokeWidth="2.8" />

                            {/* Reindeer 1 (Back) */}
                            <g transform="translate(136, 30)">
                                <ellipse cx="16" cy="18" rx="12" ry="6.5" fill="url(#deerBrown)" />
                                <circle cx="26" cy="10" r="4.8" fill="url(#deerBrown)" />
                                <path d="M25 6 L23 0 M27 6 L30 0" stroke="#fde68a" strokeWidth="1.6" strokeLinecap="round" />
                                <path d="M8 22 L3 31 M12 22 L10 32 M22 22 L27 31 M25 22 L30 29" stroke="#78350f" strokeWidth="2.6" strokeLinecap="round" />
                            </g>

                            {/* Reindeer 2 (Middle) */}
                            <g transform="translate(190, 24)">
                                <ellipse cx="16" cy="18" rx="12" ry="6.5" fill="url(#deerBrown)" />
                                <circle cx="26" cy="10" r="4.8" fill="url(#deerBrown)" />
                                <path d="M25 6 L23 0 M27 6 L30 0" stroke="#fde68a" strokeWidth="1.6" strokeLinecap="round" />
                                <path d="M8 22 L3 31 M12 22 L10 32 M22 22 L27 31 M25 22 L30 29" stroke="#78350f" strokeWidth="2.6" strokeLinecap="round" />
                            </g>

                            {/* Lead Reindeer (Rudolph with glowing red nose!) */}
                            <g transform="translate(244, 17)">
                                <ellipse cx="16" cy="18" rx="12.5" ry="6.8" fill="url(#deerBrown)" />
                                <circle cx="27" cy="10" r="5.2" fill="url(#deerBrown)" />
                                <path d="M26 5 L24 -1 M28 5 L32 -1" stroke="#fde68a" strokeWidth="1.6" strokeLinecap="round" />
                                {/* Glowing Red Nose */}
                                <circle cx="32.5" cy="10" r="2.8" fill="#ef4444" />
                                <circle cx="32.5" cy="10" r="6" fill="#ef4444" opacity="0.45" />
                                <path d="M8 22 L2 31 M13 22 L9 32 M23 22 L29 30 M26 22 L32 28" stroke="#78350f" strokeWidth="2.6" strokeLinecap="round" />
                            </g>
                        </svg>
                    </motion.div>

                    {/* Gentle Snowflakes */}
                    {particles.map((p) => (
                        <motion.div
                            key={p.id}
                            initial={{ y: -20, x: 0, opacity: 0 }}
                            animate={{
                                y: "105vh",
                                x: [0, p.drift, 0],
                                opacity: [0, 0.85, 0.85, 0],
                            }}
                            transition={{
                                duration: p.duration,
                                repeat: Infinity,
                                delay: p.delay,
                                ease: "linear",
                            }}
                            style={{
                                left: p.left,
                                width: p.size,
                                height: p.size,
                            }}
                            className="fixed top-0 rounded-full bg-sky-100 border border-sky-300/60 shadow-[0_2px_6px_rgba(14,165,233,0.35)]"
                        />
                    ))}
                </>
            )}

            {/* ================= NEW YEAR 2027 MODE (Dec 26 - Jan 7) ================= */}
            {seasonMode === "newyear" && (
                <>
                    {/* Top Gold Shimmer Bar */}
                    <div className="fixed top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 shadow-md" />

                    {/* Shooting Golden 2027 Comet Streak across full screen */}
                    <motion.div
                        initial={{ x: "-320px", y: 25 }}
                        animate={{
                            x: ["-320px", "108vw"],
                            y: [25, 45, 20],
                        }}
                        transition={{
                            duration: 12,
                            repeat: Infinity,
                            repeatDelay: 6,
                            ease: "easeInOut",
                        }}
                        className="fixed top-6 left-0 flex items-center opacity-90"
                    >
                        <div className="w-44 h-2 rounded-full bg-gradient-to-r from-transparent via-amber-400/80 to-yellow-200 blur-[2px]" />
                        <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-extrabold text-sm tracking-wider shadow-[0_0_24px_rgba(251,191,36,0.9)]">
                            ✨ 2027
                        </div>
                    </motion.div>

                    {/* Drifting Gold Confetti */}
                    {particles.map((p) => (
                        <motion.div
                            key={p.id}
                            initial={{ y: -20, rotate: 0, opacity: 0 }}
                            animate={{
                                y: "105vh",
                                x: [0, p.drift, -p.drift],
                                rotate: [0, 180, 360],
                                opacity: [0, 0.9, 0.9, 0],
                            }}
                            transition={{
                                duration: p.duration * 0.9,
                                repeat: Infinity,
                                delay: p.delay,
                                ease: "easeInOut",
                            }}
                            style={{
                                left: p.left,
                                width: p.size,
                                height: p.size * 0.7,
                            }}
                            className={`fixed top-0 rounded-sm ${p.color} shadow-[0_2px_6px_rgba(245,158,11,0.4)]`}
                        />
                    ))}
                </>
            )}
        </div>
    );
};