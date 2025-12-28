import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Resolve directory paths correctly for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- HELPER 1: Ensure Directory Exists ---
const ensureDir = (dirPath) => {
    // Resolve path relative to the project root (assuming this file is in /middlewares)
    // Adjust '../uploads' if your structure is different
    const absolutePath = path.resolve(__dirname, '..', dirPath); 
    
    if (!fs.existsSync(absolutePath)) {
        fs.mkdirSync(absolutePath, { recursive: true });
    }
    return absolutePath;
};

// --- HELPER 2: Common File Filter ---
const commonFileFilter = (req, file, cb) => {
    // Allowed extensions
    const filetypes = /jpeg|jpg|png|webp|gif/;
    // Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime type
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        // Create a proper error object
        const error = new Error(`File upload failed. Only images are allowed (${filetypes}).`);
        error.status = 400; // Bad Request
        return cb(error, false);
    }
};

// --- HELPER 3: Storage Generator ---
const createStorage = (folderName) => multer.diskStorage({
    destination: (req, file, cb) => {
        // e.g., 'uploads/images/classes'
        const relativePath = path.join('uploads', folderName);
        ensureDir(relativePath); 
        cb(null, relativePath);
    },
    filename: (req, file, cb) => {
        // Sanitize: 'coverImage' -> 'cover-image'
        // Sanitize: 'My File.jpg' -> 'my-file.jpg' (Prevent weird char issues)
        const safeName = file.originalname.replace(/\s+/g, '-').toLowerCase();
        const prefix = file.fieldname.replace(/([A-Z])/g, (g) => `-${g[0].toLowerCase()}`);
        
        // e.g. cover-image-170123456789-my-photo.jpg
        cb(null, `${prefix}-${Date.now()}-${safeName}`);
    },
});

// --- HELPER 4: Chat File Filter (Images + Docs) ---
const chatFileFilter = (req, file, cb) => {
    // Combine Image and Document Regex
    const allowedExt = /\.(jpeg|jpg|png|webp|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|csv|txt)$/i;
    const allowedMime = /(image\/|application\/pdf|application\/msword|application\/vnd.openxmlformats|application\/vnd.ms-excel|application\/vnd.ms-powerpoint|application\/zip|text\/csv)/i;

    const extname = allowedExt.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMime.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        const error = new Error('File type not supported. Allowed: Images, PDF, Office Docs, Zip.');
        error.status = 400;
        return cb(error, false);
    }
};

// ==========================================
// 1. GENERIC SINGLE UPLOADER
// Usage: router.post('/', createUploader('images/profile', 'avatar'), controller)
// ==========================================
const createUploader = (destinationFolder, fieldName, maxFileSizeMB = 5) => {
    const upload = multer({
        storage: createStorage(destinationFolder),
        limits: { fileSize: maxFileSizeMB * 1024 * 1024 },
        fileFilter: commonFileFilter,
    });
    return upload.single(fieldName);
};

// ==========================================
// 2. CLASS MEDIA UPLOADER (Multipart)
// Usage: Handles 'coverImage' (1) + 'images' (5)
// ==========================================
const classUpload = multer({
    storage: createStorage('images/classes'), 
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
    fileFilter: commonFileFilter,
});

export const classMediaUpload = classUpload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'images', maxCount: 5 }
]);


// ==========================================
// 3. CHAT FILE UPLOADER
// Usage: Handles images AND documents for chat
// ==========================================
export const chatUploader = multer({
    storage: createStorage('chat-files'), // Files go to /uploads/chat-files
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
    fileFilter: chatFileFilter,
}).single('file'); // Expects field name "file"


export default createUploader;

// --- Document Uploader (for PDFs, Docs, Excel, PowerPoint, ZIP, CSV etc.) ---
const documentFileFilter = (req, file, cb) => {
    // Allowed extensions and mimetypes for common office documents
    const allowedExt = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|csv)$/i;
    const allowedMime = /pdf|msword|wordprocessingml|spreadsheetml|excel|powerpoint|presentationml|zip|csv|text\/csv/i;

    const mimetypeOk = allowedMime.test(file.mimetype);
    const extnameOk = allowedExt.test(path.extname(file.originalname).toLowerCase());

    if (mimetypeOk && extnameOk) {
        return cb(null, true);
    } else {
        cb(new Error('Only document files are allowed (pdf, doc, docx, xls, xlsx, ppt, pptx, zip, csv).'), false);
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