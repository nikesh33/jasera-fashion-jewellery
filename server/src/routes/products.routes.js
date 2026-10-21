import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/products.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public catalogue routes
router.get('/', getProducts);
router.get('/:slug', getProductBySlug);

// Admin product management routes (strictly protected by server-side admin check)
router.post('/admin', authenticate, requireAdmin, createProduct);
router.put('/admin/:id', authenticate, requireAdmin, updateProduct);
router.delete('/admin/:id', authenticate, requireAdmin, deleteProduct);

// Aliases for convenience
router.post('/', authenticate, requireAdmin, createProduct);
router.put('/:id', authenticate, requireAdmin, updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

export default router;
