import express from 'express';
import { getSettings, updateSettings, getSmsBalance } from '../controllers/SettingController.js';
import { protect, restrictTo } from '../middlewares/AuthMiddleware.js';
import createUploader from '../middlewares/UploadMiddleware.js';

const router = express.Router();

// Create uploader for hero image (stores in uploads/images/settings)
const uploadHeroImage = createUploader('images/settings', 'heroImage');

// Public route to get settings
router.get('/', getSettings);

// Admin route to get SMS balance
router.get('/sms-balance', protect, restrictTo('admin'), getSmsBalance);

// Admin route to update settings (including file upload)
router.put('/', protect, restrictTo('admin'), uploadHeroImage, updateSettings);

export default router;
