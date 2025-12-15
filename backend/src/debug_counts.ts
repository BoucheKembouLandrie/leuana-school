import {
    Student,
    Teacher,
    Class,
    Subject,
    Grade,
    Payment,
    Attendance,
    SchoolSettings,
    User,
    Evaluation,
    Staff,
    Expense,
    sequelize
} from './models';

const MODELS = [
    { name: 'SchoolSettings', model: SchoolSettings },
    { name: 'User', model: User },
    { name: 'Class', model: Class },
    { name: 'Teacher', model: Teacher },
    { name: 'Subject', model: Subject },
    { name: 'Student', model: Student },
    { name: 'Evaluation', model: Evaluation },
    { name: 'Grade', model: Grade },
    { name: 'Payment', model: Payment },
    { name: 'Attendance', model: Attendance },
    { name: 'Staff', model: Staff },
    { name: 'Expense', model: Expense }
];

const checkCounts = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        for (const { name, model } of MODELS) {
            try {
                if (!model) {
                    console.log(`${name}: MODEL IS UNDEFINED/NULL`);
                    continue;
                }
                const count = await (model as any).count();
                console.log(`${name}: ${count} records`);
            } catch (err: any) {
                console.error(`${name}: Error counting - ${err.message}`);
            }
        }
        process.exit(0);
    } catch (error) {
        console.error('Connection error:', error);
        process.exit(1);
    }
};

checkCounts();
