import ExcelJS from 'exceljs';
import path from 'path';

const inspectExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const filePath = path.join(__dirname, '../test_export.xlsx');

    try {
        await wb.xlsx.readFile(filePath);
        console.log('Successfully read Excel file');
        console.log('Number of sheets:', wb.worksheets.length);
        console.log('Sheet names:', wb.worksheets.map(s => s.name).join(', '));

        wb.worksheets.forEach(sheet => {
            console.log(`\nSheet: ${sheet.name}`);
            console.log(`  Row count: ${sheet.rowCount}`);
            console.log(`  Actual rows: ${sheet.actualRowCount}`);
        });

    } catch (err) {
        console.error('Error reading Excel:', err);
    }
};

inspectExcel();
