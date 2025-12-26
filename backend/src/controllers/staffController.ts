import { Request, Response } from 'express';
import Staff from '../models/Staff';

export const getAllStaff = async (req: Request, res: Response) => {
    try {
        const schoolYearId = req.headers['x-school-year-id'];

        const whereClause: any = {};
        if (schoolYearId) {
            whereClause.school_year_id = schoolYearId;
        }

        const staff = await Staff.findAll({ where: whereClause });
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const createStaff = async (req: Request, res: Response) => {
    try {
        const schoolYearId = req.headers['x-school-year-id'];
        if (!schoolYearId) {
            return res.status(400).json({ message: 'School Year ID is required' });
        }

        const staff = await Staff.create({
            ...req.body,
            school_year_id: schoolYearId
        });
        res.status(201).json(staff);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateStaff = async (req: Request, res: Response) => {
    try {
        const staff = await Staff.findByPk(req.params.id);
        if (!staff) return res.status(404).json({ message: 'Staff not found' });
        await staff.update(req.body);
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteStaff = async (req: Request, res: Response) => {
    try {
        const staff = await Staff.findByPk(req.params.id);
        if (!staff) return res.status(404).json({ message: 'Staff not found' });
        await staff.destroy();
        res.json({ message: 'Staff deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const transferStaff = async (req: Request, res: Response) => {
    try {
        const { staffIds, destYearId } = req.body;

        if (!staffIds || !Array.isArray(staffIds) || !destYearId) {
            return res.status(400).json({ message: 'Invalid payload' });
        }

        let transferCount = 0;

        for (const staffId of staffIds) {
            const sourceStaff = await Staff.findByPk(staffId);
            if (sourceStaff) {
                await Staff.create({
                    titre: sourceStaff.titre,
                    nom: sourceStaff.nom,
                    prenom: sourceStaff.prenom,
                    tel: sourceStaff.tel,
                    email: sourceStaff.email,
                    salaire: sourceStaff.salaire,
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
