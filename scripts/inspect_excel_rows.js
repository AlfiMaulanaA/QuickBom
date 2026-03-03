const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../data/Material_Raw.xlsx');
const workbook = XLSX.readFile(filePath);

workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const rows = data.slice(0, 5);
    rows.forEach((row, i) => {
        console.log(`Row ${i}:`, JSON.stringify(row));
    });
});
