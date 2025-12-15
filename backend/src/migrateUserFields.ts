import sequelize from './config/database';
import { QueryInterface, DataTypes } from 'sequelize';

const addUserRoleFields = async () => {
    try {
        const queryInterface: QueryInterface = sequelize.getQueryInterface();

        console.log('Checking existing columns...');
        const tableDescription = await queryInterface.describeTable('users');
        console.log('Current columns:', Object.keys(tableDescription));

        // Add is_default column
        if (!tableDescription.is_default) {
            console.log('Adding is_default column...');
            await queryInterface.addColumn('users', 'is_default', {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            });
            console.log('✓ Column "is_default" added');
        } else {
            console.log('✓ Column "is_default" already exists');
        }

        // Add teacher_id column
        if (!tableDescription.teacher_id) {
            console.log('Adding teacher_id column...');
            await queryInterface.addColumn('users', 'teacher_id', {
                type: DataTypes.INTEGER,
                allowNull: true,
            });
            console.log('✓ Column "teacher_id" added');
        } else {
            console.log('✓ Column "teacher_id" already exists');
        }

        // Add permissions column
        if (!tableDescription.permissions) {
            console.log('Adding permissions column...');
            await queryInterface.addColumn('users', 'permissions', {
                type: DataTypes.JSON,
                allowNull: true,
            });
            console.log('✓ Column "permissions" added');
        } else {
            console.log('✓ Column "permissions" already exists');
        }

        // Set is_default = true for the admin user
        console.log('Updating admin user...');
        await sequelize.query(
            "UPDATE users SET is_default = true WHERE username = 'admin' AND role = 'admin'"
        );
        console.log('✓ Admin user marked as default');

        console.log('\n✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Error during migration:', error);
    } finally {
        await sequelize.close();
    }
};

addUserRoleFields();
