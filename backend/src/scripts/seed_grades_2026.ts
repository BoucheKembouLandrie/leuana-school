
import { Sequelize } from 'sequelize';
import sequelize from '../config/database';
import SchoolYear from '../models/SchoolYear';
import Class from '../models/Class';
import Student from '../models/Student';
import Subject from '../models/Subject';
import Evaluation from '../models/Evaluation';
import Grade from '../models/Grade';

async function seedGrades() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const yearName = '2026-2027';
        const className = '5ieme';

        // 1. Get School Year
        const schoolYear = await SchoolYear.findOne({ where: { name: yearName } });
        if (!schoolYear) throw new Error(`School Year ${yearName} not found`);

        // 2. Get Class
        const targetClass = await Class.findOne({ where: { libelle: className, school_year_id: schoolYear.id } });
        if (!targetClass) throw new Error(`Class ${className} not found in ${yearName}`);

        // 3. Get Students
        const students = await Student.findAll({ where: { classe_id: targetClass.id } });
        console.log(`Found ${students.length} students`);

        // 4. Get Subjects
        const subjects = await Subject.findAll({ where: { classe_id: targetClass.id } });
        console.log(`Found ${subjects.length} subjects`);

        // 5. Get Evaluations
        const evaluations = await Evaluation.findAll({ where: { school_year_id: schoolYear.id } });
        console.log(`Found ${evaluations.length} evaluations`);

        // 6. Seed Grades
        let createdCount = 0;
        for (const student of students) {
            for (const subject of subjects) {
                for (const evaluation of evaluations) {
                    // Check if grade exists
                    const existingGrade = await Grade.findOne({
                        where: {
                            eleve_id: student.id,
                            matiere_id: subject.id,
                            trimestre: evaluation.nom,
                            school_year_id: schoolYear.id
                        }
                    });

                    if (!existingGrade) {
                        // Generate random grade between 5 and 18 (realistic range)
                        const randomGrade = parseFloat((Math.random() * (18 - 5) + 5).toFixed(2));

                        await Grade.create({
                            eleve_id: student.id,
                            matiere_id: subject.id,
                            note: randomGrade,
                            trimestre: evaluation.nom,
                            annee_scolaire: yearName,
                            school_year_id: schoolYear.id
                        });
                        createdCount++;
                    }
                }
            }
        }

        console.log(`✅ Successfully created ${createdCount} grades!`);

    } catch (error) {
        console.error('Error seeding grades:', error);
    } finally {
        await sequelize.close();
    }
}

seedGrades();
