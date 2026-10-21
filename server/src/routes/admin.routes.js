import { Router } from 'express';
import { getDashboardStats, getAllOrders, updateOrderStatus } from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Single Admin routes - protected strictly by server-side admin verification
router.use(authenticate, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);

export default router;
