import { Router } from 'express';
import {
  createOrder,
  verifyPayment,
  getOrderTracking,
  getUserOrders,
} from '../controllers/orders.controller.js';
import { optionalAuthenticate, authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', optionalAuthenticate, createOrder);
router.post('/verify-payment', optionalAuthenticate, verifyPayment);
router.get('/track/:id', optionalAuthenticate, getOrderTracking);
router.get('/my-orders', authenticate, getUserOrders);

export default router;
