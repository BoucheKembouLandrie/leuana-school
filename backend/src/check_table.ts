import { sequelize } from './models';

async function checkStructure() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        const [results] = await sequelize.query("SHOW TABLES LIKE 'exam_rules'");
        if (results.length === 0) {
            console.log('❌ Table exam_rules DOES NOT EXIST');
        } else {
            console.log('✅ Table exam_rules EXISTS');

            const [rows]: any = await sequelize.query("SELECT * FROM exam_rules");
            console.log(`📊 Row count: ${rows.length}`);
            if (rows.length > 0) {
                console.log('First 3 rows:', rows.slice(0, 3));
            }

            const [columns]: any = await sequelize.query("SHOW COLUMNS FROM exam_rules");
            console.log('Columns:', columns.map((c: any) => c.Field));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkStructure();
