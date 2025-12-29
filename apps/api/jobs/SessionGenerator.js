import cron from "node-cron";
import moment from "moment-timezone";
import Class from "../models/Class.js";
import Session from "../models/Session.js";
import { createMeeting } from "../services/Zoom.js"; // Reuse your existing zoom logic

// Helper to calculate next session date (reused logic)
const getNextSessionMoment = (anchorDate, targetDayIndex, timeStr, timezone) => {
    let m = moment(anchorDate).tz(timezone);
    const [hour, minute] = timeStr.split(":").map(Number);
    m.set({ hour, minute, second: 0, millisecond: 0 });

    // Move to the correct day of week
    if (m.day() !== targetDayIndex) {
        m.day(targetDayIndex);
        // If that day is in the past relative to anchor, move to next week
        if (m.isBefore(anchorDate)) {
            m.add(1, 'week');
        }
    }
    return m;
};

const startSessionGenerator = () => {
    // Run every Monday at 02:00 AM
    cron.schedule("*/5 * * * *", async () => {
        console.log("🔄 CRON: Checking for classes that need new sessions...");
        
        try {
            // 1. Find all Active Classes
            const activeClasses = await Class.find({ isActive: true });

            for (const cls of activeClasses) {
                // 2. Find the Last Session for this class
                const lastSession = await Session.findOne({ class: cls._id }).sort({ startAt: -1 });
                
                if (!lastSession) continue;

                // 3. Check if we need more sessions
                // Logic: If the last session is less than 14 days away, generate more.
                const lastSessionDate = moment(lastSession.startAt);
                const twoWeeksFromNow = moment().add(14, 'days');

                if (lastSessionDate.isBefore(twoWeeksFromNow)) {
                    console.log(`⚡ Generating next month sessions for: ${cls.name}`);

                    // Generate 4 weeks (approx 1 month) of new sessions
                    const sessionsToAdd = 4; 
                    let anchorDate = lastSessionDate.clone().add(1, 'minute'); // Start searching AFTER the last session

                    for (let i = 0; i < sessionsToAdd; i++) {
                        for (const sch of cls.timeSchedules) {
                            const tz = sch.timezone || "UTC";
                            
                            // Calculate Start/End
                            // Note: We use the logic to find the next occurrence relative to our rolling 'anchorDate'
                            const startMoment = getNextSessionMoment(anchorDate, sch.day, sch.startTime, tz);
                            
                            // Ensure we don't create a duplicate on the exact same time as last session
                            if (startMoment.isSameOrBefore(lastSessionDate)) {
                                startMoment.add(1, 'week');
                            }

                            const endMoment = startMoment.clone().add(cls.sessionDurationMinutes, "minutes");

                            // Create DB Session
                            const newSession = new Session({
                                class: cls._id,
                                index: lastSession.index + i + 1, // Increment index
                                startAt: startMoment.toDate(),
                                endAt: endMoment.toDate(),
                                timezone: tz
                            });

                            // Create Zoom Meeting
                            try {
                                const zoomData = await createMeeting({
                                    topic: `${cls.name} - AutoGen Session`,
                                    start_time: startMoment.format("YYYY-MM-DDTHH:mm:ss"),
                                    duration: cls.sessionDurationMinutes,
                                    timezone: tz,
                                });
                                if (zoomData) {
                                    newSession.zoomMeetingId = String(zoomData.id);
                                    newSession.zoomStartUrl = zoomData.start_url;
                                    newSession.zoomJoinUrl = zoomData.join_url;
                                }
                            } catch (e) {
                                console.error(`Failed to auto-create Zoom for ${cls.name}:`, e.message);
                            }

                            await newSession.save();
                            
                            // Link to Class
                            cls.sessions.push(newSession._id);
                            
                            // Update anchor so next loop creates the week after
                            anchorDate = startMoment.clone().add(1, 'day');
                        }
                    }
                    await cls.save();
                    console.log(`✅ Added 4 weeks of sessions to ${cls.name}`);
                }
            }
        } catch (error) {
            console.error("❌ Session Cron Error:", error);
        }
    });
};

export default startSessionGenerator;