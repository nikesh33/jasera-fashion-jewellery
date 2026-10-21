import { Router } from 'express';
import {
  getCategories,
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categories.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public route to get active categories for Storefront, Header & Filters
router.get('/', getCategories);

// Admin routes for Category Management (strictly protected)
router.get('/admin', authenticate, requireAdmin, getAllCategoriesAdmin);
router.post('/admin', authenticate, requireAdmin, createCategory);
router.put('/admin/:id', authenticate, requireAdmin, updateCategory);
router.delete('/admin/:id', authenticate, requireAdmin, deleteCategory);

export default router;
