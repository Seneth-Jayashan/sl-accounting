import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock } from "lucide-react";

interface ExamTimerProps {
    examDate: string | null;
}

export default function ExamTimer({ examDate }: ExamTimerProps) {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    } | null>(null);

    useEffect(() => {
        if (!examDate) {
            setTimeLeft(null);
            return;
        }

        const targetDate = new Date(examDate).getTime();

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const difference = targetDate - now;

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor(
                    (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
                );
                const minutes = Math.floor(
                    (difference % (1000 * 60 * 60)) / (1000 * 60)
                );
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                setTimeLeft({ days, hours, minutes, seconds });
            } else {
                setTimeLeft(null);
            }
        };

        calculateTimeLeft();
        const timerInterval = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timerInterval);
    }, [examDate]);

    if (!timeLeft) return null;

    const units = [
        { value: timeLeft.days, label: "දින" },
        { value: timeLeft.hours, label: "පැය" },
        { value: timeLeft.minutes, label: "විනාඩි" },
        { value: timeLeft.seconds, label: "තත්පර" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-prussian via-[#0d3a4b] to-brand-cerulean px-4 py-3 text-white shadow-md shadow-brand-prussian/15 border border-white/10"
        >
            <div className="pointer-events-none absolute -top-10 -right-10 w-36 h-36 rounded-full bg-brand-jasmine/20 blur-2xl" />

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Left Label */}
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/15 flex items-center justify-center shrink-0">
                        <CalendarClock
                            size={16}
                            className="text-brand-jasmine animate-pulse"
                        />
                    </div>
                    <span className="font-sinhala text-xs sm:text-sm font-bold tracking-wide text-brand-aliceBlue">
                        විභාගයට තව ඉතිරිව ඇත්තේ
                    </span>
                </div>

                {/* Right Countdown Chips */}
                <div className="flex items-center gap-2">
                    {units.map((unit) => (
                        <div
                            key={unit.label}
                            className="flex items-baseline gap-1 bg-white/10 backdrop-blur-md border border-white/15 px-2.5 py-1.5 rounded-xl min-w-[58px] justify-center"
                        >
                            <span className="font-mono tabular-nums text-sm sm:text-base font-black text-brand-jasmine leading-none">
                                {String(unit.value).padStart(2, "0")}
                            </span>
                            <span className="font-sinhala text-[10px] sm:text-[11px] font-semibold text-white/80">
                                {unit.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}