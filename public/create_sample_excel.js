const XLSX = require('xlsx');

// Sample data
const data = [
    ['Year', 'Week', 'Payer', 'EM Group', '% of Total Payments', 'Avg. Chart E/M Weight', 'Charge Amount', 'Collection %', 'Total Payments', 'Visit Count', 'Visits with Lab Count'],
    [2024, 1, '2-BCBS', 'Group A', 0.25, 1.2, 1000, 0.85, 850, 10, 2],
    [2024, 1, '17-AETNA', 'Group A', 0.30, 1.1, 1200, 0.80, 960, 12, 3],
    [2024, 2, '2-BCBS', 'Group A', 0.22, 1.3, 1100, 0.82, 902, 11, 2],
    [2024, 2, '17-AETNA', 'Group A', 0.28, 1.0, 1300, 0.78, 1014, 13, 3],
    [2024, 3, '2-BCBS', 'Group A', 0.24, 1.2, 1050, 0.84, 882, 9, 2],
    [2024, 3, '17-AETNA', 'Group A', 0.29, 1.1, 1250, 0.81, 1012, 12, 3],
    [2024, 4, '2-BCBS', 'Group A', 0.23, 1.3, 1150, 0.83, 954, 11, 2],
    [2024, 4, '17-AETNA', 'Group A', 0.27, 1.0, 1350, 0.79, 1066, 13, 3],
    [2024, 5, '2-BCBS', 'Group A', 0.26, 1.2, 1200, 0.86, 1032, 12, 2],
    [2024, 5, '17-AETNA', 'Group A', 0.31, 1.1, 1400, 0.82, 1148, 14, 3]
];

// Create a new workbook
const workbook = XLSX.utils.book_new();

// Convert data to worksheet
const worksheet = XLSX.utils.aoa_to_sheet(data);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Revenue Data');

// Write to file
XLSX.writeFile(workbook, 'public/sample_data.xlsx');

console.log('Sample Excel file created successfully!'); 