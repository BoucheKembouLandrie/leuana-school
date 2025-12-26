import { sequelize } from './models';
import ExamRule from './models/ExamRule';
import SchoolYear from './models/SchoolYear';

const restoreDefaults = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        // Get active year
        const year = await SchoolYear.findOne({ where: { is_active: true } }) || await SchoolYear.findOne();

        if (!year) {
            console.log('No school year found.');
            return;
        }

        console.log(`Restoring defaults for year: ${year.name} (ID: ${year.id})`);

        const rules = [
            // Non redoublant
            { category: 'Non redoublant(e)', min_average: 10, max_average: 20, min_absence: 0, max_absence: 999, status: 'Admis(e) en classe supérieure', school_year_id: year.id },
            { category: 'Non redoublant(e)', min_average: 8.5, max_average: 10, min_absence: 0, max_absence: 999, status: 'Redouble la classe', school_year_id: year.id },
            { category: 'Non redoublant(e)', min_average: 0, max_average: 8.5, min_absence: 0, max_absence: 999, status: 'Exclu(e)', school_year_id: year.id },

            // Redoublant
            { category: 'Redoublant(e)', min_average: 10, max_average: 20, min_absence: 0, max_absence: 999, status: 'Admis(e) en classe supérieure', school_year_id: year.id },
            { category: 'Redoublant(e)', min_average: 0, max_average: 10, min_absence: 0, max_absence: 999, status: 'Exclu(e)', school_year_id: year.id },
        ];

        for (const rule of rules) {
            await ExamRule.create(rule);
            console.log(`Created rule: ${rule.status} [${rule.min_average} - ${rule.max_average}]`);
        }

        console.log('Defaults restored.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
};

restoreDefaults();
