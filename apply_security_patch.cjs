const fs = require('fs');
const path = require('path');
const serverPath = path.join(__dirname, 'server.js');

let srvContent = fs.readFileSync(serverPath, 'utf8');

const targetStr = `  const { table, filters = {}, ilikeCol, ilikeVal, insertData, updateData, isDelete, isUpsert, orderCol, orderAsc, isSingle } = req.body;

  try {`;

const replacement = `  const { table, filters = {}, ilikeCol, ilikeVal, insertData, updateData, isDelete, isUpsert, orderCol, orderAsc, isSingle } = req.body;

  try {
    const isMutation = isDelete || updateData || insertData || isUpsert;
    if (isMutation) {
        const role = req.user ? req.user.role : 'viewer';
        
        // Privilege Escalation Prevention
        if (table === 'authorized_users' && role !== 'superadmin') {
            return res.status(403).json({ error: 'Acesso negado: Apenas Super Admins podem modificar contas de usuários.' });
        }
        
        // Protect Vault and Audit logs from generic modifications
        const readOnlyTables = ['audit_logs', 'vault_secrets', 'vault_projects'];
        if (readOnlyTables.includes(table)) {
            return res.status(403).json({ error: 'Operação não permitida via API genérica.' });
        }
        
        // Mass Delete Prevention
        if (isDelete && Object.keys(filters).length === 0) {
            return res.status(400).json({ error: 'Exclusão em massa bloqueada. Forneça um filtro.' });
        }
    }`;

if (srvContent.includes(targetStr)) {
    srvContent = srvContent.replace(targetStr, replacement);
    console.log('[Security Patch] Whitelist e bloqueio de exclusão em massa aplicados em /api/db');
} else {
    console.log('[Security Patch] Rota /api/db não encontrada ou já modificada.');
}

// Remover senhas hardcoded se existirem (pode ser que já não existam mais no seu código)
srvContent = srvContent.replace(/VNC_PASSWORD\s*\|\|\s*['"]eav@2017['"]/g, 'process.env.VNC_PASSWORD');
srvContent = srvContent.replace(/Buffer\.from\(['"]Demo:Y7R8EM['"]\)/g, 'Buffer.from(process.env.DEMO_CREDENTIALS || "")');

// A correção do convertPlaceholders não é mais necessária, pois o SQL Parameterized 
// já garante a segurança nativa. O que precisava ser feito era bloquear as tabelas (feito acima).

fs.writeFileSync(serverPath, srvContent, 'utf8');
