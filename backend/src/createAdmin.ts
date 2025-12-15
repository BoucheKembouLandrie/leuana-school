import bcrypt from 'bcrypt';
import { sequelize, User } from './models';

async function createAdminUser() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        await sequelize.sync();
        console.log('Models synchronized.');

        const hashedPassword = await bcrypt.hash('admin123', 10);

        const [user, created] = await User.findOrCreate({
            where: { username: 'admin' },
            defaults: {
                username: 'admin',
                password: hashedPassword,
                role: 'admin',
            },
        });

        if (created) {
            console.log('✅ Admin user created successfully!');
            console.log('Username: admin');
            console.log('Password: admin123');
        } else {
            console.log('ℹ️  Admin user already exists.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

createAdminUser();
