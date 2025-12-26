import { sequelize } from './models';
import ExamRule from './models/ExamRule';
import SchoolYear from './models/SchoolYear';

const checkActiveRules = async () => {
    try {
        await sequelize.authenticate();
        const year = await SchoolYear.findOne({ where: { is_active: true } });
        if (year) {
            console.log(`Active Year: ${year.name} (ID: ${year.id})`);
            const rules = await ExamRule.findAll({ where: { school_year_id: year.id } });
            console.log(`Rules count: ${rules.length}`);
            console.log(rules.map(r => `${r.category}: ${r.min_average}-${r.max_average} (${r.status})`));
        } else {
            console.log('No active year found');
        }
    } catch (e) { console.error(e); }
    finally { await sequelize.close(); }
};

checkActiveRules();
