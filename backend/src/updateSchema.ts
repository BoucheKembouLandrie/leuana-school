
import { sequelize } from './models';

const syncSchema = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        // Use alter: true to add the new columns without dropping data
        await sequelize.sync({ alter: true });
        console.log('Schema synchronized successfully.');
    } catch (error) {
        console.error('Error syncing schema:', error);
    } finally {
        await sequelize.close();
    }
};

syncSchema();
