import { Request, Response } from 'express';
import Grade from '../models/Grade';
import Student from '../models/Student';
import Subject from '../models/Subject';

export const getAllGrades = async (req: Request, res: Response) => {
    try {
        const grades = await Grade.findAll({
            include: [
                { model: Student, as: 'student' },
                { model: Subject, as: 'subject' }
            ]
        });
        res.json(grades);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getGradeById = async (req: Request, res: Response) => {
    try {
        const grade = await Grade.findByPk(req.params.id, {
            include: [
                { model: Student, as: 'student' },
                { model: Subject, as: 'subject' }
            ]
        });
        if (!grade) return res.status(404).json({ message: 'Grade not found' });
        res.json(grade);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getGradesByStudent = async (req: Request, res: Response) => {
    try {
        const grades = await Grade.findAll({
            where: { eleve_id: req.params.studentId },
            include: [{ model: Subject, as: 'subject' }]
        });
        res.json(grades);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getGradesByClass = async (req: Request, res: Response) => {
    try {
        const { classId } = req.params;
        const { trimestre } = req.query;

        const whereClause: any = {};
        if (trimestre) {
            whereClause.trimestre = trimestre;
        }

        // Find all students in the class first
        const students = await Student.findAll({ where: { classe_id: classId } });
        const studentIds = students.map(s => s.id);

        if (studentIds.length === 0) {
            return res.json([]);
        }

        // Find grades for these students
        const grades = await Grade.findAll({
            where: {
                eleve_id: studentIds,
                ...whereClause
            },
            include: [
                { model: Student, as: 'student' },
                { model: Subject, as: 'subject' }
            ]
        });

        res.json(grades);
    } catch (error) {
        console.error('Error fetching class grades:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const saveGrades = async (req: Request, res: Response) => {
    try {
        const { grades } = req.body; // Expecting an array of grade objects

        if (!Array.isArray(grades)) {
            return res.status(400).json({ message: 'Invalid input: grades must be an array' });
        }

        const results = [];

        for (const gradeData of grades) {
            const { eleve_id, matiere_id, trimestre, annee_scolaire, note } = gradeData;

            // Check if grade exists
            let grade = await Grade.findOne({
                where: {
                    eleve_id,
                    matiere_id,
                    trimestre,
                    annee_scolaire
                }
            });

            if (grade) {
                // Update existing
                grade = await grade.update({ note });
            } else {
                // Create new
                grade = await Grade.create({
                    eleve_id,
                    matiere_id,
                    trimestre,
                    annee_scolaire,
                    note
                });
            }
            results.push(grade);
        }

        res.status(200).json({ message: 'Grades saved successfully', data: results });
    } catch (error) {
        console.error('Error saving grades:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const createGrade = async (req: Request, res: Response) => {
    try {
        const grade = await Grade.create(req.body);
        res.status(201).json(grade);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateGrade = async (req: Request, res: Response) => {
    try {
        const grade = await Grade.findByPk(req.params.id);
        if (!grade) return res.status(404).json({ message: 'Grade not found' });
        await grade.update(req.body);
        res.json(grade);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteGrade = async (req: Request, res: Response) => {
    try {
        const grade = await Grade.findByPk(req.params.id);
        if (!grade) return res.status(404).json({ message: 'Grade not found' });
        await grade.destroy();
        res.json({ message: 'Grade deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getSuccessRate = async (req: Request, res: Response) => {
    try {
        const { evaluation, classe_id, eleve_id } = req.query;
        const schoolYearId = req.headers['x-school-year-id'];

        if (!schoolYearId) {
            return res.status(400).json({ message: 'School Year ID is required' });
        }

        // Build where clause for grades
        const whereClause: any = { school_year_id: schoolYearId };
        if (evaluation) {
            // Handle multiple evaluations (comma-separated)
            const evaluations = (evaluation as string).split(',');
            if (evaluations.length === 1) {
                whereClause.trimestre = evaluation;
            } else {
                const { Op } = require('sequelize');
                whereClause.trimestre = { [Op.in]: evaluations };
            }
        }

        // Get all grades based on filters
        let grades: any[] = [];

        if (eleve_id) {
            // Filter by specific student
            grades = await Grade.findAll({
                where: {
                    eleve_id: Number(eleve_id),
                    ...whereClause
                },
                include: [{ model: Subject, as: 'subject' }]
            });
        } else if (classe_id) {
            // Filter by class (handle multiple classes)
            const classeIds = (classe_id as string).split(',').map(id => Number(id));
            const { Op } = require('sequelize');

            const students = await Student.findAll({
                where: {
                    classe_id: classeIds.length === 1 ? classeIds[0] : { [Op.in]: classeIds },
                    school_year_id: schoolYearId
                }
            });
            const studentIds = students.map(s => s.id);

            if (studentIds.length === 0) {
                return res.json({
                    success: 0,
                    failure: 0,
                    successRate: 0,
                    totalStudents: 0
                });
            }

            grades = await Grade.findAll({
                where: {
                    eleve_id: studentIds,
                    ...whereClause
                },
                include: [{ model: Subject, as: 'subject' }]
            });
        } else {
            // All students
            grades = await Grade.findAll({
                where: whereClause,
                include: [{ model: Subject, as: 'subject' }]
            });
        }

        // Group grades by student and calculate averages
        const gradesByStudent: { [key: number]: any[] } = {};
        grades.forEach(grade => {
            if (!gradesByStudent[grade.eleve_id]) {
                gradesByStudent[grade.eleve_id] = [];
            }
            gradesByStudent[grade.eleve_id].push(grade);
        });

        // Get all subjects with coefficients
        const subjects = await Subject.findAll({ where: { school_year_id: schoolYearId } });
        const subjectMap = new Map(subjects.map(s => [s.id, s]));

        // Calculate success/failure
        let successCount = 0;
        let failureCount = 0;

        Object.keys(gradesByStudent).forEach(studentIdStr => {
            const studentGrades = gradesByStudent[Number(studentIdStr)];

            // Calculate weighted average
            let totalPoints = 0;
            let totalCoeffs = 0;

            studentGrades.forEach(grade => {
                const subject = subjectMap.get(grade.matiere_id);
                // Graceful fallback if subject missing (rare but possible across changes)
                const coefficient = subject?.coefficient || 1;
                totalPoints += parseFloat(grade.note) * coefficient;
                totalCoeffs += coefficient;
            });

            const average = totalCoeffs > 0 ? totalPoints / totalCoeffs : 0;

            // Success if average >= 10
            if (average >= 10) {
                successCount++;
            } else {
                failureCount++;
            }
        });

        const totalStudents = successCount + failureCount;
        const successRate = totalStudents > 0 ? (successCount / totalStudents) * 100 : 0;

        res.json({
            success: successCount,
            failure: failureCount,
            successRate: parseFloat(successRate.toFixed(2)),
            totalStudents
        });

    } catch (error) {
        console.error('Error calculating success rate:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getSubjectStats = async (req: Request, res: Response) => {
    try {
        const { evaluation, classe_id, eleve_id } = req.query;
        const schoolYearId = req.headers['x-school-year-id'];

        console.log('API getSubjectStats params:', { evaluation, classe_id, eleve_id, schoolYearId });

        if (!schoolYearId) {
            return res.status(400).json({ message: 'School Year ID is required' });
        }

        // Build where clause for grades
        const whereClause: any = { school_year_id: schoolYearId };
        if (evaluation) {
            const { Op } = require('sequelize');
            const criteria = [];

            const lowerEv = (evaluation as string).toLowerCase();

            if (lowerEv.includes('1')) {
                criteria.push({ [Op.like]: '%1%' });
                criteria.push({ [Op.like]: '%un%' }); // heuristic
                criteria.push({ [Op.like]: '%premier%' });
            } else if (lowerEv.includes('2')) {
                criteria.push({ [Op.like]: '%2%' });
                criteria.push({ [Op.like]: '%deux%' });
                criteria.push({ [Op.like]: '%second%' });
            } else if (lowerEv.includes('3')) {
                criteria.push({ [Op.like]: '%3%' });
                criteria.push({ [Op.like]: '%trois%' });
            } else {
                // Fallback: match strictly or generic like
                criteria.push({ [Op.like]: `%${evaluation}%` });
            }

            whereClause.trimestre = { [Op.or]: criteria };
        }

        let grades: any[] = [];

        // Handle filtering
        if (eleve_id) {
            grades = await Grade.findAll({
                where: {
                    eleve_id: Number(eleve_id),
                    ...whereClause
                },
                include: [{ model: Subject, as: 'subject' }]
            });
        } else if (classe_id) {
            const classeIds = (classe_id as string).split(',').map(id => Number(id));
            const { Op } = require('sequelize');

            // Get students first to ensure we only get grades for students in this class
            const students = await Student.findAll({
                where: {
                    classe_id: classeIds.length === 1 ? classeIds[0] : { [Op.in]: classeIds },
                    school_year_id: schoolYearId
                }
            });
            const studentIds = students.map(s => s.id);

            if (studentIds.length === 0) {
                return res.json([]);
            }

            grades = await Grade.findAll({
                where: {
                    eleve_id: studentIds,
                    ...whereClause
                },
                include: [{ model: Subject, as: 'subject' }]
            });
        } else {
            // No filters - return global stats
            grades = await Grade.findAll({
                where: whereClause,
                include: [{ model: Subject, as: 'subject' }]
            });
        }

        // Group by subject and calculate stats
        const subjectStats: { [key: number]: { name: string, total: number, count: number, min: number, max: number } } = {};

        grades.forEach(grade => {
            if (!grade.subject) return;

            const subjectId = grade.matiere_id;
            const note = parseFloat(grade.note);

            if (!subjectStats[subjectId]) {
                subjectStats[subjectId] = {
                    name: grade.subject.nom,
                    total: 0,
                    count: 0,
                    min: note,
                    max: note
                };
            }

            const stat = subjectStats[subjectId];
            stat.total += note;
            stat.count += 1;
            stat.min = Math.min(stat.min, note);
            stat.max = Math.max(stat.max, note);
        });

        // Format result
        const results = Object.values(subjectStats).map(stat => ({
            subject: stat.name,
            average: parseFloat((stat.total / stat.count).toFixed(2)),
            min: stat.min,
            max: stat.max,
            count: stat.count
        }));

        // Sort by average descending
        results.sort((a, b) => b.average - a.average);

        res.json(results);

    } catch (error) {
        console.error('Error calculating subject stats:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

