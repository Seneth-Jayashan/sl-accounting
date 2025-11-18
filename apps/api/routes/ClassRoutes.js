import express from 'express';
import { protect, restrictTo } from '../middlewares/AuthMiddleware.js';
import { validate, createClassSchema, updateClassSchema, classIdSchema } from '../validators/ClassValidator.js';
import { 
    createClass, 
    updateClass, 
    deleteClass,
    getAllClasses, 
    getClassDetails, 
    enrollInClass 
} from '../controllers/ClassController.js';

const router = express.Router();

// Public (Authenticated) routes for students/admins to view classes
router.get('/', protect, getAllClasses);
router.get('/:classId', protect, validate(classIdSchema), getClassDetails);

// Admin-only routes for CRUD
router.route('/')
    // POST /api/v1/classes - Create new class
    .post(
        protect, 
        restrictTo('admin'), 
        validate(createClassSchema), 
        createClass
    );

router.route('/:classId')
    // PATCH /api/v1/classes/:classId - Update class details
    .patch(
        protect, 
        restrictTo('admin'), 
        validate(updateClassSchema), 
        updateClass
    )
    // DELETE /api/v1/classes/:classId - Soft delete class
    .delete(
        protect, 
        restrictTo('admin'), 
        validate(classIdSchema), 
        deleteClass
    );

// Student-only actions (enroll)
router.post(
    '/:classId/enroll', 
    protect, 
    restrictTo('student'), 
    validate(classIdSchema), 
    enrollInClass
);


export default router;