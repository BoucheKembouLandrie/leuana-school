import { sequelize } from './models';
import ExamRule from './models/ExamRule';

const forceCreateTable = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        console.log('Forcing creation of ExamRule table...');
        await ExamRule.sync({ force: true });
        console.log('Table exam_rules created successfully.');

    } catch (error) {
        console.error('Error creating table:', error);
    } finally {
        await sequelize.close();
    }
};

forceCreateTable();
