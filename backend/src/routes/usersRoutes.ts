import { Router } from 'express';
import { getAllUsers, createUser, updateUser, deleteUser } from '../controllers/usersController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// User management routes (admin only - add middleware check if needed)
router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
