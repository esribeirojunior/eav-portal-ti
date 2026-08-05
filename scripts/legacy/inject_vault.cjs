const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'server.js');
let content = fs.readFileSync(serverFile, 'utf8');

// 1. Add VAULT_MASTER_KEY logic
const vaultKeyLogic = `
// --- VAULT MASTER KEY ---
let VAULT_MASTER_KEY = process.env.VAULT_MASTER_KEY;
if (!VAULT_MASTER_KEY) {
    console.log('[Vault] VAULT_MASTER_KEY não encontrada. Gerando uma nova chave...');
    VAULT_MASTER_KEY = crypto.randomBytes(32).toString('hex');
    const envPath = path.join(__dirname, '.env');
    fs.appendFileSync(envPath, '\\nVAULT_MASTER_KEY=' + VAULT_MASTER_KEY + '\\n');
    process.env.VAULT_MASTER_KEY = VAULT_MASTER_KEY;
}

// Criptografia AES-256-GCM para o Cofre
function encryptSecret(text) {
    const iv = crypto.randomBytes(12); // GCM recomendado 12 bytes
    const key = crypto.createHash('sha256').update(String(VAULT_MASTER_KEY)).digest('base64').substr(0, 32);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return iv.toString('hex') + ':' + authTag + ':' + encrypted;
}

function decryptSecret(encryptedData) {
    try {
        const parts = encryptedData.split(':');
        if (parts.length !== 3) return null;
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        const key = crypto.createHash('sha256').update(String(VAULT_MASTER_KEY)).digest('base64').substr(0, 32);
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        console.error('[Vault] Erro ao descriptografar:', err);
        return null;
    }
}
`;

if (!content.includes('VAULT_MASTER_KEY')) {
    content = content.replace('// --- POSTGRES DATABASE SYSTEM ---', vaultKeyLogic + '\n// --- POSTGRES DATABASE SYSTEM ---');
}

// 2. Add Table creation
if (!content.includes('vault_projects')) {
    const tableCreation = `CREATE TABLE IF NOT EXISTS vault_projects (id TEXT PRIMARY KEY, name TEXT, created_at TEXT);
      CREATE TABLE IF NOT EXISTS vault_secrets (id TEXT PRIMARY KEY, key_name TEXT, encrypted_value TEXT, note TEXT, project_id TEXT, created_at TEXT);
      CREATE TABLE IF NOT EXISTS authorized_users`;
    content = content.replace('CREATE TABLE IF NOT EXISTS authorized_users', tableCreation);
}

// 3. Add API Routes
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
        const id = crypto.randomUUID();
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
        // Descriptografa os valores antes de enviar para o frontend logado
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
        const id = crypto.randomUUID();
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

if (!content.includes('/api/vault/projects')) {
    content = content.replace('// Inicia o servidor', vaultRoutes + '\n// Inicia o servidor');
}

fs.writeFileSync(serverFile, content, 'utf8');
console.log('server.js atualizado com o Cofre Local Seguro');
