import { Router } from 'express';
import { getRules, createRule, deleteRule, transferRules } from '../controllers/examRuleController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticateToken, getRules);
router.post('/', authenticateToken, createRule);
router.post('/transfer', authenticateToken, transferRules);
router.delete('/:id', authenticateToken, deleteRule);

export default router;
