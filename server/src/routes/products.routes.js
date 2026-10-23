import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  deleteProductImage,
  addProductVariant,
  updateProductVariant,
  deleteProductVariant,
} from '../controllers/products.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public catalogue routes
router.get('/', getProducts);
router.get('/:slug', getProductBySlug);

// Admin product management routes
router.post('/admin', authenticate, requireAdmin, createProduct);
router.put('/admin/:id', authenticate, requireAdmin, updateProduct);
router.delete('/admin/:id', authenticate, requireAdmin, deleteProduct);

// Product Images CRUD
router.post('/admin/:id/images', authenticate, requireAdmin, addProductImage);
router.delete('/admin/:id/images/:imageId', authenticate, requireAdmin, deleteProductImage);

// Product Variants CRUD
router.post('/admin/:id/variants', authenticate, requireAdmin, addProductVariant);
router.put('/admin/:id/variants/:variantId', authenticate, requireAdmin, updateProductVariant);
router.delete('/admin/:id/variants/:variantId', authenticate, requireAdmin, deleteProductVariant);

// Backward compatibility aliases
router.post('/', authenticate, requireAdmin, createProduct);
router.put('/:id', authenticate, requireAdmin, updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

export default router;
