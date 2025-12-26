import { sequelize } from './models';
import ExamRule from './models/ExamRule';
import SchoolYear from './models/SchoolYear';

const checkRules = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        const rules = await ExamRule.findAll();
        console.log(`Found ${rules.length} rules.`);
        console.log(JSON.stringify(rules, null, 2));

        const years = await SchoolYear.findAll();
        console.log('School Years:', JSON.stringify(years, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
};

checkRules();
