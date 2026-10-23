import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  getPublicCollections,
  getCollectionBySlug,
  getAllCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  assignProductsToCollection,
  removeProductFromCollection,
} from '../controllers/collections.controller.js';

const router = Router();

// Public routes
router.get('/', getPublicCollections);
router.get('/:slug', getCollectionBySlug);

// Admin routes
router.get('/admin/all', authenticate, requireAdmin, getAllCollections);
router.post('/admin', authenticate, requireAdmin, createCollection);
router.put('/admin/:id', authenticate, requireAdmin, updateCollection);
router.delete('/admin/:id', authenticate, requireAdmin, deleteCollection);
router.post('/admin/:id/products', authenticate, requireAdmin, assignProductsToCollection);
router.delete('/admin/:id/products/:productId', authenticate, requireAdmin, removeProductFromCollection);

export default router;
