const fs = require('fs');
const data = JSON.parse(fs.readFileSync('app_edits.json', 'utf8'));
const edit = data.find(d => d.step === 2919);
const chunks = JSON.parse(edit.chunks);
fs.writeFileSync('sidebar_code.txt', chunks[2].ReplacementContent);
