import { sequelize } from './models';
import ExamRule from './models/ExamRule';

const forceSync = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        // Force recreate table
        await ExamRule.sync({ force: true });
        console.log('✅ Table exam_rules recreated');

        // Show structure
        const [results] = await sequelize.query("SHOW COLUMNS FROM exam_rules");
        console.log('\nTable structure:');
        console.log(results);

    } catch (e: any) {
        console.error('❌ ERROR:', e.message);
    } finally {
        await sequelize.close();
    }
};

forceSync();
