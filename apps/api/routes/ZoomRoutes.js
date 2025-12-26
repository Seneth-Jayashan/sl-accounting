import express from 'express';
import { handleWebhook } from '../controllers/ZoomController.js';

const router = express.Router();

// Zoom sends events here (Verification + Recording Completed)
router.post('/webhook', handleWebhook);

export default router;