import sequelize from './config/database';
import User from './models/User';
import bcrypt from 'bcrypt';

const resetPassword = async () => {
    try {
        console.log('Resetting admin password...');

        const adminUser = await User.findOne({ where: { username: 'admin' } });

        if (!adminUser) {
            console.log('Admin user not found!');
            return;
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);
        await adminUser.update({ password: hashedPassword });

        console.log('Password reset successfully for user: admin');
        console.log('New password: admin123');

    } catch (error) {
        console.error('Error resetting password:', error);
    } finally {
        await sequelize.close();
    }
};

resetPassword();
