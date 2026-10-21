import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { customerLogin, adminLogin, register, getProfile } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Rate limiter for authentication endpoints (15 attempts per 15 mins to block brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 15 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

// Customer authentication routes
router.post('/login', authLimiter, customerLogin);
router.post('/register', authLimiter, register);
router.get('/profile', authenticate, getProfile);

// Separate Store Administrator authentication route
router.post('/admin/login', authLimiter, adminLogin);

export default router;
