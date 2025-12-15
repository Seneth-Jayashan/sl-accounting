import express from 'express';
import { protect, restrictTo } from '../middlewares/AuthMiddleware.js';
import { 
    createBatch, 
    getAllBatches, 
    getBatchById, 
    updateBatch, 
    deleteBatch,
    toggleBatchStatus,
    getAllPublicBatches
} from '../controllers/BatchController.js';

const router = express.Router();

// --- 1. Read Routes (Accessible to Authenticated Users) ---
router.get('/', protect, getAllBatches);

router.get('/public', getAllPublicBatches);

router.get('/:id', protect, getBatchById);
// --- 2. Admin Only Routes (Create, Update, Delete) ---
// All routes below this line require 'admin' role
router.use(protect, restrictTo('admin'));

router.post('/', createBatch);

router.route('/:id')
    .put(updateBatch)
    .delete(deleteBatch);

// Quick helper to activate/deactivate
router.patch('/:id/toggle', toggleBatchStatus);

export default router;