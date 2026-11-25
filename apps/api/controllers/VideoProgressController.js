import VideoProgress from "../models/VideoProgress.js";

export const upsertProgress = async (req, res) => {
    try {
        const { videoId, sessionId, status } = req.body;
        const studentId = req.user._id;

        if ((!videoId && !sessionId) || !status) {
            return res.status(400).json({ success: false, message: "videoId or sessionId and status are required." });
        }

        if (!['started', 'completed'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status." });
        }

        const query = sessionId
            ? { student: studentId, sessionId }
            : { student: studentId, videoId };

        let progress = await VideoProgress.findOne(query);

        if (progress) {
            if (progress.status === 'started' && status === 'completed') {
                progress.status = 'completed';
                await progress.save();
            }
        } else {
            progress = await VideoProgress.create({
                student: studentId,
                ...(videoId ? { videoId } : {}),
                ...(sessionId ? { sessionId } : {}),
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
        const { type } = req.query;

        const filter = { student: studentId };
        if (type === "recording") {
            filter.sessionId = { $ne: null };
        }

        const progressList = await VideoProgress.find(filter);

        const progressMap = {};
        progressList.forEach(p => {
            if (p.videoId) {
                progressMap[p.videoId] = { status: p.status };
            }
            if (p.sessionId) {
                progressMap[p.sessionId.toString()] = { status: p.status };
            }
        });

        res.status(200).json({ success: true, data: progressMap });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
