import { Request, Response } from 'express';
import Class from '../models/Class';
import Student from '../models/Student';

export const getAllClasses = async (req: Request, res: Response) => {
    try {
        const classes = await Class.findAll({ include: [{ model: Student, as: 'students' }] });
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getClassById = async (req: Request, res: Response) => {
    try {
        const classe = await Class.findByPk(req.params.id, { include: [{ model: Student, as: 'students' }] });
        if (!classe) return res.status(404).json({ message: 'Class not found' });
        res.json(classe);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const createClass = async (req: Request, res: Response) => {
    try {
        const classe = await Class.create(req.body);
        res.status(201).json(classe);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateClass = async (req: Request, res: Response) => {
    try {
        const classe = await Class.findByPk(req.params.id);
        if (!classe) return res.status(404).json({ message: 'Class not found' });
        await classe.update(req.body);
        res.json(classe);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteClass = async (req: Request, res: Response) => {
    try {
        const classe = await Class.findByPk(req.params.id);
        if (!classe) return res.status(404).json({ message: 'Class not found' });
        await classe.destroy();
        res.json({ message: 'Class deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
