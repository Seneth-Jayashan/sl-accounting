import Announcement from "../models/Announcement.js"; // Adjust path as needed

class AnnouncementController {
    // 1. Create a new announcement for a specific class
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

    // 2. Get all announcements (Optional: Filter by class)
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
            const { classId } = req.body; 

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
            const announcement = await Announcement.findById(id);

            if (!announcement) {
                return res.status(404).json({ success: false, message: "Announcement not found" });
            }

            announcement.isPublished = !announcement.isPublished;
            await announcement.save();

            res.status(200).json({ success: true, isPublished: announcement.isPublished });
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