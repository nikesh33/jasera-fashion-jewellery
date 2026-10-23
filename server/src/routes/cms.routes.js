import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { getCmsPage, getAllCmsPages, saveCmsPage } from '../controllers/cms.controller.js';

const router = Router();

// Public: get page by slug (e.g. /api/cms/about-us)
router.get('/:slug', getCmsPage);

// Admin: list all CMS pages & save page
router.get('/admin/all', authenticate, requireAdmin, getAllCmsPages);
router.put('/admin/:id', authenticate, requireAdmin, saveCmsPage);
router.post('/admin', authenticate, requireAdmin, saveCmsPage);

export default router;
