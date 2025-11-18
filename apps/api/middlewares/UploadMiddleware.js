import multer from 'multer';
import path from 'path';

/**
 * Creates a configurable Multer middleware instance.
 * @param {string} destinationFolder - The sub-directory inside 'uploads/' (e.g., 'images/profile').
 * @param {string} fieldName - The name of the file field in the form data (e.g., 'profileImage').
 * @param {number} maxFileSizeMB - Maximum file size in megabytes (default: 5).
 * @returns {function} A configured Express middleware function (multer.single()).
 */
const createUploader = (destinationFolder, fieldName, maxFileSizeMB = 5) => {

    // --- 1. Storage Configuration ---
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            // NOTE: The destination path is joined here. 
            // Ensures the path is correct regardless of OS path separator.
            const destinationPath = path.join('uploads', destinationFolder);
            cb(null, destinationPath); 
        },
        filename: (req, file, cb) => {
            // Generates a unique filename (e.g., class-1700000000000.jpg)
            const prefix = fieldName.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`); // profileImage -> profile-image
            cb(null, `${prefix}-${Date.now()}${path.extname(file.originalname)}`);
        },
    });

    // --- 2. File Filter (Restrict to image types) ---
    const fileFilter = (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            // Use the correct Error object for Multer to handle
            cb(new Error(`Only image files are allowed. Accepted types: ${filetypes}`), false);
        }
    };

    // --- 3. Multer Configuration ---
    const upload = multer({
        storage: storage,
        limits: { fileSize: maxFileSizeMB * 1024 * 1024 },
        fileFilter: fileFilter,
    });

    // Returns the final middleware setup (upload.single)
    return upload.single(fieldName);
};

export default createUploader;