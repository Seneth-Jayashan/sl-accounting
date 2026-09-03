import cron from "node-cron";
import moment from "moment-timezone";
import Class from "../models/Class.js";
import Session from "../models/Session.js";
import { generateSessionsForClass } from "../controllers/ClassController.js";
import mongoose from "mongoose";

const startSessionGenerator = () => {
    // Run every Monday at 02:00 AM
    cron.schedule("0 2 * * 1", async () => {
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

                    // Generate totalSessions worth of new sessions (typically ~1 month)
                    let anchorDate = lastSessionDate.clone().add(1, 'minute'); // Start searching AFTER the last session

                    // We need to run this in a transaction because generateSessionsForClass expects a dbSession
                    const session = await mongoose.startSession();
                    session.startTransaction();
                    try {
                        await generateSessionsForClass(cls, session, {
                            anchorDateOverride: anchorDate,
                            startingIndex: lastSession.index + 1,
                            count: cls.totalSessions,
                            appendToClass: true
                        });
                        await session.commitTransaction();
                        console.log(`✅ Added ${cls.totalSessions} sessions to ${cls.name}`);
                    } catch (e) {
                        await session.abortTransaction();
                        console.error(`❌ Failed to auto-create sessions for ${cls.name}:`, e);
                    } finally {
                        session.endSession();
                    }
                }
            }
        } catch (error) {
            console.error("❌ Session Cron Error:", error);
        }
    });
};

export default startSessionGenerator;