import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { subscribeNewsletter, getNewsletterSubscribers } from '../controllers/newsletter.controller.js';

const router = Router();

router.post('/subscribe', subscribeNewsletter);
router.get('/admin', authenticate, requireAdmin, getNewsletterSubscribers);

export default router;
