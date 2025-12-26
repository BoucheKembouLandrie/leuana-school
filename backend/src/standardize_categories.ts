import { sequelize } from './models';
import Student from './models/Student';
import { Op } from 'sequelize';

const standardizeCategories = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        // Update students having 'Non redoublant' to 'Non redoublant(e)'
        const [updatedCount] = await Student.update(
            { category: 'Non redoublant(e)' },
            {
                where: {
                    category: 'Non redoublant'
                }
            }
        );

        console.log(`✅ Updated ${updatedCount} students from 'Non redoublant' to 'Non redoublant(e)'`);

        // Update 'Redoublant' to 'Redoublant(e)' if any
        const [updatedRedoublantCount] = await Student.update(
            { category: 'Redoublant(e)' },
            {
                where: {
                    category: 'Redoublant'
                }
            }
        );

        console.log(`✅ Updated ${updatedRedoublantCount} students from 'Redoublant' to 'Redoublant(e)'`);

        // Verify
        const students = await Student.findAll({ limit: 5, order: [['updatedAt', 'DESC']] });
        console.log('Sample updated students:', JSON.stringify(students.map(s => ({ nom: s.nom, category: s.category })), null, 2));

    } catch (error) {
        console.error('Error updating categories:', error);
    } finally {
        await sequelize.close();
    }
};

standardizeCategories();
