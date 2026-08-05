const fs = require('fs');
const filePath = 'components/TasksModule.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/Gest.*?o de Chamados/g, 'Gestão de Chamados');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed Gestao');
