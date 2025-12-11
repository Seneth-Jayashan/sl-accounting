export const parseClassFormData = (req, res, next) => {
    // If no body, skip
    if (!req.body) return next();

    try {
        // 1. Parse JSON Strings
        if (req.body.timeSchedules && typeof req.body.timeSchedules === 'string') {
            req.body.timeSchedules = JSON.parse(req.body.timeSchedules);
        }
        if (req.body.tags && typeof req.body.tags === 'string') {
            req.body.tags = JSON.parse(req.body.tags);
        }

        // 2. Convert "Number Strings" to Numbers
        ['price', 'totalSessions', 'sessionDurationMinutes'].forEach((field) => {
            if (req.body[field]) req.body[field] = Number(req.body[field]);
        });

        // 3. Convert Booleans
        if (req.body.isPublished !== undefined) {
            req.body.isPublished = String(req.body.isPublished) === 'true';
        }

        // 4. Clean up Batch (remove empty strings)
        if (!req.body.batch || req.body.batch === 'null' || req.body.batch === 'undefined') {
            delete req.body.batch;
        }
        
        // Remove typo field if present
        delete req.body.bacth;

        next();
    } catch (error) {
        return res.status(400).json({ success: false, message: "Invalid JSON format in form data." });
    }
};