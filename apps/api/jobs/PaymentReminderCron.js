import nodeCron from "node-cron";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";
import { getSocketIO } from "../config/socket.js";

const startPaymentReminderCron = () => {
    // Run at 09:00 AM on the 25th of every month
    nodeCron.schedule("0 9 25 * *", async () => {
        console.log("🔄 CRON: Sending payment reminders to students...");
        try {
            // Find all active enrollments for monthly classes
            const enrollments = await Enrollment.find({
                isActive: true,
                subscriptionType: "monthly",
                class: { $exists: true, $ne: null }
            }).populate("class", "name");

            if (enrollments.length === 0) {
                console.log("✅ CRON: No active enrollments found for payment reminder.");
                return;
            }

            let count = 0;
            const io = getSocketIO();

            for (const enrollment of enrollments) {
                if (!enrollment.student || !enrollment.class) continue;

                const classId = enrollment.class._id;
                const className = enrollment.class.name || "your class";

                const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
                // Create the notification
                const notification = await Notification.create({
                    user: enrollment.student,
                    message: `You can pay for the next month for ${className}.`,
                    link: `${clientOrigin}/student/payment/create/${classId}`
                });

                // Emit real-time notification
                if (io) {
                    io.to(enrollment.student.toString()).emit("newNotification", notification);
                }

                count++;
            }

            console.log(`✅ CRON Success: Sent payment reminders to ${count} students.`);

        } catch (err) {
            console.error("❌ Error in Payment Reminder CRON:", err);
        }
    });
};

export default startPaymentReminderCron;
