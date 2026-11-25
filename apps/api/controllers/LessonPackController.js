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
        const { title, description, price, isPublished } = req.body;

        // Feature 3: Parse multiple batches (sent as JSON array string or single value)
        let batches = [];
        if (req.body.batches) {
            try { batches = JSON.parse(req.body.batches); } catch { batches = [req.body.batches]; }
        } else if (req.body.batch) {
            batches = [req.body.batch];
        }

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
        if (req.files?.coverImage?.[0]) {
            coverImage = `/uploads/images/lesson-packs/${req.files.coverImage[0].filename}`;
        } else if (req.file) {
            coverImage = `/uploads/images/lesson-packs/${req.file.filename}`;
        }

        const newPack = await LessonPack.create({
            title,
            description,
            price: Number(price) || 0,
            coverImage,
            videos: parsedVideos,
            isPublished: isPublished === 'true' || isPublished === true,
            batches,
            batch: batches[0] || null,
        });

        res.status(201).json({ success: true, data: newPack });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateLessonPack = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price, isPublished } = req.body;

        const pack = await LessonPack.findById(id);
        if (!pack) return res.status(404).json({ success: false, message: "Lesson pack not found." });

        if (title) pack.title = title;
        if (description !== undefined) pack.description = description;
        if (price !== undefined) pack.price = Number(price);
        if (isPublished !== undefined) pack.isPublished = isPublished === 'true' || isPublished === true;

        // Feature 3: Update batches
        if (req.body.batches) {
            try {
                const parsed = JSON.parse(req.body.batches);
                pack.batches = parsed;
                pack.batch = parsed[0] || null;
            } catch { pack.batches = [req.body.batches]; pack.batch = req.body.batches; }
        } else if (req.body.batch !== undefined) {
            pack.batch = req.body.batch;
            if (!pack.batches || pack.batches.length === 0) pack.batches = [req.body.batch];
        }

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

        if (req.files?.coverImage?.[0]) {
            if (pack.coverImage) deleteFile(pack.coverImage);
            pack.coverImage = `/uploads/images/lesson-packs/${req.files.coverImage[0].filename}`;
        } else if (req.file) {
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
        // Delete all attachment files
        for (const att of pack.attachments || []) deleteFile(att.fileUrl);

        await pack.deleteOne();
        res.status(200).json({ success: true, message: "Deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// FEATURE 2: Lesson Pack Attachment Upload
// ==========================================

/**
 * POST /api/v1/lesson-packs/:id/attachments
 * Upload a PDF/Word file attachment to a lesson pack.
 * multipart field: "attachment"
 */
export const uploadAttachment = async (req, res) => {
    try {
        const pack = await LessonPack.findById(req.params.id);
        if (!pack) return res.status(404).json({ success: false, message: "Lesson pack not found." });

        if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded." });

        const fileUrl = `/uploads/lesson-pack-files/${req.file.filename}`;
        const attachment = {
            name: req.body.name || req.file.originalname,
            fileUrl,
            mimeType: req.file.mimetype,
            sizeBytes: req.file.size,
            order: pack.attachments.length,
        };

        pack.attachments.push(attachment);
        await pack.save();

        res.status(201).json({ success: true, attachment: pack.attachments[pack.attachments.length - 1] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * DELETE /api/v1/lesson-packs/:id/attachments/:attachmentId
 * Remove an attachment from a lesson pack and delete its physical file.
 */
export const deleteAttachment = async (req, res) => {
    try {
        const pack = await LessonPack.findById(req.params.id);
        if (!pack) return res.status(404).json({ success: false, message: "Lesson pack not found." });

        const att = pack.attachments.id(req.params.attachmentId);
        if (!att) return res.status(404).json({ success: false, message: "Attachment not found." });

        deleteFile(att.fileUrl);
        att.deleteOne();
        await pack.save();

        res.status(200).json({ success: true, message: "Attachment deleted." });
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

export const getAllPublicLessonPacks = async (req, res) => {
    try {
        const query = { isPublished: true };

        // Include the videos array so the frontend can display the correct video count
        const packs = await LessonPack.find(query)
            .sort({ createdAt: -1 });

        // Hide youtube URLs and IDs for the public listing
        const safePacks = packs.map(pack => {
            const hiddenPack = pack.toObject();
            if (hiddenPack.videos) {
                hiddenPack.videos = hiddenPack.videos.map(v => ({
                    ...v,
                    youtubeUrl: null,
                    youtubeId: null
                }));
            }
            return hiddenPack;
        });

        res.status(200).json({ success: true, count: safePacks.length, data: safePacks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- STUDENT FETCH LOGIC ---

export const getAllLessonPacks = async (req, res) => {
    try {
        const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'teacher');
        const query = isAdmin ? {} : { isPublished: true };

        // Include the videos array so the frontend can calculate watch progress ticks
        const packs = await LessonPack.find(query)
            .sort({ createdAt: -1 });

        // If it's a student, we need to check which ones they have already purchased
        if (!isAdmin && req.user) {
            const enrollments = await Enrollment.find({
                student: req.user._id,
                lessonPack: { $exists: true },
                paymentStatus: "paid"
            });
            const purchasedPackIds = enrollments.map(e => e.lessonPack.toString());

            const packsWithAccessFlag = packs.map(pack => {
                const hasAccess = purchasedPackIds.includes(pack._id.toString());
                const packObj = pack.toObject();
                if (!hasAccess && packObj.videos) {
                    packObj.videos = packObj.videos.map(v => ({
                        ...v,
                        youtubeUrl: null,
                        youtubeId: null
                    }));
                }
                return {
                    ...packObj,
                    hasAccess
                };
            });
            return res.status(200).json({ success: true, count: packs.length, data: packsWithAccessFlag });
        }

        res.status(200).json({ success: true, count: packs.length, data: packs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getPublicById = async (req, res) => {
    try {
        const pack = await LessonPack.findById(req.params.id);
        if (!pack) return res.status(404).json({ success: false, message: "Not found." });
        if (!pack.isPublished) return res.status(403).json({ success: false, message: "This lesson pack is not available." });

        // Hide youtube URLs and IDs for public view
        const hiddenPack = pack.toObject();
        if (hiddenPack.videos) {
            hiddenPack.videos = hiddenPack.videos.map(v => ({
                ...v,
                youtubeUrl: null,
                youtubeId: null
            }));
        }

        res.status(200).json({ success: true, data: hiddenPack });


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