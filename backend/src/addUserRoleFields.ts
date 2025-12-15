import sequelize from './config/database';
import { DataTypes, QueryTypes } from 'sequelize';

const addUserRoleFields = async () => {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableDescription = await queryInterface.describeTable('users');

        // Add is_default column
        if (!tableDescription.is_default) {
            await queryInterface.addColumn('users', 'is_default', {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            });
            console.log('Column "is_default" added successfully.');
        } else {
            console.log('Column "is_default" already exists.');
        }

        // Add teacher_id column
        if (!tableDescription.teacher_id) {
            await queryInterface.addColumn('users', 'teacher_id', {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'teachers',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            });
            console.log('Column "teacher_id" added successfully.');
        } else {
            console.log('Column "teacher_id" already exists.');
        }

        // Add permissions column
        if (!tableDescription.permissions) {
            await queryInterface.addColumn('users', 'permissions', {
                type: DataTypes.JSON,
                allowNull: true,
            });
            console.log('Column "permissions" added successfully.');
        } else {
            console.log('Column "permissions" already exists.');
        }

        // Set is_default = true for the admin user
        await sequelize.query(
            "UPDATE users SET is_default = true WHERE username = 'admin' AND role = 'admin'",
            { type: QueryTypes.UPDATE }
        );
        console.log('Default admin account marked as is_default = true.');

    } catch (error) {
        console.error('Error adding columns:', error);
    } finally {
        await sequelize.close();
    }
};

addUserRoleFields();
