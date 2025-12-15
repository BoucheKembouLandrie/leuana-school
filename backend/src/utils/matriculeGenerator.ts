import Student from '../models/Student';
import { Op } from 'sequelize';

export const generateMatricule = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const prefix = `LEU-${year}-`;

    const lastStudent = await Student.findOne({
        where: {
            matricule: {
                [Op.like]: `${prefix}%`,
            },
        },
        order: [['matricule', 'DESC']],
    });

    let sequence = 1;
    if (lastStudent) {
        const lastMatricule = lastStudent.matricule;
        const lastSequence = parseInt(lastMatricule.split('-')[2], 10);
        sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
};
