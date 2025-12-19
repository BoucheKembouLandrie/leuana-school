import { Request, Response } from 'express';
import Student from '../models/Student';
import Class from '../models/Class';
import { generateMatricule } from '../utils/matriculeGenerator';

export const getAllStudents = async (req: Request, res: Response) => {
    try {
        const { classe_id } = req.query;
        const schoolYearId = req.headers['x-school-year-id'];

        if (!schoolYearId) {
            return res.status(400).json({ message: 'School Year ID is required' });
        }

        const whereClause: any = { school_year_id: schoolYearId };

        if (classe_id) {
            whereClause.classe_id = classe_id;
        }

        const students = await Student.findAll({
            where: whereClause,
            include: [{ model: Class, as: 'class' }]
        });
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getStudentById = async (req: Request, res: Response) => {
    try {
        const schoolYearId = req.headers['x-school-year-id'];
        const whereClause: any = { id: req.params.id };

        if (schoolYearId) {
            whereClause.school_year_id = schoolYearId;
        }

        const student = await Student.findOne({
            where: whereClause,
            include: [{ model: Class, as: 'class' }]
        });

        if (!student) return res.status(404).json({ message: 'Student not found in this school year' });
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const createStudent = async (req: Request, res: Response) => {
    try {
        const schoolYearId = req.headers['x-school-year-id'];
        if (!schoolYearId) {
            return res.status(400).json({ message: 'School Year ID is required' });
        }

        const matricule = await generateMatricule();
        const student = await Student.create({
            ...req.body,
            matricule,
            school_year_id: schoolYearId
        });
        res.status(201).json(student);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateStudent = async (req: Request, res: Response) => {
    try {
        const student = await Student.findByPk(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        await student.update(req.body);
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteStudent = async (req: Request, res: Response) => {
    try {
        const student = await Student.findByPk(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        await student.destroy();
        res.json({ message: 'Student deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
