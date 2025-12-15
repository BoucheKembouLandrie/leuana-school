import { sequelize, SchoolSettings } from './models';

async function checkSettings() {
    try {
        await sequelize.authenticate();
        const settings = await SchoolSettings.findOne();
        console.log('Current Settings:', settings ? settings.toJSON() : 'No settings found');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSettings();
