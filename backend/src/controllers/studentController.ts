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

// --- Transfer Features ---

import Grade from '../models/Grade';
import Subject from '../models/Subject';

export const getStudentsWithAverage = async (req: Request, res: Response) => {
    try {
        const { classe_id } = req.query;
        const schoolYearId = req.headers['x-school-year-id'];

        if (!schoolYearId || !classe_id) {
            return res.status(400).json({ message: 'School Year ID and Class ID are required' });
        }

        // 1. Get Students
        const students = await Student.findAll({
            where: {
                classe_id: classe_id,
                school_year_id: schoolYearId
            },
            raw: true
        });

        // 2. Get Grades + Subjects for this class to calculate averages
        // We fetch ALL grades for this class to minimize queries
        // Note: We need to filter grades by students in this class.
        // Direct approach: Fetch grades where student.classe_id = ... (Complex join)
        // Simpler: Fetch grades for the student IDs we just found.
        const studentIds = students.map((s: any) => s.id);

        if (studentIds.length === 0) {
            return res.json([]);
        }

        const grades = await Grade.findAll({
            where: {
                eleve_id: studentIds,
                school_year_id: schoolYearId
            },
            include: [{ model: Subject, as: 'subject' }],
            raw: true,
            nest: true
        });

        // 3. Calculate Average per Student
        const results = students.map((student: any) => {
            const studentGrades = grades.filter((g: any) => g.eleve_id === student.id);

            let totalPoints = 0;
            let totalCoeffs = 0;

            studentGrades.forEach((g: any) => {
                // Ensure note and coeff exist
                if (g.note !== undefined && g.subject && g.subject.coefficient) {
                    totalPoints += g.note * g.subject.coefficient;
                    totalCoeffs += g.subject.coefficient;
                }
            });

            const average = totalCoeffs > 0 ? (totalPoints / totalCoeffs).toFixed(2) : 'N/A';

            return {
                ...student,
                moyenne: average
            };
        });

        res.json(results);

    } catch (error) {
        console.error('Error fetching students with average:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const transferStudents = async (req: Request, res: Response) => {
    try {
        const { studentIds, destClassId, destYearId } = req.body;

        if (!studentIds || !Array.isArray(studentIds) || !destClassId || !destYearId) {
            return res.status(400).json({ message: 'Invalid payload' });
        }

        // Fetch destination class to compare names
        const destClass = await Class.findByPk(destClassId);
        if (!destClass) {
            return res.status(404).json({ message: 'Destination class not found' });
        }

        let transferCount = 0;

        for (const studentId of studentIds) {
            const sourceStudent = await Student.findByPk(studentId, {
                include: [{ model: Class, as: 'class' }]
            });

            if (sourceStudent) {
                // Determine Category
                let newCategory = 'Non redoublant(e)';
                const studentData = sourceStudent as any;
                if (studentData.class) {
                    const sourceClass = studentData.class;
                    // If class names match, they are repeating the year
                    if (sourceClass.libelle === destClass.libelle) {
                        newCategory = 'Redoublant(e)';
                    }
                }

                // Generate a NEW matricule for the new year
                const newMatricule = await generateMatricule();

                await Student.create({
                    nom: sourceStudent.nom,
                    prenom: sourceStudent.prenom,
                    date_naissance: sourceStudent.date_naissance,
                    sexe: sourceStudent.sexe,
                    adresse: sourceStudent.adresse,
                    parent_tel: sourceStudent.parent_tel,
                    classe_id: destClassId,
                    school_year_id: destYearId,
                    matricule: newMatricule,
                    category: newCategory
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
