import nodeCron from "node-cron";
import Enrollment from "../models/Enrollment.js";

const startEnrollmentCron = () => {
    nodeCron.schedule("0 0 * * *", async () => {
        console.log("🔄 CRON: Checking for expired enrollments...");
        try {
            const now = new Date();
            
            const result = await Enrollment.updateMany(
                {
                    isActive: true,
                    accessEndDate: { $lte: now }
                },
                {
                    $set: {
                        isActive: false,
                        paymentStatus: "expired"
                    }
                }
            );

            if (result.modifiedCount > 0) {
                console.log(`✅ CRON Success: Automatically expired ${result.modifiedCount} enrollments.`);
            } else {
                console.log("✅ CRON: No expired enrollments found today.");
            }

        } catch (err) {
            console.error("❌ Error in Enrollment CRON:", err);
        }
    });
};

export default startEnrollmentCron;