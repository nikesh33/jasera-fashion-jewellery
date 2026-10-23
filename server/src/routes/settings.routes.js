import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { getStoreSettings, updateStoreSettings } from '../controllers/settings.controller.js';

const router = Router();

// Public endpoint for storefront
router.get('/', getStoreSettings);

// Admin endpoint to update store settings
router.put('/admin', authenticate, requireAdmin, updateStoreSettings);

export default router;
