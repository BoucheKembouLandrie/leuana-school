import { Request, Response } from 'express';
import Subject from '../models/Subject';
import Teacher from '../models/Teacher';
import Class from '../models/Class';
import SchoolYear from '../models/SchoolYear';

export const getAllSubjects = async (req: Request, res: Response) => {
    try {
        const schoolYearId = req.headers['x-school-year-id'];
        if (!schoolYearId) {
            return res.status(400).json({ message: 'School Year ID is required' });
        }

        const subjects = await Subject.findAll({
            where: { school_year_id: schoolYearId },
            include: [
                { model: Teacher, as: 'teacher' },
                { model: Class, as: 'class' }
            ]
        });
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getSubjectById = async (req: Request, res: Response) => {
    try {
        const subject = await Subject.findByPk(req.params.id, {
            include: [
                { model: Teacher, as: 'teacher' },
                { model: Class, as: 'class' }
            ]
        });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        res.json(subject);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const createSubject = async (req: Request, res: Response) => {
    try {
        const schoolYearId = req.headers['x-school-year-id'];
        if (!schoolYearId) {
            return res.status(400).json({ message: 'School Year ID is required' });
        }

        const subject = await Subject.create({
            ...req.body,
            school_year_id: schoolYearId
        });
        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateSubject = async (req: Request, res: Response) => {
    try {
        const subject = await Subject.findByPk(req.params.id);
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        await subject.update(req.body);
        res.json(subject);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteSubject = async (req: Request, res: Response) => {
    try {
        const subject = await Subject.findByPk(req.params.id);
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        await subject.destroy();
        res.json({ message: 'Subject deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const transferSubjects = async (req: Request, res: Response) => {
    try {
        const { subjectIds, destYearId } = req.body;

        if (!subjectIds || !Array.isArray(subjectIds) || !destYearId) {
            return res.status(400).json({ message: 'Invalid payload' });
        }

        // Fetch destination year to get its name (needed for creating new classes if they don't exist)
        const destinationYear = await SchoolYear.findByPk(destYearId);
        if (!destinationYear) {
            return res.status(404).json({ message: 'Destination school year not found' });
        }

        let transferCount = 0;
        let createdClassesCount = 0;

        for (const subjectId of subjectIds) {
            // Find source subject AND its class
            const sourceSubject = await Subject.findByPk(subjectId, {
                include: [{ model: Class, as: 'class' }]
            });

            if (sourceSubject && sourceSubject.class) {
                const sourceClass = sourceSubject.class as any;

                // 1. Try to find matching class in destination year (by exact name/libelle)
                let destClass = await Class.findOne({
                    where: {
                        libelle: sourceClass.libelle,
                        school_year_id: destYearId
                    }
                });

                // 2. If not found, create it automatically
                if (!destClass) {
                    destClass = await Class.create({
                        libelle: sourceClass.libelle,
                        niveau: sourceClass.niveau,
                        pension: sourceClass.pension,
                        annee: destinationYear.name,
                        school_year_id: destYearId
                    });
                    createdClassesCount++;
                }

                // 3. Create the subject attached to this resolved class
                await Subject.create({
                    nom: sourceSubject.nom,
                    coefficient: sourceSubject.coefficient,
                    teacher_id: null, // Teachers must be reassigned manually
                    classe_id: destClass.id,
                    school_year_id: destYearId
                });
                transferCount++;
            }
        }

        res.json({
            message: 'Transfer successful',
            count: transferCount,
            classesCreated: createdClassesCount
        });

    } catch (error) {
        console.error('Transfer error:', error);
        res.status(500).json({ message: 'Server error during transfer', error });
    }
};
