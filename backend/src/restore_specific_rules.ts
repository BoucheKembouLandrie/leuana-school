import { sequelize } from './models';
import ExamRule from './models/ExamRule';
import SchoolYear from './models/SchoolYear';

const restoreRules = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        // Get active year
        const year = await SchoolYear.findOne({ where: { field: 'is_active' } }) || await SchoolYear.findOne({ where: { id: 4 } });
        // fallback to ID 4 since we know it's the one we've been working with

        if (!year) {
            console.log('No school year found. Using ID 4 default.');
        }
        const schoolYearId = year ? year.id : 4;

        console.log(`Restoring rules for year ID: ${schoolYearId}`);

        const rules = [
            {
                category: 'Non redoublant(e)',
                min_average: 0,
                max_average: 7.99,
                min_absence: 0,
                max_absence: 999, // Assuming "1000" in text but 999 is safer max
                status: 'Exclu(e)',
                schoolYearId: schoolYearId
            },
            {
                category: 'Non redoublant(e)',
                min_average: 8,
                max_average: 9.99,
                min_absence: 0,
                max_absence: 10,
                status: 'Redouble la classe',
                schoolYearId: schoolYearId
            },
            {
                category: 'Non redoublant(e)',
                min_average: 8,
                max_average: 9.99,
                min_absence: 11,
                max_absence: 999,
                status: 'Exclu(e)',
                schoolYearId: schoolYearId
            }
        ];

        for (const rule of rules) {
            try {
                const created = await ExamRule.create(rule);
                console.log(`✅ Created rule: [${rule.min_average} - ${rule.max_average}] Abs:[${rule.min_absence}-${rule.max_absence}] -> ${rule.status}`);
            } catch (err: any) {
                console.log(`❌ Failed rule [${rule.min_average} - ${rule.max_average}]:`, err.message);
            }
        }

    } catch (e) {
        console.error('Script Error:', e);
    } finally {
        await sequelize.close();
    }
};

restoreRules();
