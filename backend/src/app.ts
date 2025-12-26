import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { sequelize } from './models';

const app = express();

// Middleware
app.use(cors({
    origin: true, // Allow any origin
    credentials: true
}));
// app.use(helmet({
//     crossOriginResourcePolicy: { policy: "cross-origin" },
// }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Direct Debug Route
app.get('/api/schedules-direct', (req, res) => {
    res.json({ message: 'Direct route working' });
});

// DIRECT ROUTE IMPLEMENTATION TO FIX 404
import Schedule from './models/Schedule';
import Subject from './models/Subject';
import Teacher from './models/Teacher';

app.post('/api/schedules', async (req, res) => {
    console.log('DIRECT POST /api/schedules HIT');
    try {
        const { classe_id, subject_id, day_of_week, start_time, end_time } = req.body;
        const schoolYearId = req.headers['x-school-year-id'];

        if (!schoolYearId) {
            return res.status(400).json({ message: 'School Year ID is required' });
        }

        console.log('Creating schedule with:', req.body);

        const schedule = await Schedule.create({
            classe_id,
            subject_id,
            day_of_week,
            start_time,
            end_time,
            school_year_id: schoolYearId
        });

        console.log('Schedule created ID:', schedule.id);
        res.status(201).json(schedule);
    } catch (error) {
        console.error('Error in direct schedule creation:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});

app.get('/api/schedules/class/:classId', async (req, res) => {
    console.log('DIRECT GET /api/schedules/class/:classId HIT');
    try {
        const { classId } = req.params;
        const schoolYearId = req.headers['x-school-year-id'];

        const schedules = await Schedule.findAll({
            where: {
                classe_id: classId,
                school_year_id: schoolYearId
            },
            include: [{
                model: Subject,
                as: 'subject',
                include: [{
                    model: Teacher,
                    as: 'teacher',
                    attributes: ['id', 'nom', 'prenom']
                }]
            }],
            order: [['day_of_week', 'ASC'], ['start_time', 'ASC']]
        });
        res.json(schedules);
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
// END DIRECT ROUTE

import authRoutes from './routes/authRoutes';
import studentRoutes from './routes/studentRoutes';
import classRoutes from './routes/classRoutes';
import teacherRoutes from './routes/teacherRoutes';
import subjectRoutes from './routes/subjectRoutes';
import gradeRoutes from './routes/gradeRoutes';
import paymentRoutes from './routes/paymentRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import settingsRoutes from './routes/settingsRoutes';
import usersRoutes from './routes/usersRoutes';
import evaluationRoutes from './routes/evaluationRoutes';
import staffRoutes from './routes/staffRoutes';
import expenseRoutes from './routes/ExpenseRoutesVerified';
import suggestionRoutes from './routes/suggestionRoutes';
import dataRoutes from './routes/dataRoutes';
import schoolYearRoutes from './routes/schoolYearRoutes';
import scheduleRoutes from './routes/scheduleRoutes';
import path from 'path';

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/data', dataRoutes);
import examRuleRoutes from './routes/examRuleRoutes';

// ... existing routes ...
app.use('/api/school-years', schoolYearRoutes);
app.use('/api/exam-rules', examRuleRoutes);

// END DIRECT ROUTE

console.log('Registering /api/schedules routes (original)...');
app.use('/api/schedules', scheduleRoutes);

// Serve uploaded files statically
const uploadsPath = path.join(__dirname, '../uploads');
console.log('Serving static files from:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Health Check
app.get('/', (req, res) => {
    res.send('Leuana School API is running');
});

app.get('/api/debug-db', async (req, res) => {
    const sequelize = require('./config/database').default;
    res.json({
        db_name: sequelize.config.database,
        db_host: sequelize.config.host,
        db_port: sequelize.config.port
    });
});

export default app;
