import app from './app';
import { sequelize } from './models';

const PORT = 5005; // Force port to bypass .env
console.log("!!! FORCING PORT 5005 - IGNORE ENV !!!");
console.log("!!! SERVER LOADING NEW CODE - TIMESTAMP " + Date.now() + " !!!");

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // Sync models (use { force: true } only for development to reset DB)
        // await sequelize.sync({ alter: true });
        await sequelize.sync();
        // await sequelize.sync();
        console.log('Models synchronized.');

        const server = app.listen(Number(PORT), '0.0.0.0', () => {
            console.log(`Server is running on port ${PORT}`);
        });
        server.on('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`ERROR: Port ${PORT} is already in use! Please stop other running servers.`);
                process.exit(1);
            } else {
                console.error('Server error:', err);
            }
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

startServer();
// Forced restart for controller update

