import { Router } from 'express';
import { authenticate, optionalAuthenticate, requireAdmin } from '../middleware/auth.js';
import {
  validateCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponUsageHistory,
} from '../controllers/coupons.controller.js';

const router = Router();

// Public / customer: validate coupon code during checkout
router.post('/validate', optionalAuthenticate, validateCoupon);

// Admin routes
router.get('/admin/all', authenticate, requireAdmin, getAllCoupons);
router.post('/admin', authenticate, requireAdmin, createCoupon);
router.put('/admin/:id', authenticate, requireAdmin, updateCoupon);
router.delete('/admin/:id', authenticate, requireAdmin, deleteCoupon);
router.get('/admin/:id/usage', authenticate, requireAdmin, getCouponUsageHistory);

export default router;
