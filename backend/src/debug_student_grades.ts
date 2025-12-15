import sequelize from './config/database';
import { QueryTypes } from 'sequelize';

const debugStudentGrades = async () => {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // 1. Get first few students with class info
        const students = await sequelize.query(`
            SELECT s.id, s.nom, s.prenom, c.libelle as classe 
            FROM students s 
            LEFT JOIN classes c ON s.classe_id = c.id
            LIMIT 5
        `, { type: QueryTypes.SELECT });

        console.log('Sample Students:', students);

        if (students.length > 0) {
            const student: any = students[0];
            const studentId = student.id;
            console.log(`\nChecking grades for Student ID: ${studentId} (${student.nom})`);

            const grades: any[] = await sequelize.query(`
                SELECT g.note, g.trimestre, sub.nom as matiere
                FROM grades g
                LEFT JOIN subjects sub ON g.matiere_id = sub.id
                WHERE g.eleve_id = ${studentId}
            `, { type: QueryTypes.SELECT });

            console.log('Grades found:', grades.length);
            if (grades.length > 0) {
                console.log('Sample Grades:', grades);
            } else {
                console.log('No grades found for this student.');
            }
        }

        // Check Trimestres again
        const distinctTrimestres = await sequelize.query(`
            SELECT DISTINCT trimestre FROM grades
        `, { type: QueryTypes.SELECT });
        console.log('\nAll Available Trimestres in DB:', JSON.stringify(distinctTrimestres));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

debugStudentGrades();
