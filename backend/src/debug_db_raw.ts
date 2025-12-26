import { sequelize } from './models';

async function debugDB() {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        // 1. Show Create Table
        const [createTable] = await sequelize.query("SHOW CREATE TABLE exam_rules");
        console.log('Create Table SQL:', createTable[0]);

        // 2. Try Raw Insert
        try {
            await sequelize.query(`
                INSERT INTO exam_rules (category, min_average, max_average, min_absence, max_absence, status, school_year_id, createdAt, updatedAt)
                VALUES ('TestRaw', 0, 5, 0, 10, 'TestRaw', 4, NOW(), NOW())
            `);
            console.log('✅ RAW INSERT SUCCESSFUL');
        } catch (e: any) {
            console.log('❌ RAW INSERT FAILED:', e.original?.sqlMessage || e.message);
        }

    } catch (e) { console.error(e); }
    finally { await sequelize.close(); }
}

debugDB();
