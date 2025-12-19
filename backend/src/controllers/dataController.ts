import { Request, Response } from 'express';
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
} from '../models';
import ExcelJS from 'exceljs';
import { Readable } from 'stream';

// Helper to get all models in dependency order (for import)
// Note: Sequelize doesn't give us a perfect DAG easily, so we define one manually based on known relationships.
// Order matters for creation: Parents first, then Children.
// For deletion (reset), we usually disable foreign keys or delete in reverse order.
// Reordered to put potentially problematic models last
const MODELS_IMPORT_ORDER = [
    { name: 'SchoolSettings', model: SchoolSettings },
    { name: 'Class', model: Class },
    { name: 'Teacher', model: Teacher },
    { name: 'Subject', model: Subject },
    { name: 'Student', model: Student },
    { name: 'Evaluation', model: Evaluation },
    { name: 'Grade', model: Grade },
    { name: 'Payment', model: Payment },
    { name: 'Attendance', model: Attendance },
    { name: 'Staff', model: Staff },
    { name: 'Expense', model: Expense },
    { name: 'User', model: User } // Moved to end
];

export const exportData = async (req: Request, res: Response) => {
    try {
        console.log('Starting Export Process...');
        const schoolYearId = req.headers['x-school-year-id'];
        if (!schoolYearId) {
            return res.status(400).json({ message: 'School Year ID is required for export' });
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Leuana School System';
        workbook.created = new Date();

        for (const { name, model } of MODELS_IMPORT_ORDER) {
            try {
                if (!model) {
                    console.error(`Export Error: Model ${name} is UNDEFINED.`);
                    continue;
                }

                // Skip global models that shouldn't be exported per year, OR export them fully?
                // User said "gestion des donnees doit exporter... uniquement de l'annee scolaire en cours"
                // SchoolSettings and User are global.
                if (name === 'SchoolSettings' || name === 'User') {
                    continue;
                }

                console.log(`Processing export for ${name}...`);

                // Add filter
                const whereClause: any = { school_year_id: schoolYearId };
                const data = await (model as any).findAll({ where: whereClause, raw: true });

                console.log(`  Found ${data.length} records for ${name}`);

                if (data.length > 0) {
                    const sheet = workbook.addWorksheet(name);
                    // Filter out school_year_id column from export? Or keep it?
                    // Keeping it is safer for re-import logic if we want to validate, 
                    // BUT for import into *current* year, we ignore it anyway.
                    // Let's exclude created/updatedAt to keep file clean.
                    const columns = Object.keys(data[0])
                        .filter(key => !['createdAt', 'updatedAt'].includes(key))
                        .map(key => ({ header: key, key, width: 20 }));

                    sheet.columns = columns;
                    sheet.addRows(data);
                    console.log(`  Added sheet ${name}.`);
                }
            } catch (modelErr) {
                console.error(`Error exporting model ${name}:`, modelErr);
            }
        }

        console.log('Finalizing workbook...');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=school_data.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Fatal Export error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error exporting data', error });
        }
    }
};

export const importData = async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const schoolYearId = req.headers['x-school-year-id'];
    if (!schoolYearId) {
        return res.status(400).json({ message: 'School Year ID is required for import' });
    }

    const mode = req.body.mode || 'update';
    console.log(`Import mode: ${mode}, Target School Year: ${schoolYearId}`);

    const t = await sequelize.transaction();

    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer as any);

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction: t });

        for (const { name, model } of MODELS_IMPORT_ORDER) {

            // Skip global models
            if (name === 'SchoolSettings' || name === 'User') continue;

            const sheet = workbook.getWorksheet(name);
            if (sheet) {
                const records: any[] = [];
                const headers: string[] = [];

                sheet.getRow(1).eachCell((cell, colNumber) => {
                    headers[colNumber] = cell.text;
                });

                sheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return;
                    const record: any = {};
                    row.eachCell((cell, colNumber) => {
                        const header = headers[colNumber];
                        if (header) {
                            let value = cell.value;
                            if (typeof value === 'object' && value !== null && 'text' in value) {
                                value = (value as any).text;
                            }
                            record[header] = value;
                        }
                    });

                    // FORCE school_year_id to current year
                    record.school_year_id = schoolYearId;

                    records.push(record);
                });

                if (records.length > 0) {
                    console.log(`Importing ${records.length} records for ${name} into Year ${schoolYearId}`);

                    if (mode === 'duplicate') {
                        records.forEach(r => {
                            delete r.id;
                            delete r.createdAt;
                            delete r.updatedAt;
                            r.school_year_id = schoolYearId; // Ensure it's set
                        });
                        await (model as any).bulkCreate(records, { transaction: t });
                    } else if (mode === 'skip') {
                        await (model as any).bulkCreate(records, {
                            ignoreDuplicates: true,
                            transaction: t
                        });
                    } else { // 'update'
                        // Update needs to handle ID conflicts. If importing from same year, ID matches.
                        // If importing from diff year, IDs might conflict if we keep them.
                        // User requirement: "importer... uniquement de l'annee scolaire en cours" logic usually implies
                        // bringing data INTO this year. 
                        // If we keep IDs, we risk clashing with existing IDs if they are auto-increment global.
                        // Ideally, we should Map old IDs to New IDs if it's a cross-year import, which is complex.
                        // For now, assuming standard Restore/Backup within same context or simple import:
                        await (model as any).bulkCreate(records, {
                            updateOnDuplicate: Object.keys(records[0]),
                            transaction: t
                        });
                    }
                }
            }
        }

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction: t });
        await t.commit();

        res.json({ message: 'Data imported successfully' });

    } catch (error) {
        await t.rollback();
        console.error('Import error:', error);
        res.status(500).json({ message: 'Error importing data', error });
    }
};

export const resetData = async (req: Request, res: Response) => {
    const schoolYearId = req.headers['x-school-year-id'];
    if (!schoolYearId) {
        return res.status(400).json({ message: 'School Year ID is required for reset' });
    }

    const t = await sequelize.transaction();

    try {
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction: t });

        console.log(`Resetting data for School Year ID: ${schoolYearId}`);

        for (const { name, model } of MODELS_IMPORT_ORDER) {
            // Skip global models
            if (name === 'SchoolSettings' || name === 'User') continue;

            const deleted = await (model as any).destroy({
                where: { school_year_id: schoolYearId },
                transaction: t
            });
            console.log(`Deleted ${deleted} records from ${name}`);
        }

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction: t });
        await t.commit();

        res.json({ message: 'Database reset successfully for current school year' });

    } catch (error) {
        await t.rollback();
        console.error('Reset error:', error);
        res.status(500).json({ message: 'Error resetting data', error });
    }
};
