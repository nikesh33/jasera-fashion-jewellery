import { Router } from 'express';
import { getAllPaymentsAdmin, verifyPayment, refundPayment } from '../controllers/payments.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Admin routes for manual payment management & tracking
router.get('/admin/all', authenticateToken, requireAdmin, getAllPaymentsAdmin);
router.patch('/admin/:id/verify', authenticateToken, requireAdmin, verifyPayment);
router.patch('/admin/:id/refund', authenticateToken, requireAdmin, refundPayment);

export default router;
