import { sequelize } from './models';
import ExamRule from './models/ExamRule';

const clearAllRules = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        const yearId = 4;
        const count = await ExamRule.destroy({ where: { schoolYearId: yearId } });

        console.log(`✅ Deleted ${count} rules for year ID ${yearId}`);

    } catch (e: any) {
        console.error('❌ ERROR:', e.message);
    } finally {
        await sequelize.close();
    }
};

clearAllRules();
