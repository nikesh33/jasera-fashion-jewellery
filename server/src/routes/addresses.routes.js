import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../controllers/addresses.controller.js';

const router = Router();

// All address routes require user authentication
router.use(authenticate);

router.get('/', getAddresses);
router.post('/', createAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.patch('/:id/default', setDefaultAddress);

export default router;
