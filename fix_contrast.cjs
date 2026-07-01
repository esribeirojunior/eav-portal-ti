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
    'components/SettingsModule.tsx',
    'components/SignageModule.tsx',
    'components/Copilot.tsx',
    'components/DeviceModal.tsx',
    'components/RmmStatusModal.tsx'
];

for (const file of filesToUpdate) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Increase text contrast for light mode
        content = content.replace(/(?<!dark:)text-slate-600/g, 'text-slate-800');
        content = content.replace(/(?<!dark:)text-slate-500/g, 'text-slate-700');
        content = content.replace(/(?<!dark:)text-slate-400/g, 'text-slate-600');
        
        // Increase border contrast
        content = content.replace(/(?<!dark:)border-slate-200/g, 'border-slate-400');
        content = content.replace(/(?<!dark:)border-slate-300/g, 'border-slate-400');

        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${file}`);
    } else {
        console.log(`File not found: ${file}`);
    }
}
