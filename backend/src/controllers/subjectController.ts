import { Request, Response } from 'express';
import Subject from '../models/Subject';
import Teacher from '../models/Teacher';
import Class from '../models/Class';

export const getAllSubjects = async (req: Request, res: Response) => {
    try {
        const subjects = await Subject.findAll({
            include: [
                { model: Teacher, as: 'teacher' },
                { model: Class, as: 'class' }
            ]
        });
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getSubjectById = async (req: Request, res: Response) => {
    try {
        const subject = await Subject.findByPk(req.params.id, {
            include: [
                { model: Teacher, as: 'teacher' },
                { model: Class, as: 'class' }
            ]
        });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        res.json(subject);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const createSubject = async (req: Request, res: Response) => {
    try {
        const subject = await Subject.create(req.body);
        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateSubject = async (req: Request, res: Response) => {
    try {
        const subject = await Subject.findByPk(req.params.id);
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        await subject.update(req.body);
        res.json(subject);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteSubject = async (req: Request, res: Response) => {
    try {
        const subject = await Subject.findByPk(req.params.id);
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        await subject.destroy();
        res.json({ message: 'Subject deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
