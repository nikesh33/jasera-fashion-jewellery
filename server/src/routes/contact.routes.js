import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { submitContactForm, getContactSubmissions } from '../controllers/contact.controller.js';

const router = Router();

router.post('/', submitContactForm);
router.get('/admin', authenticate, requireAdmin, getContactSubmissions);

export default router;
