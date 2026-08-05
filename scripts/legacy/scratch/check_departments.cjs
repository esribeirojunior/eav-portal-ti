const XLSX = require('xlsx');
const path = require('path');

const EXCEL_PATH = path.join(__dirname, '..', 'data', 'inventario.xlsx');
try {
  const wb = XLSX.readFile(EXCEL_PATH);
  const sheet = wb.Sheets['assignments'];
  if (!sheet) {
    console.log('No assignments sheet found');
    process.exit(1);
  }
  const data = XLSX.utils.sheet_to_json(sheet);
  const departments = new Set();
  const departmentIds = new Set();
  
  // Let's also see what columns we have in assignments
  if (data.length > 0) {
    console.log('Keys in assignments:', Object.keys(data[0]));
  }
  
  data.forEach(row => {
    if (row.department_id) {
      departmentIds.add(row.department_id);
    }
  });

  // Let's see the department sheet
  const deptSheet = wb.Sheets['department'];
  if (deptSheet) {
    const deptData = XLSX.utils.sheet_to_json(deptSheet);
    console.log('\nDepartments sheet contents:');
    console.log(deptData);
  }

  console.log('\nUnique department IDs in assignments:', Array.from(departmentIds));
} catch (err) {
  console.error(err);
}
