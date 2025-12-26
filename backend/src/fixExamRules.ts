import { sequelize } from './models';
import SchoolYear from './models/SchoolYear';

const fixExamRules = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        // Get default/active year
        const year = await SchoolYear.findOne({ where: { is_active: true } }) || await SchoolYear.findOne();

        if (!year) {
            console.log('No school year found. Cannot migrate rules.');
            return;
        }

        console.log(`Assigning orphaned rules to year: ${year.name} (ID: ${year.id})`);

        const [results, metadata] = await sequelize.query(
            `UPDATE exam_rules SET school_year_id = ${year.id} WHERE school_year_id IS NULL`
        );

        console.log('Update result:', metadata);
        console.log('Done.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
};

fixExamRules();
