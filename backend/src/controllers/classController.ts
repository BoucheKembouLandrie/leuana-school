import { Request, Response } from 'express';
import Class from '../models/Class';
import Student from '../models/Student';
import SchoolYear from '../models/SchoolYear';

export const getAllClasses = async (req: Request, res: Response) => {
    try {
        const schoolYearId = req.headers['x-school-year-id'];
        if (!schoolYearId) {
            return res.status(400).json({ message: 'School Year ID is required' });
        }

        const classes = await Class.findAll({
            where: { school_year_id: schoolYearId },
            include: [{ model: Student, as: 'students' }]
        });
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getClassById = async (req: Request, res: Response) => {
    try {
        const classe = await Class.findByPk(req.params.id, { include: [{ model: Student, as: 'students' }] });
        if (!classe) return res.status(404).json({ message: 'Class not found' });
        res.json(classe);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const createClass = async (req: Request, res: Response) => {
    try {
        const schoolYearId = req.headers['x-school-year-id'];
        if (!schoolYearId) {
            return res.status(400).json({ message: 'School Year ID is required' });
        }

        const classe = await Class.create({
            ...req.body,
            school_year_id: schoolYearId
        });
        res.status(201).json(classe);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateClass = async (req: Request, res: Response) => {
    try {
        const classe = await Class.findByPk(req.params.id);
        if (!classe) return res.status(404).json({ message: 'Class not found' });
        await classe.update(req.body);
        res.json(classe);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteClass = async (req: Request, res: Response) => {
    try {
        const classe = await Class.findByPk(req.params.id);
        if (!classe) return res.status(404).json({ message: 'Class not found' });
        await classe.destroy();
        res.json({ message: 'Class deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const transferClasses = async (req: Request, res: Response) => {
    try {
        const { classIds, destYearId } = req.body;

        if (!classIds || !Array.isArray(classIds) || !destYearId) {
            return res.status(400).json({ message: 'Invalid payload' });
        }

        // Fetch destination year to get the correct name string
        const destYear = await SchoolYear.findByPk(destYearId);
        if (!destYear) {
            return res.status(404).json({ message: 'Destination year not found' });
        }

        let transferCount = 0;

        for (const classId of classIds) {
            const sourceClass = await Class.findByPk(classId);
            if (sourceClass) {
                await Class.create({
                    libelle: sourceClass.libelle,
                    niveau: sourceClass.niveau,
                    annee: destYear.name, // Use destination year name
                    pension: sourceClass.pension,
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
