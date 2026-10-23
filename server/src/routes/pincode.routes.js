import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { checkPincode, getAllPincodes, savePincode, deletePincode } from '../controllers/pincode.controller.js';

const router = Router();

// Public: check pincode on PDP / Checkout
router.get('/check/:pincode', checkPincode);

// Admin routes
router.get('/admin/all', authenticate, requireAdmin, getAllPincodes);
router.post('/admin', authenticate, requireAdmin, savePincode);
router.delete('/admin/:pincode', authenticate, requireAdmin, deletePincode);

export default router;
