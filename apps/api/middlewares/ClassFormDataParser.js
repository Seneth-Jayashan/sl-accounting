/**
 * Middleware to parse JSON strings and convert types inside FormData.
 * Multer populates req.body with strings; this converts them back to native types
 * so validation schemas can work correctly.
 */
export const parseClassFormData = (req, res, next) => {
    if (!req.body) return next();

    try {
        const safeParse = (key) => {
            const value = req.body[key];
            if (typeof value === 'string' && value.trim() !== '') {
                if (value.length > 10000) throw new Error(`Field '${key}' is too large`);
                // Only parse if it looks like JSON
                if (value.startsWith('[') || value.startsWith('{')) {
                    req.body[key] = JSON.parse(value);
                }
            }
        };

        // Parse complex fields
        ['timeSchedules', 'tags'].forEach(safeParse);

        // Batch reference cleanup
        if (req.body.batch) {
            const b = String(req.body.batch);
            if (['null', 'undefined', ''].includes(b)) req.body.batch = null;
        }

        next();
    } catch (error) {
        return res.status(400).json({ success: false, message: "Data format error", error: error.message });
    }
};