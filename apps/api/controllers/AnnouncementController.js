import Announcement from "../models/Announcement.js"; // Adjust path as needed
import { sendAnnouncementEmail } from "../utils/email/Template.js";

class AnnouncementController {
    async createAnnouncement(req, res) {
        try {
            const { title, content, classId, isPublished } = req.body;

            const announcement = await Announcement.create({
                title,
                content,
                class: classId,
                isPublished: isPublished || false
            });

            res.status(201).json({ success: true, data: announcement });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async getAllAnnouncements(req, res) {
        try {
            const { classId } = req.query;
            const filter = classId ? { class: classId } : {};

            // We use .populate() or rely on the virtuals you defined
            const announcements = await Announcement.find(filter)
                .populate("classDetails")
                .sort({ createdAt: -1 });

            res.status(200).json({ success: true, count: announcements.length, data: announcements });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getStudentAnnouncements(req, res) {
        try {
            const { classId } = req.params;

            if (!classId) {
                return res.status(400).json({ 
                    success: false, 
                    message: "classId is required in the request body" 
                });
            }

            const announcements = await Announcement.find({
                class: classId,
                isPublished: true // Ensures students only see "Live" posts
            })
            .sort({ createdAt: -1 });

            res.status(200).json({ success: true, data: announcements });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // 3. Update announcement (Title, Content, or Class)
    async updateAnnouncement(req, res) {
        try {
            const { id } = req.params;
            const updatedAnnouncement = await Announcement.findByIdAndUpdate(
                id,
                req.body,
                { new: true, runValidators: true }
            );

            if (!updatedAnnouncement) {
                return res.status(404).json({ success: false, message: "Announcement not found" });
            }

            res.status(200).json({ success: true, data: updatedAnnouncement });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // 4. Update Visibility (Toggle isPublished)
    async toggleVisibility(req, res) {
        try {
            const { id } = req.params;
            const announcement = await Announcement.findById(id).populate("class", "name students email");

            if (!announcement) {
                return res.status(404).json({ success: false, message: "Announcement not found" });
            }

            announcement.isPublished = !announcement.isPublished;
            await announcement.save();
            res.status(200).json({ success: true, isPublished: announcement.isPublished });

            if (announcement.isPublished) {
                const students = announcement.class?.students || [];
                console.log(`Announcement published. Sending emails to ${students.length} students.`);
                Promise.all(
                    students.map(student => {
                        if (student.email) {
                            return sendAnnouncementEmail(student.email, announcement);
                        }
                    })
                ).catch(err => {
                    console.error("Failed to send background emails:", err);
                });
            }
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // 5. Delete Announcement
    async deleteAnnouncement(req, res) {
        try {
            const { id } = req.params;
            const deleted = await Announcement.findByIdAndDelete(id);

            if (!deleted) {
                return res.status(404).json({ success: false, message: "Announcement not found" });
            }

            res.status(200).json({ success: true, message: "Announcement deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default new AnnouncementController();