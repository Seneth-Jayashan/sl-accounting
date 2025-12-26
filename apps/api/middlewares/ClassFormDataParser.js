/**
 * Middleware to parse JSON strings and convert types inside FormData.
 * Multer populates req.body with strings; this converts them back to native types
 * so validation schemas can work correctly.
 */
export const parseClassFormData = (req, res, next) => {
    // If no body, nothing to parse
    if (!req.body) return next();

    try {
        // 1. Safe JSON Parsing Helper
        const safeParse = (key) => {
            const value = req.body[key];
            if (typeof value === 'string') {
                // Security: Prevent parsing massive strings (DoS protection)
                if (value.length > 10000) {
                    throw new Error(`Field '${key}' is too large to parse`);
                }
                try {
                    req.body[key] = JSON.parse(value);
                } catch (e) {
                    // If parse fails, we leave it as string or throw depending on strictness.
                    // Here we throw to fail early.
                    throw new Error(`Invalid JSON format in field '${key}'`);
                }
            }
        };

        // Parse Array/Object Fields
        if (req.body.timeSchedules) safeParse('timeSchedules');
        if (req.body.tags) safeParse('tags');

        // 2. Convert Numeric Strings
        const numericFields = ['price', 'totalSessions', 'sessionDurationMinutes'];
        numericFields.forEach((field) => {
            if (req.body[field] !== undefined && req.body[field] !== '') {
                const num = Number(req.body[field]);
                // Only update if it's a valid number, otherwise let Validator handle NaN error
                if (!isNaN(num)) {
                    req.body[field] = num;
                }
            }
        });

        // 3. Convert Booleans
        // FormData sends "true"/"false" as strings
        if (req.body.isPublished !== undefined) {
            req.body.isPublished = String(req.body.isPublished) === 'true';
        }
        if (req.body.isActive !== undefined) {
            req.body.isActive = String(req.body.isActive) === 'true';
        }

        // 4. Clean up References (Batch ID)
        // Frontend might send "null", "undefined" or "" string for optional fields
        if (req.body.batch) {
            const val = String(req.body.batch).trim();
            if (val === 'null' || val === 'undefined' || val === '') {
                req.body.batch = undefined;
            }
        }

        // Cleanup Legacy Typos (if any remain)
        if (req.body.bacth) delete req.body.bacth;

        next();

    } catch (error) {
        console.error("FormData Parsing Error:", error.message);
        return res.status(400).json({ 
            success: false, 
            message: "Invalid data format", 
            error: error.message 
        });
    }
};