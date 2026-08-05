const fs = require('fs');
const path = require('path');

// 1. Corrigir server.js
const serverFile = path.join(__dirname, 'server.js');
let serverContent = fs.readFileSync(serverFile, 'utf8');

const vaultRoutes = `
// --- VAULT API ROUTES ---
app.get('/api/vault/projects', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM vault_projects ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/vault/projects', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        const id = require('crypto').randomUUID();
        const created_at = new Date().toISOString();
        await pool.query('INSERT INTO vault_projects (id, name, created_at) VALUES ($1, $2, $3)', [id, name, created_at]);
        res.json({ id, name, created_at });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/vault/secrets', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, key_name as key, note, project_id, encrypted_value, created_at FROM vault_secrets ORDER BY key_name ASC');
        const secrets = result.rows.map(row => ({
            id: row.id,
            key: row.key,
            note: row.note,
            projectIds: row.project_id ? [row.project_id] : [],
            value: decryptSecret(row.encrypted_value) || 'ERRO_DESCRIPTOGRAFIA',
            created_at: row.created_at
        }));
        res.json(secrets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/vault/secrets', authenticateToken, async (req, res) => {
    try {
        const { key, value, note, projectId } = req.body;
        const id = require('crypto').randomUUID();
        const encryptedValue = encryptSecret(value);
        const created_at = new Date().toISOString();
        
        await pool.query(
            'INSERT INTO vault_secrets (id, key_name, encrypted_value, note, project_id, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
            [id, key, encryptedValue, note, projectId, created_at]
        );
        res.json({ id, key, value, note, projectIds: [projectId] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/vault/secrets/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM vault_secrets WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
`;

if (!serverContent.includes('/api/vault/projects')) {
    serverContent = serverContent.replace('// Rota catch-all para o React SPA', vaultRoutes + '\n// Rota catch-all para o React SPA');
    fs.writeFileSync(serverFile, serverContent, 'utf8');
    console.log('[Fix] server.js atualizado com as rotas do cofre.');
}

// 2. Ajustar Contraste no VaultModule.tsx
const vaultFile = path.join(__dirname, 'components', 'VaultModule.tsx');
let vaultContent = fs.readFileSync(vaultFile, 'utf8');

// Escurecer um pouco os textos do light mode
vaultContent = vaultContent.replace(/text-slate-400 dark:text-white\/20/g, 'text-slate-600 dark:text-white/20');
vaultContent = vaultContent.replace(/text-slate-400 dark:text-white\/10/g, 'text-slate-600 dark:text-white/10');
vaultContent = vaultContent.replace(/text-slate-500 dark:text-white\/40/g, 'text-slate-700 dark:text-white/40');
vaultContent = vaultContent.replace(/text-slate-500 dark:text-white\/30/g, 'text-slate-700 dark:text-white/30');
vaultContent = vaultContent.replace(/bg-white dark:bg-slate-900\/60/g, 'bg-white shadow-md border-slate-300 dark:bg-slate-900/60 dark:shadow-none dark:border-white/5');
vaultContent = vaultContent.replace(/bg-slate-50 dark:bg-white\/5/g, 'bg-white shadow-sm border-slate-300 dark:bg-white/5 dark:shadow-none dark:border-white/10');

fs.writeFileSync(vaultFile, vaultContent, 'utf8');
console.log('[Fix] VaultModule.tsx atualizado com melhor contraste no modo claro.');

