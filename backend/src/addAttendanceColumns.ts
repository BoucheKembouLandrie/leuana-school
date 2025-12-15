
import sequelize from './config/database';
import { DataTypes } from 'sequelize';

const addAttendanceColumns = async () => {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableDescription = await queryInterface.describeTable('attendance');

        if (!tableDescription.motif) {
            await queryInterface.addColumn('attendance', 'motif', {
                type: DataTypes.STRING,
                allowNull: true,
            });
            console.log('Column "motif" added successfully.');
        } else {
            console.log('Column "motif" already exists.');
        }

        if (!tableDescription.time) {
            await queryInterface.addColumn('attendance', 'time', {
                type: DataTypes.STRING,
                allowNull: true,
            });
            console.log('Column "time" added successfully.');
        } else {
            console.log('Column "time" already exists.');
        }

    } catch (error) {
        console.error('Error adding columns:', error);
    } finally {
        await sequelize.close();
    }
};

addAttendanceColumns();
