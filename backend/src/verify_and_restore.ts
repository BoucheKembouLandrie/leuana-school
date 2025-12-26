import { sequelize } from './models';
import ExamRule from './models/ExamRule';

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        const yearId = 4; // Hardcoded active year
        console.log(`Targeting Year ID: ${yearId}`);

        // 1. Clear existing rules for this year to avoid duplicates/conflicts during restoration
        await ExamRule.destroy({ where: { schoolYearId: yearId } });
        console.log('Cleared existing rules.');

        // 2. Insert User Rules
        const rules = [
            {
                category: 'Non redoublant(e)',
                min_average: 0,
                max_average: 7.99,
                min_absence: 0,
                max_absence: 999,
                status: 'Exclu(e)',
                schoolYearId: yearId
            },
            {
                category: 'Non redoublant(e)',
                min_average: 8,
                max_average: 9.99,
                min_absence: 0,
                max_absence: 10,
                status: 'Redouble la classe',
                schoolYearId: yearId
            },
            {
                category: 'Non redoublant(e)',
                min_average: 8,
                max_average: 9.99,
                min_absence: 11,
                max_absence: 999,
                status: 'Exclu(e)',
                schoolYearId: yearId
            }
        ];

        for (const r of rules) {
            await ExamRule.create(r);
            console.log(`+ Added: [${r.min_average}-${r.max_average}] ${r.status}`);
        }

        // 3. Verify
        const allRules = await ExamRule.findAll({ where: { schoolYearId: yearId } });
        console.log(`Total Rules in DB: ${allRules.length}`);

    } catch (e: any) {
        console.error('ERROR:', e.message, e.original?.sqlMessage);
    } finally {
        await sequelize.close();
    }
};

run();
