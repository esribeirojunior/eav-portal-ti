const fs = require('fs');
const glob = require('fs').readdirSync;
const path = require('path');

const NEW_BG_DEEP = 'slate-950'; // #020617 - Midnight Blue deep
const NEW_BG_CARD = 'slate-900'; // #0f172a - Midnight Blue card

function replaceColors(filePath) {
    if (!fs.existsSync(filePath)) return;
    let txt = fs.readFileSync(filePath, 'utf-8');
    
    // Backgrounds
    txt = txt.replace(/dark:bg-\[\#0c0d21\]/g, `dark:bg-${NEW_BG_DEEP}`);
    txt = txt.replace(/dark:bg-\[\#12132a\]/g, `dark:bg-${NEW_BG_CARD}`);
    txt = txt.replace(/dark:bg-\[\#14152e\]/g, `dark:bg-${NEW_BG_CARD}`);
    txt = txt.replace(/dark:bg-\[\#1a1b36\]/g, `dark:bg-slate-800`);
    
    // Borders
    txt = txt.replace(/dark:border-white\/5/g, `dark:border-slate-800`);
    txt = txt.replace(/dark:border-white\/10/g, `dark:border-slate-700`);
    
    fs.writeFileSync(filePath, txt);
    console.log(`Updated colors in ${filePath}`);
}

const files = [
    'App.tsx',
    'components/Dashboard.tsx',
    'components/DeviceList.tsx',
    'components/ModuleSelector.tsx'
];

files.forEach(replaceColors);

// Also update index.html to reflect the same midnight blue vibe
let indexTxt = fs.readFileSync('index.html', 'utf-8');
indexTxt = indexTxt.replace(/--bg-deep: #0c0d21;/g, '--bg-deep: #020617;');
indexTxt = indexTxt.replace(/--bg-card: #14152e;/g, '--bg-card: #0f172a;');
indexTxt = indexTxt.replace(/background-color: #0c0d21 !important;/g, 'background-color: #020617 !important;');
fs.writeFileSync('index.html', indexTxt);
console.log('Updated index.html colors');
