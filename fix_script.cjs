const fs = require('fs');
const file = 'C:\\Users\\erisson.junior\\Desktop\\script novo\\Instalador_Completo.ps1';
let content = fs.readFileSync(file, 'latin1');

content = content.replace(/\$generatedId = \(Get-Random -Minimum 100000000 -Maximum 999999999\)\.ToString\(\)\r?\n\s*/g, '');
content = content.replace(/id = '\$generatedId'\r?\n/g, '');
content = content.replace(/if \(\$generatedId\) \{\r?\n\s*\$rustdeskId = \$generatedId\r?\n\s*Write-Host "\r?\nRustDesk ID injetado com sucesso: \$rustdeskId" -ForegroundColor Green\r?\n\s*\}/g, '');

fs.writeFileSync(file, content, 'latin1');
console.log('Fixed');
