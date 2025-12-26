/**
 * Migration Script: Add school_year_id to all data tables
 * 
 * This script:
 * 1. Creates the school_years table
 * 2. Inserts a default school year (2024-2025) and marks it active
 * 3. Adds school_year_id column to all data tables
 * 4. Updates existing data to reference the default year
 * 5. Adds foreign key constraints
 * 
 * IMPORTANT: Backup your database before running this!
 */

import sequelize from './config/database';
import SchoolYear from './models/SchoolYear';

const DATA_TABLES = [
    'students',
    'teachers',
    'classes',
    'subjects',
    'grades',
    'payments',
    'attendance',
    'evaluations',
    'staff',
    'expenses',
    'exam_rules'
];

async function migrateToSchoolYears() {
    const transaction = await sequelize.transaction();

    try {
        console.log('Starting school year migration...');

        // Step 1: Create school_years table
        console.log('1. Creating school_years table...');
        await SchoolYear.sync({ force: false });

        // Step 2: Insert default school year
        console.log('2. Creating default school year (2024-2025)...');
        const [defaultYear] = await SchoolYear.findOrCreate({
            where: { name: '2024-2025' },
            defaults: {
                name: '2024-2025',
                startYear: 2024,
                endYear: 2025,
                isActive: true
            },
            transaction
        });
        console.log(`   Default year created with ID: ${defaultYear.id}`);

        // Step 3: Add school_year_id column to each table
        for (const tableName of DATA_TABLES) {
            console.log(`3. Adding school_year_id to ${tableName}...`);

            // Check if column already exists
            const [results]: any = await sequelize.query(
                `SHOW COLUMNS FROM ${tableName} LIKE 'school_year_id'`,
                { transaction }
            );

            if (results.length === 0) {
                // Add column
                await sequelize.query(
                    `ALTER TABLE ${tableName} ADD COLUMN school_year_id INT`,
                    { transaction }
                );
                console.log(`   ✓ Column added to ${tableName}`);
            } else {
                console.log(`   ⊙ Column already exists in ${tableName}`);
            }
        }

        // Step 4: Update existing records to reference default year
        console.log('4. Assigning existing data to default year...');
        for (const tableName of DATA_TABLES) {
            const [result]: any = await sequelize.query(
                `UPDATE ${tableName} SET school_year_id = ${defaultYear.id} WHERE school_year_id IS NULL`,
                { transaction }
            );
            console.log(`   ✓ Updated ${tableName}`);
        }

        // Step 5: Add NOT NULL constraint and foreign keys
        console.log('5. Adding constraints...');
        for (const tableName of DATA_TABLES) {
            // Make column NOT NULL
            await sequelize.query(
                `ALTER TABLE ${tableName} MODIFY COLUMN school_year_id INT NOT NULL`,
                { transaction }
            );

            // Add foreign key
            const fkName = `fk_${tableName}_school_year`;
            await sequelize.query(
                `ALTER TABLE ${tableName} 
                 ADD CONSTRAINT ${fkName} 
                 FOREIGN KEY (school_year_id) 
                 REFERENCES school_years(id) 
                 ON DELETE CASCADE`,
                { transaction }
            );
            console.log(`   ✓ Constraints added to ${tableName}`);
        }

        await transaction.commit();
        console.log('\n✅ Migration completed successfully!');
        console.log(`   All data assigned to: ${defaultYear.name}`);
        console.log('   You can now create new school years and data will be isolated.');

    } catch (error) {
        await transaction.rollback();
        console.error('\n❌ Migration failed:', error);
        console.error('   Database has been rolled back to previous state.');
        throw error;
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrateToSchoolYears()
        .then(() => {
            console.log('\nMigration script finished. Exiting...');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\nMigration script failed:', error);
            process.exit(1);
        });
}

export default migrateToSchoolYears;
