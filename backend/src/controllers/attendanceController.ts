import { Request, Response } from 'express';
import Attendance from '../models/Attendance';
import Student from '../models/Student';

export const getAllAttendance = async (req: Request, res: Response) => {
    try {
        const schoolYearId = req.headers['x-school-year-id'];
        const { date, startDate, endDate, limit } = req.query;

        if (!schoolYearId) {
            return res.status(400).json({ message: 'School Year ID is required' });
        }

        const whereClause: any = { school_year_id: schoolYearId };

        // Filter by specific date
        if (date) {
            whereClause.date = date;
        }

        // Filter by date range
        if (startDate && endDate) {
            whereClause.date = {
                [require('sequelize').Op.between]: [startDate, endDate]
            };
        }

        const attendance = await Attendance.findAll({
            where: whereClause,
            include: [{ model: Student, as: 'student' }],
            order: [['date', 'DESC']],
            limit: limit ? parseInt(limit as string) : 1000 // Default limit to prevent overload
        });

        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getAttendanceById = async (req: Request, res: Response) => {
    try {
        const attendance = await Attendance.findByPk(req.params.id, { include: [{ model: Student, as: 'student' }] });
        if (!attendance) return res.status(404).json({ message: 'Attendance not found' });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getAttendanceByStudent = async (req: Request, res: Response) => {
    try {
        const attendance = await Attendance.findAll({ where: { eleve_id: req.params.studentId } });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const createAttendance = async (req: Request, res: Response) => {
    try {
        const schoolYearId = req.headers['x-school-year-id'];
        if (!schoolYearId) {
            return res.status(400).json({ message: 'School Year ID is required' });
        }

        const attendance = await Attendance.create({
            ...req.body,
            school_year_id: schoolYearId
        });
        res.status(201).json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateAttendance = async (req: Request, res: Response) => {
    try {
        const attendance = await Attendance.findByPk(req.params.id);
        if (!attendance) return res.status(404).json({ message: 'Attendance not found' });
        await attendance.update(req.body);
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteAttendance = async (req: Request, res: Response) => {
    try {
        const attendance = await Attendance.findByPk(req.params.id);
        if (!attendance) return res.status(404).json({ message: 'Attendance not found' });
        await attendance.destroy();
        res.json({ message: 'Attendance deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
