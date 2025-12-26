import { sequelize } from './models';
import ExamRule from './models/ExamRule';

const clearAll = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        // Delete ALL rules (all years)
        const count = await ExamRule.destroy({ where: {} });

        console.log(`✅ Deleted ${count} rules (all years)`);

    } catch (e: any) {
        console.error('❌ ERROR:', e.message);
    } finally {
        await sequelize.close();
    }
};

clearAll();
