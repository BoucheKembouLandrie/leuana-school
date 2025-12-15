import { Router } from 'express';
import { getAllSubjects, getSubjectById, createSubject, updateSubject, deleteSubject } from '../controllers/subjectController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllSubjects);
router.get('/:id', getSubjectById);
router.post('/', createSubject);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);

export default router;
