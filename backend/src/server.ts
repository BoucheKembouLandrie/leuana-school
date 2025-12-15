import app from './app';
import { sequelize } from './models';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Sync models (use { force: true } only for development to reset DB)
        // await sequelize.sync({ alter: true });
        await sequelize.sync();
        // await sequelize.sync();
        console.log('Models synchronized.');

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

startServer();
// Forced restart for controller update

