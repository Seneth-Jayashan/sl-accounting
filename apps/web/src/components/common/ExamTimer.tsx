import { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';

interface ExamTimerProps {
    examDate: string | null;
}

export default function ExamTimer({ examDate }: ExamTimerProps) {
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

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
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);

                setTimeLeft({ days, hours, minutes, seconds });
            } else {
                setTimeLeft(null); // Exam passed
            }
        };

        // Initial calculation
        calculateTimeLeft();

        // Update every second
        const timerInterval = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timerInterval);
    }, [examDate]);

    if (!timeLeft) return null;

    // Sinhala format: දින 20 පැය 6 යි විනාඩි 10
    const timeString = `දින ${timeLeft.days} පැය ${timeLeft.hours} යි විනාඩි ${timeLeft.minutes} යි තත්පර ${timeLeft.seconds}`;

    return (
        <div className="bg-brand-prussian text-white px-4 py-2 flex items-center justify-center gap-3 text-sm font-bold shadow-md z-50 rounded-full">
            <CalendarClock size={18} className="text-white animate-pulse" />
            <span className="font-sinhala tracking-wide text-brand-aliceBlue">
                විභාගයට තව: <span className="text-white text-base ml-2">{timeString}</span>
            </span>
        </div>
    );
}
