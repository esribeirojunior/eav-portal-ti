const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'App.tsx',
    'components/Dashboard.tsx',
    'components/DeviceList.tsx',
    'components/ModuleSelector.tsx',
    'components/LinksModule.tsx',
    'components/DevLabModule.tsx',
    'components/EmployeesModule.tsx',
    'components/TasksModule.tsx',
    'components/VaultModule.tsx',
    'components/SettingsModule.tsx'
];

for (const file of filesToUpdate) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Backgrounds
        content = content.replace(/bg-\[#f4f7fc\]/g, 'bg-slate-100');
        
        // Borders
        content = content.replace(/border-slate-200(\/80)?/g, 'border-slate-300');
        
        // Texts
        content = content.replace(/text-slate-500/g, 'text-slate-600');
        content = content.replace(/text-slate-400/g, 'text-slate-500');
        
        // Card Backgrounds from bg-white/50 -> bg-white
        content = content.replace(/bg-white\/50/g, 'bg-white');

        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${file}`);
    } else {
        console.log(`File not found: ${file}`);
    }
}
