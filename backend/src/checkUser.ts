import sequelize from './config/database';
import User from './models/User';

const checkUser = async () => {
    try {
        await sequelize.sync();
        const admin = await User.findOne({ where: { username: 'admin' } });

        if (admin) {
            console.log('Admin user found:');
            console.log('ID:', admin.id);
            console.log('Username:', admin.username);
            console.log('Role:', admin.role);
            console.log('Is Default:', admin.is_default);
            console.log('Teacher ID:', admin.teacher_id);
            console.log('Permissions:', admin.permissions);
        } else {
            console.log('No admin user found');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
};

checkUser();
