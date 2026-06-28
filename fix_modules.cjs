const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'components/TasksModule.tsx',
    'components/VaultModule.tsx',
    'components/TutorialsModule.tsx'
];

for (const file of filesToUpdate) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Backgrounds
        content = content.replace(/bg-slate-950/g, 'bg-slate-100 dark:bg-slate-950');
        content = content.replace(/bg-\[#1a1b3b\]/g, 'bg-white dark:bg-[#1a1b3b]');
        content = content.replace(/bg-black\/20/g, 'bg-slate-200 dark:bg-black/20');
        content = content.replace(/bg-black\/40/g, 'bg-white dark:bg-black/40');
        content = content.replace(/bg-black\/80/g, 'bg-slate-900/60 dark:bg-black/80');
        
        // bg-white/x 
        content = content.replace(/bg-white\/5/g, 'bg-white dark:bg-white/5');
        content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-slate-50 dark:bg-white/[0.02]');
        content = content.replace(/bg-white\/\[0\.04\]/g, 'bg-slate-200 dark:bg-white/[0.04]');
        content = content.replace(/hover:bg-white\/5/g, 'hover:bg-slate-200 dark:hover:bg-white/5');
        content = content.replace(/hover:bg-white\/10/g, 'hover:bg-slate-200 dark:hover:bg-white/10');
        content = content.replace(/hover:bg-white\/\[0\.04\]/g, 'hover:bg-slate-200 dark:hover:bg-white/[0.04]');

        // Borders
        content = content.replace(/border-white\/5/g, 'border-slate-300 dark:border-white/5');
        content = content.replace(/border-white\/10/g, 'border-slate-300 dark:border-white/10');
        
        // Texts
        // We replace specific opacities first
        content = content.replace(/text-white\/10/g, 'text-slate-400 dark:text-white/10');
        content = content.replace(/text-white\/20/g, 'text-slate-400 dark:text-white/20');
        content = content.replace(/text-white\/30/g, 'text-slate-500 dark:text-white/30');
        content = content.replace(/text-white\/40/g, 'text-slate-500 dark:text-white/40');
        content = content.replace(/text-white\/50/g, 'text-slate-500 dark:text-white/50');
        content = content.replace(/text-white\/60/g, 'text-slate-600 dark:text-white/60');
        content = content.replace(/text-white\/70/g, 'text-slate-700 dark:text-white/70');
        content = content.replace(/text-white\/80/g, 'text-slate-800 dark:text-white/80');
        
        // Then text-white
        content = content.replace(/text-white(?![\/\w])/g, 'text-slate-900 dark:text-white');
        
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${file}`);
    } else {
        console.log(`File not found: ${file}`);
    }
}
