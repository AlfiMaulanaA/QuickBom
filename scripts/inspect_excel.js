const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../data/Material_Raw.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Sheets:', workbook.SheetNames);

workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (data.length > 0) {
        console.log(`\nSheet: ${sheetName}`);
        console.log('Headers:', data[0]);
    }
});
