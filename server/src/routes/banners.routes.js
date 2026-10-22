import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getPublicBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
} from '../controllers/banners.controller.js';

const router = Router();

// Public route for storefront to fetch active banners
router.get('/', getPublicBanners);

// Protected admin routes for banner management
router.get('/all', authenticate, requireAdmin, getAllBanners);
router.post('/', authenticate, requireAdmin, createBanner);
router.put('/:id', authenticate, requireAdmin, updateBanner);
router.delete('/:id', authenticate, requireAdmin, deleteBanner);
router.patch('/:id/status', authenticate, requireAdmin, toggleBannerStatus);

export default router;
