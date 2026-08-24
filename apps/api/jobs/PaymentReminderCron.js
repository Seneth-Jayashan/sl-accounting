import nodeCron from "node-cron";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";
import { getIO } from "../config/socket.js";
import SmsSender from "../services/SmsSender.js";
import { sendEmail } from "../services/EmailSender.js";

const startPaymentReminderCron = () => {
    // Run at 09:00
    nodeCron.schedule("0 9 25 * *", async () => {
        console.log("🔄 CRON: Sending payment reminders to students...");
        try {
            // Find all active enrollments for monthly classes
            const enrollments = await Enrollment.find({
                isActive: true,
                subscriptionType: "monthly",
                class: { $exists: true, $ne: null }
            }).populate("class", "name").populate("student", "firstName lastName email phoneNumber");

            if (enrollments.length === 0) {
                console.log("✅ CRON: No active enrollments found for payment reminder.");
                return;
            }

            let count = 0;
            const io = getIO();

            for (const enrollment of enrollments) {
                if (!enrollment.student || !enrollment.class) continue;

                const classId = enrollment.class._id;
                const className = enrollment.class.name || "your class";

                const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
                const paymentLink = `${clientOrigin}/student/payment/create/${classId}`;

                // Create the notification
                const notification = await Notification.create({
                    user: enrollment.student._id,
                    message: `You can pay for the next month for ${className}.`,
                    link: paymentLink
                });

                // Emit real-time notification
                if (io) {
                    io.to(enrollment.student._id.toString()).emit("newNotification", notification);
                }

                // Send Email and SMS
                const { firstName, email, phoneNumber } = enrollment.student;

                if (email) {
                    try {
                        await sendEmail({
                            to: email,
                            subject: `Payment Reminder: ${className}`,
                            text: `Hi ${firstName},\n\nYou can now pay for the next month for ${className}.\n\nPayment Link: ${paymentLink}`,
                        });
                    } catch (emailErr) {
                        console.error(`❌ Failed to send email to ${email}:`, emailErr.message);
                    }
                }

                if (phoneNumber) {
                    try {
                        await SmsSender.send(
                            phoneNumber,
                            `Hi ${firstName}, you can now pay for the next month for ${className}. Link: ${paymentLink}`
                        );
                    } catch (smsErr) {
                        console.error(`❌ Failed to send SMS to ${phoneNumber}:`, smsErr.message);
                    }
                }

                count++;
            }

            console.log(`✅ CRON Success: Sent payment reminders (Notifications, Email, SMS) to ${count} students.`);

        } catch (err) {
            console.error("❌ Error in Payment Reminder CRON:", err);
        }
    });
};

export default startPaymentReminderCron;
