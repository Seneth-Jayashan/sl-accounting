import VideoProgress from "../models/VideoProgress.js";

export const upsertProgress = async (req, res) => {
    try {
        const { videoId, status } = req.body;
        const studentId = req.user._id;

        if (!videoId || !status) {
            return res.status(400).json({ success: false, message: "videoId and status are required." });
        }

        if (!['started', 'completed'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status." });
        }

        // Find existing progress
        let progress = await VideoProgress.findOne({ student: studentId, videoId });

        if (progress) {
            // Only update if upgrading from started to completed
            if (progress.status === 'started' && status === 'completed') {
                progress.status = 'completed';
                await progress.save();
            }
        } else {
            // Create new
            progress = await VideoProgress.create({
                student: studentId,
                videoId,
                status
            });
        }

        res.status(200).json({ success: true, data: progress });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyProgress = async (req, res) => {
    try {
        const studentId = req.user._id;
        
        const progressList = await VideoProgress.find({ student: studentId });
        
        // Convert array to a record map for easier frontend consumption
        const progressMap = {};
        progressList.forEach(p => {
            progressMap[p.videoId] = { status: p.status };
        });

        res.status(200).json({ success: true, data: progressMap });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
