const fs = require('fs');
const path = require('path');

const moduleSelectorFile = path.join(__dirname, 'components', 'ModuleSelector.tsx');
let content = fs.readFileSync(moduleSelectorFile, 'utf8');

// Sidebar e Textos Menores: Escurecer de 600 para 800 e de 500 para 700
content = content.replace(/text-slate-600/g, 'text-slate-800');
content = content.replace(/text-slate-500/g, 'text-slate-700');

// Módulos no Dashboard
// Os cards já estão com bordas e bg-white, então devem ficar bons com o text-slate-800.

fs.writeFileSync(moduleSelectorFile, content, 'utf8');
console.log('[Fix] ModuleSelector.tsx atualizado com melhor contraste no modo claro.');
