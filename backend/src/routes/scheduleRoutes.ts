import { Router } from 'express';
import { getAllSchedules, getSchedulesByClass, createSchedule, updateSchedule, deleteSchedule } from '../controllers/scheduleController';
import { authenticateToken } from '../middlewares/authMiddleware';

console.log('Loading scheduleRoutes...');
const router = Router();

router.get('/test', (req, res) => {
    console.log('GET /api/schedules/test hit');
    res.json({ message: 'Schedule routes working' });
});

router.use(authenticateToken);

router.get('/', getAllSchedules);
router.get('/class/:classId', getSchedulesByClass);
router.post('/', createSchedule);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

export default router;
