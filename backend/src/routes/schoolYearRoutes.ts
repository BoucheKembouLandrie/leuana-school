import { Router } from 'express';
import { getAllSchoolYears, createSchoolYear, deleteSchoolYear } from '../controllers/schoolYearController';
import { authenticateToken, authorizeRole } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', authenticateToken, getAllSchoolYears);
router.post('/', authenticateToken, authorizeRole(['admin']), createSchoolYear);
router.delete('/:id', authenticateToken, authorizeRole(['admin']), deleteSchoolYear);

export default router;
