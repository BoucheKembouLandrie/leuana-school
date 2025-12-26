import { Request, Response } from 'express';
import Teacher from '../models/Teacher';
import Subject from '../models/Subject';

export const getAllTeachers = async (req: Request, res: Response) => {
    try {
        const schoolYearId = req.headers['x-school-year-id'];
        if (!schoolYearId) {
            return res.status(400).json({ message: 'School Year ID is required' });
        }

        const teachers = await Teacher.findAll({
            where: { school_year_id: schoolYearId },
            include: [{ model: Subject, as: 'subjects' }]
        });
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getTeacherById = async (req: Request, res: Response) => {
    try {
        const teacher = await Teacher.findByPk(req.params.id, { include: [{ model: Subject, as: 'subjects' }] });
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
        res.json(teacher);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const createTeacher = async (req: Request, res: Response) => {
    try {
        const schoolYearId = req.headers['x-school-year-id'];
        if (!schoolYearId) {
            return res.status(400).json({ message: 'School Year ID is required' });
        }

        const teacher = await Teacher.create({
            ...req.body,
            school_year_id: schoolYearId
        });
        res.status(201).json(teacher);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateTeacher = async (req: Request, res: Response) => {
    try {
        const teacher = await Teacher.findByPk(req.params.id);
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
        await teacher.update(req.body);
        res.json(teacher);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteTeacher = async (req: Request, res: Response) => {
    try {
        const teacher = await Teacher.findByPk(req.params.id);
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
        await teacher.destroy();
        res.json({ message: 'Teacher deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const transferTeachers = async (req: Request, res: Response) => {
    try {
        const { teacherIds, destYearId } = req.body;

        if (!teacherIds || !Array.isArray(teacherIds) || !destYearId) {
            return res.status(400).json({ message: 'Invalid payload' });
        }

        let transferCount = 0;

        for (const teacherId of teacherIds) {
            const sourceTeacher = await Teacher.findByPk(teacherId);
            if (sourceTeacher) {
                await Teacher.create({
                    nom: sourceTeacher.nom,
                    prenom: sourceTeacher.prenom,
                    tel: sourceTeacher.tel,
                    email: sourceTeacher.email,
                    salaire: sourceTeacher.salaire,
                    school_year_id: destYearId
                });
                transferCount++;
            }
        }

        res.json({ message: 'Transfer successful', count: transferCount });

    } catch (error) {
        console.error('Transfer error:', error);
        res.status(500).json({ message: 'Server error during transfer', error });
    }
};
