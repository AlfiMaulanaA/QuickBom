const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../data/Material_Raw.xlsx');
const workbook = XLSX.readFile(filePath);

function getMaterialKey(row) {
    if (!row || row.length < 5) return null;

    // Check if it's a valid data row (part_num usually looks like a code or number)
    // A title row usually has 1 element or very sparse.
    const partNum = String(row[1] || '').trim();
    const partName = String(row[3] || '').trim();
    const partDesc = String(row[4] || '').trim();

    if (!partName && !partDesc) return null;
    if (partName === 'part_name' && partDesc === 'part_desc') return null; // skip headers if any

    return `${partNum}|${partName}|${partDesc}`;
}

const bomMaterials = new Map();
const sheetMaterials = {};

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
    sheetMaterials[sheetName] = new Set();
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    data.forEach(row => {
        const key = getMaterialKey(row);
        if (key) {
            sheetMaterials[sheetName].add(key);
        }
    });
});

console.log('--- ANALYSIS REPORT ---');
console.log(`Total materials in BOM: ${bomMaterials.size}`);

const allUsedKeys = new Set();
Object.keys(sheetMaterials).forEach(sheetName => {
    const count = sheetMaterials[sheetName].size;
    console.log(`- ${sheetName}: ${count} materials`);
    sheetMaterials[sheetName].forEach(key => allUsedKeys.add(key));
});

const unusedInBOM = [];
for (const [key, data] of bomMaterials) {
    if (!allUsedKeys.has(key)) {
        unusedInBOM.push(data);
    }
}

const extrasInOthers = [];
allUsedKeys.forEach(key => {
    if (!bomMaterials.has(key)) {
        // Find which sheet it belongs to
        let foundSheets = [];
        Object.keys(sheetMaterials).forEach(s => {
            if (sheetMaterials[s].has(key)) foundSheets.push(s);
        });
        extrasInOthers.push({ key, foundSheets });
    }
});

console.log(`\n1. Materials in BOM NOT used in any other sheet (${unusedInBOM.length}):`);
if (unusedInBOM.length > 0) {
    unusedInBOM.forEach((m, i) => {
        console.log(`   [${i + 1}] PN: ${m[1]} | Name: ${m[3]} | Desc: ${m[4]}`);
    });
} else {
    console.log('   (None)');
}

console.log(`\n2. Materials present in other sheets but NOT listed in BOM (${extrasInOthers.length}):`);
if (extrasInOthers.length > 0) {
    extrasInOthers.forEach((item, i) => {
        const parts = item.key.split('|');
        console.log(`   [${i + 1}] PN: ${parts[0]} | Name: ${parts[1]} | Desc: ${parts[2]} (Found in: ${item.foundSheets.join(', ')})`);
    });
} else {
    console.log('   (None)');
}

// Check for overlaps (materials appearing in multiple category sheets)
const overlaps = [];
const keysList = Array.from(allUsedKeys);
keysList.forEach(key => {
    let count = 0;
    let foundSheets = [];
    Object.keys(sheetMaterials).forEach(s => {
        if (sheetMaterials[s].has(key)) {
            count++;
            foundSheets.push(s);
        }
    });
    if (count > 1) {
        overlaps.push({ key, foundSheets });
    }
});

console.log(`\n3. Materials appearing in multiple sheets (${overlaps.length}):`);
if (overlaps.length > 0) {
    overlaps.forEach((item, i) => {
        const parts = item.key.split('|');
        console.log(`   [${i + 1}] PN: ${parts[0]} | Name: ${parts[1]} | Sheets: ${item.foundSheets.join(', ')}`);
    });
} else {
    console.log('   (None)');
}
