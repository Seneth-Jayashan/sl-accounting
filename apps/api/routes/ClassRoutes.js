import express from 'express';
import { protect, restrictTo } from '../middlewares/AuthMiddleware.js';
import { validate, createClassSchema, updateClassSchema, classIdSchema } from '../validators/ClassValidator.js';
import { classMediaUpload } from '../middlewares/UploadMiddleware.js'; // Named Import
import { parseClassFormData } from '../middlewares/ClassFormDataParser.js'; 
import { 
    createClass, 
    updateClass, 
    deleteClass,
    getAllClasses, 
    getClassById, 
} from '../controllers/ClassController.js';

const router = express.Router();

router.get('/', protect, getAllClasses);
router.get('/:classId', protect, validate(classIdSchema), getClassById);

router.route('/')
    .post(
        protect, 
        restrictTo('admin'), 
        classMediaUpload,   // 1. Handle files (multipart)
        parseClassFormData, // 2. Parse text fields
        validate(createClassSchema), // 3. Validate
        createClass
    );

router.route('/:classId')
    .patch(
        protect, 
        restrictTo('admin'), 
        classMediaUpload,
        parseClassFormData,
        validate(updateClassSchema), 
        updateClass
    )
    .delete(
        protect, 
        restrictTo('admin'), 
        validate(classIdSchema), 
        deleteClass
    );

export default router;