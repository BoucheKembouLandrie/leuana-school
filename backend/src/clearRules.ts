import { sequelize } from './models';
import ExamRule from './models/ExamRule';
import SchoolYear from './models/SchoolYear';

const clearRules = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        // Get active year
        const year = await SchoolYear.findOne({ where: { is_active: true } }) || await SchoolYear.findOne();

        if (!year) {
            console.log('No school year found.');
            return;
        }

        console.log(`Clearing rules for year: ${year.name} (ID: ${year.id})`);

        const count = await ExamRule.destroy({
            where: { school_year_id: year.id }
        });

        console.log(`Deleted ${count} rules.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
};

clearRules();
