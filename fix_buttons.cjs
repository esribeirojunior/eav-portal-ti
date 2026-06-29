const fs = require('fs');
const path = require('path');

// 1. ModuleSelector.tsx
const modSelectorPath = path.join(__dirname, 'components', 'ModuleSelector.tsx');
let modContent = fs.readFileSync(modSelectorPath, 'utf8');

// Regex para remover o botão "..."
const buttonRegex = /\{\/\*\s*Opções extras no topo direito\s*\(placeholder do mockup\)\s*\*\/\}\s*<button[\s\S]*?<span[\s\S]*?\.{3}<\/span>\s*<\/button>/;
modContent = modContent.replace(buttonRegex, '');
fs.writeFileSync(modSelectorPath, modContent, 'utf8');


// 2. App.tsx
const appPath = path.join(__dirname, 'App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');

const appLogoutBtn = `Módulos
                </button>
                <button onClick={handleLogout} className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:border-rose-300 dark:hover:border-rose-500/30 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest group shadow-sm">
                  <LogOut size={14} /> Sair
                </button>
              </div>
            </aside>`;

if (!appContent.includes('<LogOut size={14} /> Sair')) {
    appContent = appContent.replace(/Módulos\s*<\/button>\s*<\/div>\s*<\/aside>/, appLogoutBtn);
}

// Pass onLogout to VaultModule
appContent = appContent.replace(
    /<VaultModule\s*userEmail=\{userEmail\}\s*onBack=\{\(\) => setCurrentModule\('selector'\)\}\s*\/>/,
    `<VaultModule\n          userEmail={userEmail}\n          onBack={() => setCurrentModule('selector')}\n          onLogout={handleLogout}\n        />`
);

fs.writeFileSync(appPath, appContent, 'utf8');


// 3. VaultModule.tsx
const vaultPath = path.join(__dirname, 'components', 'VaultModule.tsx');
let vaultContent = fs.readFileSync(vaultPath, 'utf8');

vaultContent = vaultContent.replace(/export default function VaultModule\(\{ userEmail, onBack \}: any\) \{/, 'export default function VaultModule({ userEmail, onBack, onLogout }: any) {');

if (!vaultContent.includes(', LogOut')) {
    vaultContent = vaultContent.replace(/ShieldCheck,\s*Search,/, 'ShieldCheck, Search, LogOut,');
}

const vaultLogoutBtn = `Armazenamento criptografado no banco de dados local com AES-256.
          </p>
        </div>
        <button onClick={onLogout} className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 hover:border-rose-300 dark:hover:border-rose-500/30 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
          <LogOut size={14} /> Sair
        </button>
      </div>`;

if (!vaultContent.includes('<LogOut size={14} /> Sair')) {
    vaultContent = vaultContent.replace(/Armazenamento criptografado no banco de dados local com AES-256\.\s*<\/p>\s*<\/div>\s*<\/div>/, vaultLogoutBtn);
}

fs.writeFileSync(vaultPath, vaultContent, 'utf8');

console.log('[Fix] Botões atualizados');
