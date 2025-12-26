import { sequelize } from './models';
import ExamRule from './models/ExamRule';

const testFullFlow = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB\n');

        // 1. Check DB directly
        console.log('=== DIRECT DB QUERY ===');
        const allRules = await ExamRule.findAll();
        console.log(`Total rules in DB (all years): ${allRules.length}`);

        const year4Rules = await ExamRule.findAll({ where: { schoolYearId: 4 } });
        console.log(`Rules for year ID 4: ${year4Rules.length}`);

        if (year4Rules.length > 0) {
            console.log('\nRules found:');
            year4Rules.forEach((r, i) => {
                console.log(`  ${i + 1}. [${r.min_average}-${r.max_average}] ${r.status} (schoolYearId: ${r.schoolYearId})`);
            });
        }

        // 2. Check what the API would return
        console.log('\n=== SIMULATED API CALL ===');
        const schoolYearId = '4'; // As string (like from header)
        const whereClause = schoolYearId ? { schoolYearId: schoolYearId } : {};
        console.log('WHERE clause:', JSON.stringify(whereClause));

        const apiResult = await ExamRule.findAll({ where: whereClause });
        console.log(`API would return: ${apiResult.length} rules`);

        // 3. Try with parseInt
        console.log('\n=== WITH parseInt ===');
        const whereClauseInt = schoolYearId ? { schoolYearId: parseInt(schoolYearId) } : {};
        console.log('WHERE clause (int):', JSON.stringify(whereClauseInt));

        const apiResultInt = await ExamRule.findAll({ where: whereClauseInt });
        console.log(`API would return: ${apiResultInt.length} rules`);

    } catch (e: any) {
        console.error('❌ ERROR:', e.message);
    } finally {
        await sequelize.close();
    }
};

testFullFlow();
