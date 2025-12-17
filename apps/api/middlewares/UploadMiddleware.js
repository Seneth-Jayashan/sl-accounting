import multer from 'multer';
import path from 'path';
import fs from 'fs';

// --- Helper 1: Ensure Directory Exists ---
const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// --- Helper 2: Common File Filter ---
const commonFileFilter = (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error(`Only image files are allowed. Accepted types: ${filetypes}`), false);
    }
};

// --- Helper 3: Storage Generator ---
const createStorage = (folderName) => multer.diskStorage({
    destination: (req, file, cb) => {
        const destinationPath = path.join('uploads', folderName);
        ensureDir(destinationPath); // Automatically create folder if missing
        cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
        // e.g. coverImage -> cover-image-123456789.jpg
        const prefix = file.fieldname.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
        cb(null, `${prefix}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

/**
 * OPTION A: Generic Single Uploader (Existing)
 * Usage: createUploader('images/profile', 'profilePic')
 */
const createUploader = (destinationFolder, fieldName, maxFileSizeMB = 5) => {
    const upload = multer({
        storage: createStorage(destinationFolder),
        limits: { fileSize: maxFileSizeMB * 1024 * 1024 },
        fileFilter: commonFileFilter,
    });
    return upload.single(fieldName);
};

/**
 * OPTION B: Class Media Uploader (New)
 * Handles 'coverImage' + 'images' (gallery)
 * Saves to 'uploads/images/classes'
 */
const classUpload = multer({
    storage: createStorage('images/classes'), // Save specifically to classes folder
    limits: { fileSize: 5 * 1024 * 1024 },    // 5MB limit
    fileFilter: commonFileFilter,
});

export const classMediaUpload = classUpload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 5 }
]);

export default createUploader;

// --- Document Uploader (for PDFs, Docs, etc.) ---
const documentFileFilter = (req, file, cb) => {
    const allowed = /pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document|zip/;
    const mimetype = allowed.test(file.mimetype);
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only document files are allowed (pdf, doc, docx, zip).'), false);
    }
};

export const createDocumentUploader = (destinationFolder = 'docs', fieldName = 'file', maxFileSizeMB = 20) => {
    const upload = multer({
        storage: createStorage(destinationFolder),
        limits: { fileSize: maxFileSizeMB * 1024 * 1024 },
        fileFilter: documentFileFilter,
    });
    return upload.single(fieldName);
};