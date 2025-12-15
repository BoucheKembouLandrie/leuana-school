import { Request, Response } from 'express';
import Attendance from '../models/Attendance';
import Student from '../models/Student';

export const getAllAttendance = async (req: Request, res: Response) => {
    try {
        const attendance = await Attendance.findAll({ include: [{ model: Student, as: 'student' }] });
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
        const attendance = await Attendance.create(req.body);
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
