import { Request, Response } from 'express';
import Evaluation from '../models/Evaluation';

export const getAllEvaluations = async (req: Request, res: Response) => {
    try {
        const schoolYearId = req.headers['x-school-year-id'];
        if (!schoolYearId) {
            return res.status(400).json({ message: 'School Year ID is required' });
        }

        const evaluations = await Evaluation.findAll({
            where: { school_year_id: schoolYearId },
            order: [['ordre', 'ASC']]
        });
        res.json(evaluations);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const createEvaluation = async (req: Request, res: Response) => {
    try {
        const { nom, date_debut, date_fin } = req.body;
        const schoolYearId = req.headers['x-school-year-id'];

        if (!schoolYearId) {
            return res.status(400).json({ message: 'School Year ID is required' });
        }

        // Auto-calculate ordre based on existing evaluations FOR THIS YEAR
        const count = await Evaluation.count({ where: { school_year_id: schoolYearId } });
        const ordre = count + 1;

        const evaluation = await Evaluation.create({
            nom,
            date_debut,
            date_fin,
            ordre,
            school_year_id: schoolYearId
        });
        res.status(201).json(evaluation);
    } catch (error) {
        console.error('Error creating evaluation:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateEvaluation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { nom, date_debut, date_fin, ordre } = req.body;

        const evaluation = await Evaluation.findByPk(id);
        if (!evaluation) {
            return res.status(404).json({ message: 'Evaluation not found' });
        }

        await evaluation.update({ nom, date_debut, date_fin, ordre });
        res.json(evaluation);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteEvaluation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const evaluation = await Evaluation.findByPk(id);
        if (!evaluation) {
            return res.status(404).json({ message: 'Evaluation not found' });
        }

        await evaluation.destroy();
        res.json({ message: 'Evaluation deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
