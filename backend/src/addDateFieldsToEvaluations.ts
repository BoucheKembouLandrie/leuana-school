import sequelize from './config/database';
import { QueryInterface, DataTypes } from 'sequelize';

const addDateFieldsToEvaluations = async () => {
    try {
        const queryInterface: QueryInterface = sequelize.getQueryInterface();

        console.log('Checking evaluations table columns...');
        const tableDescription = await queryInterface.describeTable('evaluations');
        console.log('Current columns:', Object.keys(tableDescription));

        // Add date_debut column
        if (!tableDescription.date_debut) {
            console.log('Adding date_debut column...');
            await queryInterface.addColumn('evaluations', 'date_debut', {
                type: DataTypes.DATEONLY,
                allowNull: true,
            });
            console.log('✓ Column "date_debut" added');
        } else {
            console.log('✓ Column "date_debut" already exists');
        }

        // Add date_fin column
        if (!tableDescription.date_fin) {
            console.log('Adding date_fin column...');
            await queryInterface.addColumn('evaluations', 'date_fin', {
                type: DataTypes.DATEONLY,
                allowNull: true,
            });
            console.log('✓ Column "date_fin" added');
        } else {
            console.log('✓ Column "date_fin" already exists');
        }

        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Error during migration:', error);
    } finally {
        await sequelize.close();
    }
};

addDateFieldsToEvaluations();
