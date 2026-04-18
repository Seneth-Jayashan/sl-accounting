import LessonPack from "../models/LessonPack.js";
import Enrollment from "../models/Enrollment.js";
import fs from "fs";
import path from "path";

const extractYoutubeId = (url) => {
    if (!url) return null;
    
    // Matches http/https, www/m, and the various paths: watch, v, embed, shorts, live, youtu.be
    const regExp = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?.*v=|v\/|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/;
    const match = url.match(regExp);
    
    // match[1] contains the exact 11-character YouTube ID
    return match ? match[1] : null;
};

const deleteFile = (fileUrl) => {
    if (!fileUrl) return;
    try {
        const filePath = path.join(process.cwd(), fileUrl);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
        console.warn("Failed to delete physical file:", err.message);
    }
};

// --- CORE CRUD ---

export const createLessonPack = async (req, res) => {
    try {
        const { title, description, price, isPublished, batch } = req.body;
        
        // Parse the videos array sent as a JSON string from FormData
        let parsedVideos = [];
        if (req.body.videos) {
            try {
                const rawVideos = JSON.parse(req.body.videos);
                parsedVideos = rawVideos.map((v, i) => ({
                    ...v,
                    youtubeId: extractYoutubeId(v.youtubeUrl),
                    order: i
                })).filter(v => v.youtubeId); // Only keep valid URLs
            } catch (e) {
                return res.status(400).json({ success: false, message: "Invalid video data format." });
            }
        }

        let coverImage = null;
        if (req.file) coverImage = `/uploads/images/lesson-packs/${req.file.filename}`;

        const newPack = await LessonPack.create({
            title,
            description,
            price: Number(price) || 0,
            coverImage,
            videos: parsedVideos,
            isPublished: isPublished === 'true' || isPublished === true,
            batch: req.body.batch

        });

        res.status(201).json({ success: true, data: newPack });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateLessonPack = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price, isPublished, batch } = req.body;

        const pack = await LessonPack.findById(id);
        if (!pack) return res.status(404).json({ success: false, message: "Lesson pack not found." });

        if (title) pack.title = title;
        if (description !== undefined) pack.description = description;
        if (price !== undefined) pack.price = Number(price);
        if (isPublished !== undefined) pack.isPublished = isPublished === 'true' || isPublished === true;
        if (batch !== undefined) pack.batch = batch;

        if (req.body.videos) {
            try {
                const rawVideos = JSON.parse(req.body.videos);
                pack.videos = rawVideos.map((v, i) => ({
                    title: v.title,
                    youtubeUrl: v.youtubeUrl,
                    youtubeId: extractYoutubeId(v.youtubeUrl) || v.youtubeId,
                    durationMinutes: v.durationMinutes,
                    order: i,
                })).filter(v => v.youtubeId);
            } catch (e) {
                return res.status(400).json({ success: false, message: "Invalid video data format." });
            }
        }

        if (req.file) {
            if (pack.coverImage) deleteFile(pack.coverImage);
            pack.coverImage = `/uploads/images/lesson-packs/${req.file.filename}`;
        }

        await pack.save();
        res.status(200).json({ success: true, data: pack });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteLessonPack = async (req, res) => {
    try {
        const pack = await LessonPack.findById(req.params.id);
        if (!pack) return res.status(404).json({ success: false, message: "Not found." });

        if (pack.coverImage) deleteFile(pack.coverImage);
        
        await pack.deleteOne();
        res.status(200).json({ success: true, message: "Deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const togglePublishStatus = async (req, res) => {
    try {
        const pack = await LessonPack.findById(req.params.id);
        if (!pack) return res.status(404).json({ success: false, message: "Not found." });

        pack.isPublished = !pack.isPublished;
        await pack.save();
        res.status(200).json({ success: true, isPublished: pack.isPublished });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- STUDENT FETCH LOGIC ---

export const getAllLessonPacks = async (req, res) => {
    try {
        const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'teacher');
        const query = isAdmin ? {} : { isPublished: true };
        
        // Exclude the videos array from the initial list fetch to save bandwidth
        const packs = await LessonPack.find(query)
            .select("-videos")
            .sort({ createdAt: -1 });

        // If it's a student, we need to check which ones they have already purchased
        if (!isAdmin && req.user) {
            const enrollments = await Enrollment.find({ student: req.user._id, lessonPack: { $exists: true } });
            const purchasedPackIds = enrollments.map(e => e.lessonPack.toString());
            
            const packsWithAccessFlag = packs.map(pack => ({
                ...pack.toObject(),
                hasAccess: purchasedPackIds.includes(pack._id.toString())
            }));
            return res.status(200).json({ success: true, count: packs.length, data: packsWithAccessFlag });
        }

        res.status(200).json({ success: true, count: packs.length, data: packs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getLessonPackById = async (req, res) => {
    try {
        const pack = await LessonPack.findById(req.params.id);
        if (!pack) return res.status(404).json({ success: false, message: "Not found." });

        const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'teacher');

        // If admin, just return the pack
        if (isAdmin) {
            return res.status(200).json({ success: true, data: pack });
        }

        // If student, check if they purchased it
        const enrollment = await Enrollment.findOne({ 
            student: req.user._id, 
            lessonPack: pack._id 
        });
        
        // FIX: Ensure they have the enrollment AND it is paid/active!
        if (!enrollment || enrollment.paymentStatus !== 'paid') {
            const hiddenPack = pack.toObject();
            hiddenPack.videos = hiddenPack.videos.map(v => ({
                title: v.title,
                durationMinutes: v.durationMinutes,
                order: v.order,
                _id: v._id,
                youtubeUrl: null, // HIDE URL
                youtubeId: null   // HIDE ID
            }));
            hiddenPack.hasAccess = false;
            return res.status(200).json({ 
                success: true, 
                data: hiddenPack, 
                message: "Purchase required to view videos." 
            });
        }

        // Student owns it, return full payload
        const fullPack = pack.toObject();
        fullPack.hasAccess = true;
        res.status(200).json({ success: true, data: fullPack });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};