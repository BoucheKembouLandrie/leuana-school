import { Router } from 'express';
import { login, getMe, register } from '../controllers/authController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/register', register); // Optional: for initial setup
router.get('/me', authenticateToken, getMe);

export default router;
