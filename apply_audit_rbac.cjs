const fs = require('fs');
const path = require('path');

// --- 1. Atualizar server.js (Backend) ---
const serverPath = path.join(__dirname, 'server.js');
let srvContent = fs.readFileSync(serverPath, 'utf8');

// Converter ACTIVE_SESSIONS para Map
srvContent = srvContent.replace('const ACTIVE_SESSIONS = new Set();', 'const ACTIVE_SESSIONS = new Map();');
srvContent = srvContent.replace("ACTIVE_SESSIONS.add(token);", "ACTIVE_SESSIONS.set(token, { email: user.email, role: user.role });");

// Modificar authenticateToken para injetar req.user e auditar com segurança
const oldAuthStr = `function authenticateToken(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || '';
  const isLocalhost = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';

  // Permitir acesso irrestrito se a requisição vier do próprio computador (localhost)
  if (isLocalhost) {
    return next();
  }

  // Se vier da rede externa/local (ex: 192.168.x.x), exige token de login
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || !ACTIVE_SESSIONS.has(token)) {
    return res.status(401).json({ error: 'Acesso não autorizado. Por favor, faça login no sistema.' });
  }
  next();
}`;

const newAuthStr = `function authenticateToken(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || '';
  const isLocalhost = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token && ACTIVE_SESSIONS.has(token)) {
    req.user = ACTIVE_SESSIONS.get(token);
    return next();
  } else if (!isLocalhost) {
    return res.status(401).json({ error: 'Acesso não autorizado. Por favor, faça login no sistema.' });
  } else {
    // Fallback para localhost bypass
    req.user = { email: 'localhost@admin', role: 'superadmin' };
    return next();
  }
}`;
srvContent = srvContent.replace(oldAuthStr, newAuthStr);

// Adicionar a rota POST /api/vault/audit
const auditRoute = `
// --- Rota de Auditoria do Cofre ---
app.post('/api/vault/audit', authenticateToken, async (req, res) => {
    try {
        const { action, secret_id, secret_name } = req.body;
        const id = crypto.randomUUID();
        const created_at = new Date().toISOString();
        const user_email = req.user ? req.user.email : 'unknown';
        const details = \`Segredo: \${secret_name || secret_id}\`;
        
        await pool.query(
            'INSERT INTO audit_logs (id, user_email, action, details, resource_type, resource_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [id, user_email, action, details, 'VAULT', secret_id, created_at]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
`;
srvContent = srvContent.replace('// --- VAULT API ROUTES ---', '// --- VAULT API ROUTES ---' + auditRoute);

// RBAC: Bloquear acesso não-superadmin nas rotas de criação/edição/deleção do Vault
srvContent = srvContent.replace(
    "app.post('/api/vault/projects', authenticateToken, async (req, res) => {",
    "app.post('/api/vault/projects', authenticateToken, async (req, res) => {\n    if (req.user && req.user.role !== 'superadmin') return res.status(403).json({ error: 'Apenas Super Admins podem criar projetos.' });"
);

srvContent = srvContent.replace(
    "app.post('/api/vault/secrets', authenticateToken, async (req, res) => {",
    "app.post('/api/vault/secrets', authenticateToken, async (req, res) => {\n    if (req.user && req.user.role !== 'superadmin') return res.status(403).json({ error: 'Apenas Super Admins podem criar segredos.' });"
);

srvContent = srvContent.replace(
    "app.delete('/api/vault/secrets/:id', authenticateToken, async (req, res) => {",
    "app.delete('/api/vault/secrets/:id', authenticateToken, async (req, res) => {\n    if (req.user && req.user.role !== 'superadmin') return res.status(403).json({ error: 'Apenas Super Admins podem excluir segredos.' });"
);
fs.writeFileSync(serverPath, srvContent, 'utf8');


// --- 2. Atualizar VaultModule.tsx (Frontend Log + Esconder botões) ---
const vaultPath = path.join(__dirname, 'components', 'VaultModule.tsx');
let vaultContent = fs.readFileSync(vaultPath, 'utf8');

// Esconder botões de +Projeto e +Segredo se não for superadmin
vaultContent = vaultContent.replace('{isAdmin && (', '{userRole === \'superadmin\' && (');
// Handle Delete button visibility is already checked by isAdmin, but we will change to superadmin explicitly if needed. Wait, isAdmin is defined in App.tsx or VaultModule?
// Ah, `VaultModule` receives `userRole` as prop. It defines: `const isAdmin = userRole === 'admin' || userRole === 'superadmin';`
// Let's replace usages of `isAdmin` with `userRole === 'superadmin'` for critical vault buttons.
vaultContent = vaultContent.replace(
    /{isAdmin && \(\s*<button onClick=\{\(\) => setIsProjectModalOpen\(true\)\}/g,
    "{userRole === 'superadmin' && (\n                    <button onClick={() => setIsProjectModalOpen(true)}"
);
vaultContent = vaultContent.replace(
    /{isAdmin && \(\s*<button onClick=\{\(\) => setIsSecretModalOpen\(true\)\}/g,
    "{userRole === 'superadmin' && (\n            <button onClick={() => setIsSecretModalOpen(true)}"
);
// E lixeira
vaultContent = vaultContent.replace(
    /{isAdmin && \(\s*<button \s*onClick=\{\(\) => handleDeleteSecret/g,
    "{userRole === 'superadmin' && (\n                            <button \n                              onClick={() => handleDeleteSecret"
);

// Adicionar a função de chamar o Audit no toggleVisibility e copyToClipboard
const auditFn = `
  const logVaultAction = async (action: string, secretId: string, secretKey: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch('/api/vault/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? \`Bearer \${token}\` : '' },
        body: JSON.stringify({ action, secret_id: secretId, secret_name: secretKey })
      });
    } catch (e) {
      console.error('Falha ao registrar auditoria', e);
    }
  };
`;
vaultContent = vaultContent.replace('const copyToClipboard = (text: string, type: string) => {', auditFn + '\n  const copyToClipboard = (text: string, type: string, secretId?: string, secretKey?: string) => {\n    if (secretId && secretKey) logVaultAction(\'COPY_SECRET\', secretId, secretKey);');

// Change calls to copyToClipboard inside VaultModule
vaultContent = vaultContent.replace(/copyToClipboard\(secret\.value, 'Segredo'\)/g, "copyToClipboard(secret.value, 'Segredo', secret.id, secret.key)");

// toggleVisibility
vaultContent = vaultContent.replace(
    'const toggleVisibility = (id: string) => {\n    setVisibleSecrets(prev => ({ ...prev, [id]: !prev[id] }));\n  };',
    `const toggleVisibility = (id: string, keyName: string) => {
    setVisibleSecrets(prev => {
        const isRevealing = !prev[id];
        if (isRevealing) logVaultAction('VIEW_SECRET', id, keyName);
        return { ...prev, [id]: isRevealing };
    });
  };`
);
// Update call in render
vaultContent = vaultContent.replace(/onClick=\{\(\) => toggleVisibility\(secret\.id\)\}/g, "onClick={() => toggleVisibility(secret.id, secret.key)}");

fs.writeFileSync(vaultPath, vaultContent, 'utf8');


// --- 3. Atualizar ModuleSelector.tsx (Esconder o card do Cofre para viewer) ---
const modSelectorPath = path.join(__dirname, 'components', 'ModuleSelector.tsx');
let modContent = fs.readFileSync(modSelectorPath, 'utf8');
modContent = modContent.replace(
    /hasModule\('vault'\) && \(/g,
    "hasModule('vault') && userRole !== 'viewer' && ("
);
fs.writeFileSync(modSelectorPath, modContent, 'utf8');

console.log('[Fix] RBAC e Auditoria do Cofre aplicados com sucesso.');
