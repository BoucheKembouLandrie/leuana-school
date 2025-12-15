import { Request, Response } from 'express';
import Evaluation from '../models/Evaluation';

export const getAllEvaluations = async (req: Request, res: Response) => {
    try {
        const evaluations = await Evaluation.findAll({
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

        // Auto-calculate ordre based on existing evaluations
        const count = await Evaluation.count();
        const ordre = count + 1;

        const evaluation = await Evaluation.create({ nom, date_debut, date_fin, ordre });
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
