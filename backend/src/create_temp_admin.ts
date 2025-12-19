
import bcrypt from 'bcrypt';
import { sequelize, User } from './models';

async function createTempAdmin() {
    try {
        await sequelize.authenticate();
        const hashedPassword = await bcrypt.hash('temp123', 10);
        await User.create({
            username: 'temp_debug_admin',
            password: hashedPassword,
            role: 'admin',
        });
        console.log('✅ Temp admin created.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createTempAdmin();
