import { Router } from 'express';
import { getAllAttendance, getAttendanceById, getAttendanceByStudent, createAttendance, updateAttendance, deleteAttendance } from '../controllers/attendanceController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', getAllAttendance);
router.get('/:id', getAttendanceById);
router.get('/student/:studentId', getAttendanceByStudent);
router.post('/', createAttendance);
router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);

export default router;
