import { Request, Response } from 'express';
import ExamRule from '../models/ExamRule';
import { Op } from 'sequelize';

export const getRules = async (req: Request, res: Response) => {
    try {
        const schoolYearId = req.headers['x-school-year-id'];
        const whereClause = schoolYearId ? { schoolYearId: schoolYearId } : {};

        const rules = await ExamRule.findAll({ where: whereClause });
        res.json(rules);
    } catch (error) {
        console.error('ERROR getRules:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des règles', error });
    }
};

export const createRule = async (req: Request, res: Response) => {
    try {
        const { category, min_average, max_average, min_absence, max_absence, status } = req.body;
        const schoolYearId = req.headers['x-school-year-id'];

        if (!schoolYearId) {
            return res.status(400).json({ message: 'ID de l\'année scolaire requis' });
        }

        // Simple validation
        if (min_average >= max_average) {
            return res.status(400).json({ message: 'La moyenne minimum doit être inférieure à la moyenne maximum' });
        }
        if (min_absence >= max_absence) {
            return res.status(400).json({ message: 'L\'absence minimum doit être inférieure à l\'absence maximum' });
        }

        // Create rule
        const rule = await ExamRule.create({
            category,
            min_average,
            max_average,
            min_absence,
            max_absence,
            status,
            schoolYearId: parseInt(schoolYearId as string)
        });

        res.status(201).json(rule);
    } catch (error: any) {
        console.error('ERROR createRule:', error);
        res.status(500).json({
            message: 'Erreur lors de la création de la règle',
            error: error.message
        });
    }
};

export const deleteRule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await ExamRule.destroy({ where: { id } });
        res.json({ message: 'Règle supprimée' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la suppression', error });
    }
};

export const transferRules = async (req: Request, res: Response) => {
    try {
        const { sourceYearId, targetYearId } = req.body;

        if (!sourceYearId || !targetYearId) {
            return res.status(400).json({ message: 'IDs source et cible requis' });
        }

        const sourceRules = await ExamRule.findAll({ where: { schoolYearId: sourceYearId } });
        let transferredCount = 0;

        for (const rule of sourceRules) {
            const existing = await ExamRule.findOne({
                where: {
                    schoolYearId: targetYearId,
                    category: rule.category,
                    min_average: rule.min_average,
                    max_average: rule.max_average
                }
            });

            if (!existing) {
                await ExamRule.create({
                    category: rule.category,
                    min_average: rule.min_average,
                    max_average: rule.max_average,
                    min_absence: rule.min_absence,
                    max_absence: rule.max_absence,
                    status: rule.status,
                    schoolYearId: targetYearId
                });
                transferredCount++;
            }
        }

        res.json({
            message: `${transferredCount} règle(s) transférée(s)`,
            count: transferredCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors du transfert', error });
    }
};
