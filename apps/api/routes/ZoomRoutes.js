// routes/zoomRoutes.js
import express from 'express';
import {
    handleWebhook
} from '../controllers/ZoomController.js';

const router = express.Router();


router.post('/webhook', handleWebhook);

export default router;
