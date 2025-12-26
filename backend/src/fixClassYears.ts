import sequelize from './config/database';
import Class from './models/Class';
import SchoolYear from './models/SchoolYear';

const fixClasses = async () => {
    try {
        console.log('Starting Class year repair...');

        // Fetch all classes
        const classes = await Class.findAll();
        console.log(`Found ${classes.length} classes to check.`);

        let updateCount = 0;

        for (const startClass of classes) {
            const schoolYear = await SchoolYear.findByPk(startClass.school_year_id);

            if (schoolYear && startClass.annee !== schoolYear.name) {
                console.log(`Fixing Class ${startClass.id} (${startClass.libelle}): ${startClass.annee} -> ${schoolYear.name}`);
                await startClass.update({ annee: schoolYear.name });
                updateCount++;
            }
        }

        console.log(`Repair complete. Updated ${updateCount} classes.`);
    } catch (error) {
        console.error('Error repairing classes:', error);
    } finally {
        await sequelize.close();
    }
};

fixClasses();
