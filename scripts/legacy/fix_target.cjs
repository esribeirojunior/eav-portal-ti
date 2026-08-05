const fs = require('fs');
let content = fs.readFileSync('target.txt', 'utf8');
content = content.replace(/\\\$\{/g, '${');
fs.writeFileSync('target.txt', content);
console.log('Fixed target.txt');
