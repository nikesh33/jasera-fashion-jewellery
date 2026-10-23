import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getPublicAnnouncements,
  getAdminAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcements.controller.js';

const router = Router();

// Public route for storefront
router.get('/', getPublicAnnouncements);

// Admin routes
router.get('/admin', getAdminAnnouncements);
router.post('/admin', authenticate, requireAdmin, createAnnouncement);
router.put('/admin/:id', authenticate, requireAdmin, updateAnnouncement);
router.delete('/admin/:id', authenticate, requireAdmin, deleteAnnouncement);

export default router;
