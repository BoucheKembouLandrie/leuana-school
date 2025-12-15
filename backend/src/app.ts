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
import expenseRoutes from './routes/expenseRoutes';
import suggestionRoutes from './routes/suggestionRoutes';
import dataRoutes from './routes/dataRoutes';
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

// Serve uploaded files statically
const uploadsPath = path.join(__dirname, '../uploads');
console.log('Serving static files from:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Health Check
app.get('/', (req, res) => {
    res.send('Leuana School API is running');
});

export default app;
