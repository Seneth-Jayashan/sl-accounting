import TuteDelivery from "../models/TuteDelivery.js";
import { sendTuteDispatchedSms } from "../utils/sms/Template.js"; 


// controllers/TuteDeliveryController.js

export const getDeliveries = async (req, res) => {
    try {
        const { status, filterType, startDate, endDate, classId } = req.query;
        
        // 1. Base Filter
        const query = {};
        
        // Status Filter (Default to pending if not specified)
        if (status) query.status = status;

        // Class Filter
        if (classId) query.class = classId;

        // 2. Date Filtering Logic
        // We filter based on 'createdAt' (when payment was made/delivery queued) 
        // OR 'sentAt' if status is 'shipped'/'delivered' for better accuracy?
        // Let's stick to 'createdAt' for consistency with "Paid Time"
        
        const now = new Date();
        let start, end;

        if (filterType && filterType !== 'all_time') {
            switch (filterType) {
                case "today":
                    start = new Date(now.setHours(0,0,0,0));
                    end = new Date(now.setHours(23,59,59,999));
                    break;
                case "this_week":
                    const day = now.getDay() || 7; 
                    if(day !== 1) now.setHours(-24 * (day - 1)); 
                    start = new Date(now.setHours(0,0,0,0));
                    end = new Date(); 
                    break;
                case "last_week":
                    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7); 
                    end = now;
                    break;
                case "this_month":
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    break;
                case "last_month":
                    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    end = new Date(now.getFullYear(), now.getMonth(), 0);
                    break;
                case "custom":
                    if (startDate && endDate) {
                        start = new Date(startDate);
                        end = new Date(endDate);
                        end.setHours(23, 59, 59, 999);
                    }
                    break;
            }
        }

        if (start && end) {
            query.createdAt = { $gte: start, $lte: end };
        }

        const deliveries = await TuteDelivery.find(query)
            .populate("student", "firstName lastName phoneNumber address")
            .populate("class", "name")
            .sort({ createdAt: -1 }); // Newest first

        res.json(deliveries);

    } catch (err) {
        console.error("Get Deliveries Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// 1. Get deliveries needing action (Pending) - ADMIN/TEACHER
export const getPendingDeliveries = async (req, res) => {
    try {
        const { classId, month } = req.query;
        
        const filter = { status: "pending" };
        if (classId) filter.class = classId;
        if (month) filter.targetMonth = month;

        const deliveries = await TuteDelivery.find(filter)
            .populate("student", "firstName lastName phoneNumber address")
            .populate("class", "name")
            .sort({ createdAt: 1 }); // Oldest first

        res.json(deliveries);
    } catch (err) {
        console.error("Get Pending Deliveries Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// 2. Mark as Sent (Teacher Action) - ADMIN/TEACHER
export const markTuteAsSent = async (req, res) => {
    try {
        const { id } = req.params;
        const { trackingId, courierService } = req.body;

        const delivery = await TuteDelivery.findById(id)
            .populate("student", "firstName phoneNumber")
            .populate("class", "name");

        if (!delivery) return res.status(404).json({ message: "Record not found" });

        // Update Record
        delivery.status = "shipped";
        delivery.sentAt = new Date();
        delivery.trackingId = trackingId || null;
        if (courierService) delivery.courierService = courierService;

        await delivery.save();

        // Notify Student
        if (delivery.student && delivery.student.phoneNumber) {
             await sendTuteDispatchedSms(
                delivery.student.phoneNumber,
                delivery.student.firstName,
                delivery.class.name,
                delivery.targetMonth,
                trackingId
             ).catch(e => console.error("SMS Failed", e));
        }

        res.json({ success: true, message: "Marked as sent", delivery });

    } catch (err) {
        console.error("Mark Sent Error:", err);
        res.status(500).json({ message: "Update failed" });
    }
};

// 3. Mark Tute as Delivered - STUDENT or ADMIN
export const markTuteAsDelivered = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role; // Assuming you have 'role' in your User model

        const delivery = await TuteDelivery.findById(id);
        if (!delivery) return res.status(404).json({ message: "Record not found" });

        // SECURITY CHECK: 
        // Only allow if User is Admin OR if the delivery belongs to the logged-in student
        if (userRole !== 'admin' && delivery.student.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized to update this delivery" });
        }

        delivery.status = "delivered";
        await delivery.save();
        res.json({ success: true, message: "Marked as delivered", delivery });
    } catch (err) {
        console.error("Mark Delivered Error:", err);
        res.status(500).json({ message: "Update failed" });
    }
};

// 4. Get Student's Delivery History - STUDENT
export const getMyDeliveries = async (req, res) => {
    try {
        const userId = req.user._id;
        const deliveries = await TuteDelivery.find({ student: userId })
            .populate("class", "name")
            .sort({ targetMonth: -1 }); // Newest months first

        res.json(deliveries);
    } catch (err) {
        console.error("Get My Deliveries Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};