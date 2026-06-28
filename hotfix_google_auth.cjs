const fs = require('fs');
const path = require('path');
const serverPath = path.join(__dirname, 'server.js');

let srvContent = fs.readFileSync(serverPath, 'utf8');

// Corrige o bug do ACTIVE_SESSIONS.add no login do Google
if (srvContent.includes('ACTIVE_SESSIONS.add(token);')) {
    srvContent = srvContent.replace('ACTIVE_SESSIONS.add(token);', 'ACTIVE_SESSIONS.set(token, { email: user.email, role: user.role });');
    fs.writeFileSync(serverPath, srvContent, 'utf8');
    console.log('[Hotfix] ACTIVE_SESSIONS.add(token) corrigido para .set() no Google Auth.');
} else {
    console.log('[Hotfix] ACTIVE_SESSIONS.add não encontrado.');
}
