import sequelize from './config/database';
import { DataTypes } from 'sequelize';
import User from './models/User';

async function addEmailToUsers() {
    try {
        console.log('Adding email column to users table...');

        await sequelize.getQueryInterface().addColumn('users', 'email', {
            type: DataTypes.STRING,
            allowNull: true,
        });

        console.log('Email column added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error adding email column:', error);
        process.exit(1);
    }
}

addEmailToUsers();
