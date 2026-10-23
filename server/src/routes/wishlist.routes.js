import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getWishlist,
  toggleWishlist,
  removeFromWishlist,
  syncWishlist,
} from '../controllers/wishlist.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', getWishlist);
router.post('/toggle', toggleWishlist);
router.delete('/:productId', removeFromWishlist);
router.post('/sync', syncWishlist);

export default router;
