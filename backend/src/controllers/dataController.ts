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
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Leuana School System';
        workbook.created = new Date();

        for (const { name, model } of MODELS_IMPORT_ORDER) {
            try {
                if (!model) {
                    console.error(`Export Error: Model ${name} is UNDEFINED. Check circular dependencies in models/index.ts`);
                    continue;
                }

                console.log(`Processing export for ${name}...`);
                const data = await (model as any).findAll({ raw: true });
                console.log(`  Found ${data.length} records for ${name}`);

                if (data.length > 0) {
                    const sheet = workbook.addWorksheet(name);

                    // Get headers from all unique keys across records to ensure we don't miss fields if first record is sparse?
                    // For now, simple approach: keys of first record.
                    const columns = Object.keys(data[0]).map(key => ({ header: key, key, width: 20 }));
                    sheet.columns = columns;

                    sheet.addRows(data);
                    console.log(`  Added sheet ${name}.`);
                }
            } catch (modelErr) {
                console.error(`Error exporting model ${name}:`, modelErr);
                // Continue to next model so one failure doesn't kill the whole export
            }
        }

        console.log('Finalizing workbook...');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=school_data.xlsx');

        await workbook.xlsx.write(res);
        console.log('Export response sent.');
        res.end();

    } catch (error) {
        console.error('Fatal Export error:', error);
        // If headers not sent, send json error
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error exporting data', error });
        }
    }
};

export const importData = async (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get import mode: 'skip' | 'update' | 'duplicate'
    const mode = req.body.mode || 'update';
    console.log(`Import mode: ${mode}`);

    const t = await sequelize.transaction();

    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer as any);

        // Disable foreign key checks for bulk import to avoid ordering issues if strict order isn't perfect
        // However, standard SQL way is: SET FOREIGN_KEY_CHECKS = 0;
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction: t });

        for (const { name, model } of MODELS_IMPORT_ORDER) {
            const sheet = workbook.getWorksheet(name);
            if (sheet) {
                const records: any[] = [];
                // ExcelJS iterates 1-based. Row 1 is header.
                const headers: string[] = [];

                sheet.getRow(1).eachCell((cell, colNumber) => {
                    headers[colNumber] = cell.text;
                });

                sheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return; // Skip header
                    const record: any = {};
                    row.eachCell((cell, colNumber) => {
                        const header = headers[colNumber];
                        if (header) {
                            // Handle potential date conversions or JSON parsing if needed
                            // ExcelJS might return an object for rich text or formula. We want value.
                            let value = cell.value;

                            // Simple text handling. For complex types, might need more checks.
                            if (typeof value === 'object' && value !== null && 'text' in value) {
                                value = (value as any).text;
                            }

                            record[header] = value;
                        }
                    });
                    records.push(record);
                });

                if (records.length > 0) {
                    console.log(`Importing ${records.length} records for ${name} with mode: ${mode}`);

                    if (mode === 'duplicate') {
                        // For duplicate mode: Remove IDs to let database generate new ones
                        records.forEach(r => {
                            delete r.id;
                            // Also remove createdAt/updatedAt to let DB handle them
                            delete r.createdAt;
                            delete r.updatedAt;
                        });
                        await (model as any).bulkCreate(records, { transaction: t });
                    } else if (mode === 'skip') {
                        // For skip mode: Ignore duplicates based on primary key
                        await (model as any).bulkCreate(records, {
                            ignoreDuplicates: true,
                            transaction: t
                        });
                    } else { // 'update' mode (default)
                        // For update mode: Update existing records with same ID
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
    const t = await sequelize.transaction();

    try {
        // Disable FK checks to truncate tables freely
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction: t });

        // Reverse order is safer usually, but with FK checks off, it doesn't matter much.
        // We use the same list.
        for (const { model } of MODELS_IMPORT_ORDER) {
            await (model as any).destroy({ where: {}, truncate: true, transaction: t });
        }

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction: t });
        await t.commit();

        // Optional: Re-seed default settings or admin user if needed? 
        // The user said "vider la base de données". Usually implies a fresh state. 
        // We might want to keep the Admin user so they don't get locked out?
        // Requirement says "Supprimer... formater toutes les donnees". 
        // I will strictly follow that. If they delete everything, they might need to use 'create-admin' script again or register.
        // But for safety, let's assume they want a clean slate.

        res.json({ message: 'Database reset successfully' });

    } catch (error) {
        await t.rollback();
        console.error('Reset error:', error);
        res.status(500).json({ message: 'Error resetting data', error });
    }
};
