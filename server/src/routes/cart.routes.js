import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  syncCart,
  clearCart,
} from '../controllers/cart.controller.js';

const router = Router();

// All cart endpoints require user authentication
router.use(authenticate);

router.get('/', getCart);
router.post('/items', addToCart);
router.put('/items/:id', updateCartItem);
router.delete('/items/:id', removeCartItem);
router.post('/sync', syncCart);
router.delete('/clear', clearCart);

export default router;
