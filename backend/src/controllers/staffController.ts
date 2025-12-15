import { Request, Response } from 'express';
import Staff from '../models/Staff';

export const getAllStaff = async (req: Request, res: Response) => {
    try {
        const staff = await Staff.findAll();
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const createStaff = async (req: Request, res: Response) => {
    try {
        const staff = await Staff.create(req.body);
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
