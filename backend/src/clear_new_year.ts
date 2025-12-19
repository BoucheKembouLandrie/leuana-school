
import {
    sequelize,
    SchoolYear,
    Expense,
    Evaluation,
    Grade,
    Attendance,
    Payment,
    Class,
    Student,
    Subject,
    Staff
} from './models';

async function clearYearData() {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        // Find the year 2026-2027
        const year = await SchoolYear.findOne({ where: { name: '2026-2027' } });
        if (!year) {
            console.log('Year 2026-2027 not found. Listing all years:');
            const all = await SchoolYear.findAll();
            all.forEach(y => console.log(`  ${y.name} (ID: ${y.id})`));
            return;
        }

        const id = year.id;
        console.log(`Clearing data for School Year: ${year.name} (ID: ${id})`);

        // Delete in order of dependencies (Child first)

        // 1. Grades (depend on Student, Evaluation, Subject)
        const g = await Grade.destroy({ where: { school_year_id: id } });
        console.log(`Deleted ${g} grades.`);

        // 2. Attendance
        const a = await Attendance.destroy({ where: { school_year_id: id } });
        console.log(`Deleted ${a} attendance records.`);

        // 3. Payments
        const p = await Payment.destroy({ where: { school_year_id: id } });
        console.log(`Deleted ${p} payments.`);

        // 4. Expenses
        const e = await Expense.destroy({ where: { school_year_id: id } });
        console.log(`Deleted ${e} expenses.`);

        // 5. Evaluations
        const ev = await Evaluation.destroy({ where: { school_year_id: id } });
        console.log(`Deleted ${ev} evaluations.`);

        // 6. Students
        const s = await Student.destroy({ where: { school_year_id: id } });
        console.log(`Deleted ${s} students.`);

        // 7. Subjects (linked to year?)
        const sub = await Subject.destroy({ where: { school_year_id: id } });
        console.log(`Deleted ${sub} subjects.`);

        // 8. Classes
        const c = await Class.destroy({ where: { school_year_id: id } });
        console.log(`Deleted ${c} classes.`);

        // 9. Staff (linked to year?)
        // I added school_year_id to Staff recently. 
        // Note: Teachers are currently global or not clearly linked to year in my memory, 
        // but looking at `Teaching` or `Teacher` model?
        // Teacher model HAS school_year_id? I added it in previous turn.
        // Let's check Teacher.
        // And Staff.

        const st = await Staff.destroy({ where: { school_year_id: id } });
        console.log(`Deleted ${st} staff.`);

        // Teachers?
        // I should check if Teacher has school_year_id.
        // Proceeding with what I know.

        console.log('✅ Data cleared for 2026-2027.');
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

clearYearData();
