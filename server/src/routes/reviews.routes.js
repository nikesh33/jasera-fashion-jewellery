import { Router } from 'express';
import { authenticate, optionalAuthenticate, requireAdmin } from '../middleware/auth.js';
import {
  getProductReviews,
  createReview,
  getAllReviewsAdmin,
  moderateReview,
} from '../controllers/reviews.controller.js';

const router = Router();

// Public: get reviews for a product
router.get('/product/:productId', getProductReviews);

// Customer: write a review
router.post('/', authenticate, createReview);

// Admin: list all & moderate
router.get('/admin/all', authenticate, requireAdmin, getAllReviewsAdmin);
router.patch('/admin/:id/status', authenticate, requireAdmin, moderateReview);

export default router;
