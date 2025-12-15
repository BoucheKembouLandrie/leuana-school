import { Router } from 'express';
import { getAllEvaluations, createEvaluation, updateEvaluation, deleteEvaluation } from '../controllers/evaluationController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllEvaluations);
router.post('/', createEvaluation);
router.put('/:id', updateEvaluation);
router.delete('/:id', deleteEvaluation);

export default router;
