import { Router } from 'express';
import { getAllStudents, getStudentById, createStudent, updateStudent, deleteStudent, getStudentsWithAverage, transferStudents } from '../controllers/studentController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllStudents);
router.get('/:id', getStudentById);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);
router.get('/data/with-average', getStudentsWithAverage);
router.post('/action/transfer', transferStudents);

export default router;
