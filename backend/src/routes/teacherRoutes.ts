import { Router } from 'express';
import { getAllTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher, transferTeachers } from '../controllers/teacherController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllTeachers);
router.get('/:id', getTeacherById);
router.post('/', createTeacher);
router.put('/:id', updateTeacher);
router.delete('/:id', deleteTeacher);
router.post('/action/transfer', transferTeachers);

export default router;
