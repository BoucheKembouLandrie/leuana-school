import { sequelize } from './models';
import Schedule from './models/Schedule';

async function createSchedulesTable() {
    try {
        console.log('Creating schedules table...');
        await Schedule.sync({ force: false });
        console.log('✅ Schedules table created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating schedules table:', error);
        process.exit(1);
    }
}

createSchedulesTable();
