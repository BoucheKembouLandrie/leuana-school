import { Request, Response } from 'express';
import Expense from '../models/Expense';

export const getAllExpenses = async (req: Request, res: Response) => {
    try {
        const schoolYearId = req.headers['x-school-year-id'];
        console.log(`[EXPENSE_CTRL] Request for Expenses. ID: ${schoolYearId}`);
        if (!schoolYearId) {
            console.log('[EXPENSE_CTRL] BLOCKED: Missing ID');
            return res.status(400).json({ message: 'School Year ID is required' });
        }

        const expenses = await Expense.findAll({
            where: { school_year_id: schoolYearId },
            order: [['date_depense', 'DESC']],
            include: [
                { model: require('../models/Teacher').default, as: 'teacher' },
                { model: require('../models/Staff').default, as: 'staffMember' }
            ]
        });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const createExpense = async (req: Request, res: Response) => {
    try {
        const schoolYearId = req.headers['x-school-year-id'];
        if (!schoolYearId) {
            return res.status(400).json({ message: 'School Year ID is required' });
        }

        const expense = await Expense.create({
            ...req.body,
            school_year_id: schoolYearId
        });
        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateExpense = async (req: Request, res: Response) => {
    try {
        const expense = await Expense.findByPk(req.params.id);
        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        await expense.update(req.body);
        res.json(expense);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteExpense = async (req: Request, res: Response) => {
    try {
        const expense = await Expense.findByPk(req.params.id);
        if (!expense) return res.status(404).json({ message: 'Expense not found' });
        await expense.destroy();
        res.json({ message: 'Expense deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
