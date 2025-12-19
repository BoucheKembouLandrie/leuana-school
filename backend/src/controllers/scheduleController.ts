import { Request, Response } from 'express';
import Schedule from '../models/Schedule';
import Subject from '../models/Subject';
import Teacher from '../models/Teacher';

export const getAllSchedules = async (req: Request, res: Response) => {
    try {
        const schoolYearId = req.headers['x-school-year-id'];
        if (!schoolYearId) {
            return res.status(400).json({ message: 'School Year ID is required' });
        }

        const schedules = await Schedule.findAll({
            where: { school_year_id: schoolYearId },
            include: [
                {
                    model: Subject,
                    as: 'subject',
                    include: [
                        {
                            model: Teacher,
                            as: 'teacher',
                            attributes: ['id', 'nom', 'prenom']
                        }
                    ]
                }
            ],
            order: [['day_of_week', 'ASC'], ['start_time', 'ASC']]
        });
        res.json(schedules);
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getSchedulesByClass = async (req: Request, res: Response) => {
    try {
        const { classId } = req.params;
        const schoolYearId = req.headers['x-school-year-id'];

        if (!schoolYearId) {
            return res.status(400).json({ message: 'School Year ID is required' });
        }

        const schedules = await Schedule.findAll({
            where: {
                classe_id: classId,
                school_year_id: schoolYearId
            },
            include: [
                {
                    model: Subject,
                    as: 'subject',
                    include: [
                        {
                            model: Teacher,
                            as: 'teacher',
                            attributes: ['id', 'nom', 'prenom']
                        }
                    ]
                }
            ],
            order: [['day_of_week', 'ASC'], ['start_time', 'ASC']]
        });
        res.json(schedules);
    } catch (error) {
        console.error('Error fetching schedules by class:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const createSchedule = async (req: Request, res: Response) => {
    try {
        const { classe_id, subject_id, day_of_week, start_time, end_time } = req.body;
        const schoolYearId = req.headers['x-school-year-id'];

        if (!schoolYearId) {
            return res.status(400).json({ message: 'School Year ID is required' });
        }

        const schedule = await Schedule.create({
            classe_id,
            subject_id,
            day_of_week,
            start_time,
            end_time,
            school_year_id: schoolYearId
        });

        // Fetch the created schedule with associations
        const createdSchedule = await Schedule.findByPk(schedule.id, {
            include: [
                {
                    model: Subject,
                    as: 'subject',
                    include: [
                        {
                            model: Teacher,
                            as: 'teacher',
                            attributes: ['id', 'nom', 'prenom']
                        }
                    ]
                }
            ]
        });

        res.status(201).json(createdSchedule);
    } catch (error) {
        console.error('Error creating schedule:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateSchedule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { classe_id, subject_id, day_of_week, start_time, end_time } = req.body;

        const schedule = await Schedule.findByPk(id);
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        await schedule.update({
            classe_id,
            subject_id,
            day_of_week,
            start_time,
            end_time
        });

        // Fetch updated schedule with associations
        const updatedSchedule = await Schedule.findByPk(id, {
            include: [
                {
                    model: Subject,
                    as: 'subject',
                    include: [
                        {
                            model: Teacher,
                            as: 'teacher',
                            attributes: ['id', 'nom', 'prenom']
                        }
                    ]
                }
            ]
        });

        res.json(updatedSchedule);
    } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const deleteSchedule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const schedule = await Schedule.findByPk(id);
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        await schedule.destroy();
        res.json({ message: 'Schedule deleted successfully' });
    } catch (error) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
