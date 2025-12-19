import { Request, Response } from 'express';
import SchoolYear from '../models/SchoolYear';
import sequelize from '../config/database';

export const getAllSchoolYears = async (req: Request, res: Response) => {
    try {
        const years = await SchoolYear.findAll({
            order: [['start_year', 'DESC']]
        });
        res.json(years);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const createSchoolYear = async (req: Request, res: Response) => {
    try {
        const { name } = req.body; // Expect "2024-2025"

        // Validate format
        const regex = /^(\d{4})-(\d{4})$/;
        const match = name.match(regex);

        if (!match) {
            return res.status(400).json({ message: 'Invalid format. Use YYYY-YYYY (e.g., 2025-2026)' });
        }

        const startYear = parseInt(match[1]);
        const endYear = parseInt(match[2]);

        // Debug logging
        const fs = require('fs');
        const logPath = 'C:/Users/bokel/.gemini/antigravity/brain/8276aed3-1d20-49e3-a6f8-2d53a115e595/backend_debug.log';
        fs.appendFileSync(logPath, `[CreateYear] Name: ${name}, Start: ${startYear} (${typeof startYear}), End: ${endYear}\n`);

        if (endYear !== startYear + 1) {
            return res.status(400).json({ message: 'End year must be start year + 1' });
        }

        // DEBUG: Fail intentionally to see values
        // throw new Error(`DEBUG: Start=${startYear} (${typeof startYear}), End=${endYear}`);

        const existing = await SchoolYear.findOne({ where: { name } });
        if (existing) {
            return res.status(400).json({ message: 'School year already exists' });
        }

        // Force explicit checking
        if (typeof startYear !== 'number' || isNaN(startYear)) {
            return res.status(400).json({ message: `Invalid startYear value: ${startYear}` });
        }

        const newYear = await SchoolYear.create({
            name,
            startYear: startYear,
            endYear: endYear,
            isActive: false // Default to false
        });

        res.status(201).json(newYear);
    } catch (error: any) {
        // Log detailed error
        const fs = require('fs');
        const logPath = 'C:/Users/bokel/.gemini/antigravity/brain/8276aed3-1d20-49e3-a6f8-2d53a115e595/backend_debug.log';
        fs.appendFileSync(logPath, `[CreateYearError] ${JSON.stringify(error)}\n`);

        // Return explicit error message if validation error
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: error.errors.map((e: any) => e.message).join(', ') });
        }

        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteSchoolYear = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const year = await SchoolYear.findByPk(id);

        if (!year) {
            await transaction.rollback();
            return res.status(404).json({ message: 'School year not found' });
        }

        // Explicitly delete related data to ensure no orphans remain
        // Order matters for FK constraints (Child -> Parent)

        // 1. Grades (depend on Student, Evaluation, Subject)
        await require('../models/Grade').default.destroy({ where: { school_year_id: id }, transaction });

        // 2. Attendance & Payments (depend on Student)
        await require('../models/Attendance').default.destroy({ where: { school_year_id: id }, transaction });
        await require('../models/Payment').default.destroy({ where: { school_year_id: id }, transaction });

        // 3. Expenses (depend on Teacher/Staff/Year)
        await require('../models/Expense').default.destroy({ where: { school_year_id: id }, transaction });

        // 4. Evaluations (depend on Year)
        await require('../models/Evaluation').default.destroy({ where: { school_year_id: id }, transaction });

        // 5. Students (depend on Class, Year)
        await require('../models/Student').default.destroy({ where: { school_year_id: id }, transaction });

        // 6. Subjects (depend on Year, Class, Teacher)
        await require('../models/Subject').default.destroy({ where: { school_year_id: id }, transaction });

        // 7. Classes (depend on Year)
        await require('../models/Class').default.destroy({ where: { school_year_id: id }, transaction });

        // 8. Staff & Teachers (depend on Year)
        await require('../models/Staff').default.destroy({ where: { school_year_id: id }, transaction });
        await require('../models/Teacher').default.destroy({ where: { school_year_id: id }, transaction });

        // Finally delete the year
        await year.destroy({ transaction });

        await transaction.commit();
        res.json({ message: 'School year and all associated data deleted successfully' });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ message: 'Server error', error });
    }
};
