import * as XLSX from 'xlsx';

/**
 * Exports data to an Excel file (.xlsx)
 * @param data Array of arrays representing the rows and columns
 * @param filename Name of the file without extension
 * @param sheetName Optional name for the worksheet
 */
export function exportToExcel(
  data: any[][],
  filename: string,
  sheetName: string = 'Sheet1'
): void {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Create worksheet from array of arrays
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Auto-size columns (simple approximation)
  const colWidths = data[0]?.map((_, colIndex) => {
    let maxLen = 0;
    data.forEach(row => {
      const cellValue = row[colIndex];
      const cellLen = cellValue ? String(cellValue).length : 0;
      if (cellLen > maxLen) maxLen = cellLen;
    });
    return { wch: Math.min(maxLen + 2, 50) }; // Cap width at 50 chars
  }) || [];

  ws['!cols'] = colWidths;

  // Append worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Write file
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Reads data from an Excel file
 * @param file The file object from input change event
 * @returns A promise that resolves to an array of objects
 */
export function readFromExcel<T = any>(file: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as T[];
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
}
