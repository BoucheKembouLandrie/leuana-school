
import sequelize from './config/database';
import { Expense } from './models';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        await sequelize.authenticate();
        console.log('--- DB Config ---');
        console.log('DB Name:', sequelize.config.database);
        console.log('DB Host:', sequelize.config.host);
        console.log('DB Port:', sequelize.config.port);

        console.log('\n--- Content Check ---');
        const count = await Expense.count({ where: { school_year_id: 5 } });
        console.log(`Expenses for Year 5: ${count}`);

        // Also check if year 5 exists
        const year = await sequelize.query('SELECT * FROM school_years WHERE id = 5');
        console.log('Year 5 Record:', JSON.stringify(year[0]));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
