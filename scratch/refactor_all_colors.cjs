const fs = require('fs');
const path = require('path');

const NEW_BG_DEEP = 'slate-950'; // #020617
const NEW_BG_CARD = 'slate-900'; // #0f172a

function replaceColorsInFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let txt = fs.readFileSync(filePath, 'utf-8');
    
    // Backgrounds (including non-dark: variations for modules that are strictly dark mode)
    txt = txt.replace(/bg-\[\#0c0d21\]/g, `bg-${NEW_BG_DEEP}`);
    txt = txt.replace(/bg-\[\#12132a\]/g, `bg-${NEW_BG_CARD}`);
    txt = txt.replace(/bg-\[\#14152e\]/g, `bg-${NEW_BG_CARD}`);
    txt = txt.replace(/bg-\[\#1a1b36\]/g, `bg-slate-800`);
    
    // Sometimes they are wrapped in dark:
    txt = txt.replace(/dark:bg-\[\#0c0d21\]/g, `dark:bg-${NEW_BG_DEEP}`);
    txt = txt.replace(/dark:bg-\[\#12132a\]/g, `dark:bg-${NEW_BG_CARD}`);
    txt = txt.replace(/dark:bg-\[\#14152e\]/g, `dark:bg-${NEW_BG_CARD}`);
    txt = txt.replace(/dark:bg-\[\#1a1b36\]/g, `dark:bg-slate-800`);
    
    fs.writeFileSync(filePath, txt);
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            replaceColorsInFile(fullPath);
        }
    }
}

// Replace in App.tsx
replaceColorsInFile('App.tsx');
// Replace in all components
walkDir('components');

console.log('All components updated to Midnight Blue palette');
