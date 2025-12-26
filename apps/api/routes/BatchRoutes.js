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

// ==========================================
// 1. PUBLIC ROUTES
// ==========================================
router.get('/public', getAllPublicBatches);

// ==========================================
// 2. PROTECTED ROUTES (Logged in Users)
// ==========================================
// Students need to see batches to know what they are enrolled in
router.get('/', protect, getAllBatches);
router.get('/:id', protect, getBatchById);

// ==========================================
// 3. ADMIN ROUTES (Strict Access)
// ==========================================
router.use(protect, restrictTo('admin'));

router.post('/', createBatch);
router.patch('/:id/toggle', toggleBatchStatus); // Toggle is an update action

router.route('/:id')
    .put(updateBatch)
    .delete(deleteBatch);

export default router;