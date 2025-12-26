import express from 'express';
import { protect, restrictTo } from '../middlewares/AuthMiddleware.js';
import { 
    validate, 
    createClassSchema, 
    updateClassSchema, 
    classIdSchema 
} from '../validators/ClassValidator.js';
import { classMediaUpload } from '../middlewares/UploadMiddleware.js'; 
import { parseClassFormData } from '../middlewares/ClassFormDataParser.js'; 
import { 
    createClass, 
    updateClass, 
    deleteClass,
    getAllClasses, 
    getClassById, 
    getAllPublicClasses,
    getPublicClass,
    activateClass,
    deactivateClass
} from '../controllers/ClassController.js';

const router = express.Router();

// ==========================================
// 1. PUBLIC ROUTES (No Auth Required)
// ==========================================
router.get('/public', getAllPublicClasses);
router.get('/public/:id', getPublicClass); // Public uses 'id' for cleaner URLs if preferred

// ==========================================
// 2. PROTECTED ROUTES (Logged In Users)
// ==========================================
router.use(protect); // Apply Auth Check to all routes below

router.get('/', getAllClasses);
router.get('/:classId', validate(classIdSchema), getClassById);

// ==========================================
// 3. ADMIN ROUTES (Strict Access)
// ==========================================
router.use(restrictTo('admin')); // Apply Admin Check to all routes below

// Create Class
router.post('/', 
    classMediaUpload,   // 1. Handle Multipart Files
    parseClassFormData, // 2. Parse JSON fields inside FormData
    validate(createClassSchema), // 3. Zod Validation
    createClass
);

// Update & Delete Class
router.route('/:classId')
    .patch(
        classMediaUpload,
        parseClassFormData,
        validate(updateClassSchema), 
        updateClass
    )
    .delete(
        validate(classIdSchema), 
        deleteClass
    );

// Status Toggles (Standardized to :classId to match validator)
router.patch('/:classId/activate', validate(classIdSchema), activateClass);
router.patch('/:classId/deactivate', validate(classIdSchema), deactivateClass);

export default router;