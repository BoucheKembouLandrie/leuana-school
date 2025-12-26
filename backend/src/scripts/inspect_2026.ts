
import { Sequelize } from 'sequelize';
import sequelize from '../config/database';
import SchoolYear from '../models/SchoolYear';
import Class from '../models/Class';
import Student from '../models/Student';
import Subject from '../models/Subject';
import Evaluation from '../models/Evaluation';

async function inspectData() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const yearName = '2026-2027';
        const className = '5ieme';

        // 1. Check School Year
        const schoolYear = await SchoolYear.findOne({ where: { name: yearName } });
        if (!schoolYear) {
            console.log(`❌ School Year ${yearName} not found!`);
            return;
        }
        console.log(`✅ School Year ${yearName} found (id: ${schoolYear.id})`);

        // 2. Check Class
        // Classes are usually linked to school year via a field or just name? 
        // Let's check Class model structure in a bit, but for now assuming finding by Name and SchoolYear might be needed.
        // Actually, Class usually has school_year_id.
        const classes = await Class.findAll({ where: { libelle: className, school_year_id: schoolYear.id } });
        if (classes.length === 0) {
            console.log(`❌ Class ${className} not found in ${yearName}!`);
            // Check if class exists in general?
            const anyClass = await Class.findOne({ where: { libelle: className } });
            if (anyClass) console.log(`   (Class ${className} exists but with school_year_id ${anyClass.school_year_id})`);
            return;
        }
        const targetClass = classes[0];
        console.log(`✅ Class ${className} found (id: ${targetClass.id})`);

        // 3. Check Students
        const students = await Student.findAll({ where: { classe_id: targetClass.id } });
        console.log(`found ${students.length} students in ${className}`);
        if (students.length === 0) console.log('❌ No students found!');

        // 4. Check Subjects
        const subjects = await Subject.findAll({ where: { classe_id: targetClass.id } });
        console.log(`found ${subjects.length} subjects in ${className}`);
        if (subjects.length === 0) console.log('❌ No subjects found!');

        // 5. Check Evaluations
        const evaluations = await Evaluation.findAll({ where: { school_year_id: schoolYear.id } });
        console.log(`found ${evaluations.length} evaluations for ${yearName}`);
        evaluations.forEach(e => console.log(`   - ${e.nom}`));

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

inspectData();
