import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  createReturnRequest,
  getCustomerReturns,
  getAllReturnRequests,
  updateReturnRequestStatus,
} from '../controllers/returns.controller.js';

const router = Router();

// Customer routes (authenticated)
router.post('/', authenticate, createReturnRequest);
router.get('/my-returns', authenticate, getCustomerReturns);

// Admin routes
router.get('/admin/all', authenticate, requireAdmin, getAllReturnRequests);
router.patch('/admin/:id/status', authenticate, requireAdmin, updateReturnRequestStatus);

export default router;
