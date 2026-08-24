import express from 'express';
import {
    getAllNews,
    getNewsById,
    createNews,
    updateNews,
    deleteNews
} from '../controllers/NewsController.js';
import { protect, restrictTo } from '../middlewares/AuthMiddleware.js';
import createUploader from '../middlewares/UploadMiddleware.js';

const router = express.Router();
const uploadCover = createUploader('images/news', 'coverImage');

// Public routes
// To fetch only published news, the client can pass ?isPublished=true
router.get('/', getAllNews);
router.get('/:id', getNewsById);

// Protected routes (Admin only)
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', uploadCover, createNews);
router.put('/:id', uploadCover, updateNews);
router.delete('/:id', deleteNews);

export default router;
