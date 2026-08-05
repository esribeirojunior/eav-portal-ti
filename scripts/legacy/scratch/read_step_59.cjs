const fs = require('fs');

const file = 'C:\\Users\\erisson.junior\\.gemini\\antigravity-ide\\brain\\00caf5a6-8bec-40df-8de5-b1ed494d0d7a\\scratch\\app_step_59.tsx';

if (!fs.existsSync(file)) {
  console.log("File not found");
  process.exit(1);
}

const lines = fs.readFileSync(file, 'utf8').split('\n');

const startLine = 90;
const endLine = 300;

let result = [];
for (let i = startLine - 1; i < Math.min(endLine, lines.length); i++) {
  result.push(lines[i]);
}

fs.writeFileSync('scratch/output_step_59.txt', result.join('\n'));
console.log("Wrote scratch/output_step_59.txt");
