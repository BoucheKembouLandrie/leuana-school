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
import ExcelJS from 'exceljs';
import path from 'path';

const MODELS_IMPORT_ORDER = [
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

const debugExport = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Leuana School System';
        workbook.created = new Date();

        console.log('Starting export loop...');

        for (const { name, model } of MODELS_IMPORT_ORDER) {
            console.log(`Processing model: ${name}`);
            try {
                // Testing the exact logic used in controller
                const data = await (model as any).findAll({ raw: true });
                console.log(`  Found ${data.length} records.`);

                if (data.length > 0) {
                    const sheet = workbook.addWorksheet(name);
                    const columns = Object.keys(data[0]).map(key => ({ header: key, key, width: 20 }));
                    sheet.columns = columns;
                    sheet.addRows(data);
                    console.log(`  Added sheet ${name} with ${data.length} rows.`);
                } else {
                    console.log(`  Skipping sheet ${name} (no data).`);
                }
            } catch (err) {
                console.error(`  ERROR processing ${name}:`, err);
                throw err;
            }
        }

        const outputPath = path.join(__dirname, 'debug_export_test.xlsx');
        await workbook.xlsx.writeFile(outputPath);
        console.log(`Export successful! Saved to ${outputPath}`);
        process.exit(0);

    } catch (error) {
        console.error('EXPORT FAILED:', error);
        process.exit(1);
    }
};

debugExport();
