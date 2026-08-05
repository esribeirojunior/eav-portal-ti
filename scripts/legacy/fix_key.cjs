const fs = require('fs');
const file = 'C:\\Users\\erisson.junior\\Desktop\\script novo\\Instalador_Completo.ps1';
let content = fs.readFileSync(file, 'latin1');

// We will force both keys to be the first one
const keyToUse = 'rDbatE1DhL2xDc9VySqRkRmpveTb00wuM2lQv3ScyQ=';

content = content.replace(/key = 'rDbatElDhL2xDc9vySqRkRmRpv0tb0BwuM21Qv3ScyQ='/g, `key = '${keyToUse}'`);

fs.writeFileSync(file, content, 'latin1');
console.log('Key unified');
