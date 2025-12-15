import sequelize from './config/database';
import { QueryInterface, DataTypes } from 'sequelize';

const createEvaluationsTable = async () => {
    try {
        const queryInterface: QueryInterface = sequelize.getQueryInterface();

        console.log('Checking if evaluations table exists...');
        const tables = await queryInterface.showAllTables();
        console.log('Existing tables:', tables);

        if (!tables.includes('evaluations')) {
            console.log('Creating evaluations table...');
            await queryInterface.createTable('evaluations', {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                nom: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                date_debut: {
                    type: DataTypes.DATEONLY,
                    allowNull: true,
                },
                date_fin: {
                    type: DataTypes.DATEONLY,
                    allowNull: true,
                },
                ordre: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                createdAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                },
                updatedAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                },
            });
            console.log('✓ Table "evaluations" created successfully!');
        } else {
            console.log('✓ Table "evaluations" already exists');
        }

        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Error during migration:', error);
    } finally {
        await sequelize.close();
    }
};

createEvaluationsTable();
