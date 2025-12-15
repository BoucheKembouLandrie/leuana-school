import { Router } from 'express';
import { getAllGrades, getGradeById, getGradesByStudent, getGradesByClass, createGrade, updateGrade, deleteGrade, saveGrades, getSuccessRate, getSubjectStats } from '../controllers/gradeController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.post('/bulk', saveGrades);
router.get('/stats/subjects', getSubjectStats);
router.get('/success-rate', getSuccessRate);
router.get('/', getAllGrades);
router.get('/:id', getGradeById);
router.get('/student/:studentId', getGradesByStudent);
router.get('/class/:classId', getGradesByClass);
router.post('/', createGrade);
router.put('/:id', updateGrade);
router.delete('/:id', deleteGrade);

export default router;
