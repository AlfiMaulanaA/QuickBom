const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../data/Material_Raw.xlsx');
const workbook = XLSX.readFile(filePath);

function getMaterialKey(row) {
    if (!row || row.length < 5) return null;
    // We expect row to have [mfr, part_num, part_num_gspe, part_name, part_desc, ...]
    // But some rows might be titles or empty. 
    // A material row should have a part_name or part_desc.
    const partNum = String(row[1] || '').trim();
    const partName = String(row[3] || '').trim();
    const partDesc = String(row[4] || '').trim();

    if (!partName && !partDesc) return null;

    return `${partNum}|${partName}|${partDesc}`;
}

const bomMaterials = new Map();
const otherMaterials = new Map();

// 1. Process BOM
const bomSheet = workbook.Sheets['BOM'];
const bomData = XLSX.utils.sheet_to_json(bomSheet, { header: 1 });
for (let i = 1; i < bomData.length; i++) {
    const key = getMaterialKey(bomData[i]);
    if (key) {
        bomMaterials.set(key, bomData[i]);
    }
}

// 2. Process others
const sheetsToCompare = ['MAIN COMPONENT', 'DOOR', 'CEILING', 'INSTALASI'];
sheetsToCompare.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    data.forEach(row => {
        const key = getMaterialKey(row);
        if (key) {
            if (!otherMaterials.has(key)) {
                otherMaterials.set(key, { sheetName, row });
            }
        }
    });
});

console.log(`Total materials in BOM: ${bomMaterials.size}`);
console.log(`Total unique materials in other sheets: ${otherMaterials.size}`);

const unusedMaterials = [];
for (const [key, data] of bomMaterials) {
    if (!otherMaterials.has(key)) {
        unusedMaterials.push(data);
    }
}

console.log(`\nMaterials in BOM NOT used in other sheets (${unusedMaterials.length}):`);
if (unusedMaterials.length > 0) {
    unusedMaterials.forEach((m, i) => {
        console.log(`${i + 1}. PN: ${m[1]} | Name: ${m[3]} | Desc: ${m[4]}`);
    });
} else {
    console.log('All materials from BOM are used in other sheets.');
}
