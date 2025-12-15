import { sequelize } from './models';

async function addEmailColumn() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        await sequelize.getQueryInterface().addColumn('school_settings', 'email', {
            type: 'VARCHAR(255)',
            allowNull: true,
        });

        console.log('✅ Email column added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error adding email column:', error);
        process.exit(1);
    }
}

addEmailColumn();
