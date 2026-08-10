import express from 'express';
import crypto from 'crypto';

// Rotas do cofre de senhas (/api/vault/*). Criacao/exclusao de segredos e
// projetos exigem superadmin. Valores sao cifrados/decifrados via
// encryptSecret/decryptSecret (injetados). Montado em /api/vault.
export function createVaultRouter({ pool, authenticateToken, encryptSecret, decryptSecret }) {
  const router = express.Router();

  // POST /api/vault/audit -- registra visualizacao/copia de segredo.
  router.post('/audit', authenticateToken, async (req, res) => {
    try {
      const { action, secret_id, secret_name } = req.body;
      const id = crypto.randomUUID();
      const created_at = new Date().toISOString();
      const user_email = req.user ? req.user.email : 'unknown';
      const details = `Segredo: ${secret_name || secret_id}`;

      await pool.query(
        'INSERT INTO audit_logs (id, user_email, action, details, resource_type, resource_id, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [id, user_email, action, details, 'VAULT', secret_id, created_at]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/vault/projects
  router.get('/projects', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM vault_projects ORDER BY name ASC');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/vault/projects (superadmin)
  router.post('/projects', authenticateToken, async (req, res) => {
    if (req.user && req.user.role !== 'superadmin')
      return res.status(403).json({ error: 'Apenas Super Admins podem criar projetos.' });
    try {
      const { name } = req.body;
      const id = crypto.randomUUID();
      const created_at = new Date().toISOString();
      await pool.query('INSERT INTO vault_projects (id, name, created_at) VALUES ($1, $2, $3)', [
        id,
        name,
        created_at,
      ]);
      res.json({ id, name, created_at });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/vault/secrets -- retorna segredos decifrados.
  router.get('/secrets', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, key_name as key, note, project_id, encrypted_value, created_at FROM vault_secrets ORDER BY key_name ASC'
      );
      const secrets = result.rows.map((row) => ({
        id: row.id,
        key: row.key,
        note: row.note,
        projectIds: row.project_id ? [row.project_id] : [],
        value: decryptSecret(row.encrypted_value) || 'ERRO_DESCRIPTOGRAFIA',
        created_at: row.created_at,
      }));
      res.json(secrets);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/vault/secrets (superadmin)
  router.post('/secrets', authenticateToken, async (req, res) => {
    if (req.user && req.user.role !== 'superadmin')
      return res.status(403).json({ error: 'Apenas Super Admins podem criar segredos.' });
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

  // DELETE /api/vault/secrets/:id (superadmin)
  router.delete('/secrets/:id', authenticateToken, async (req, res) => {
    if (req.user && req.user.role !== 'superadmin')
      return res.status(403).json({ error: 'Apenas Super Admins podem excluir segredos.' });
    try {
      await pool.query('DELETE FROM vault_secrets WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/vault/projects/:id (superadmin) -- apaga projeto + seus segredos.
  router.delete('/projects/:id', authenticateToken, async (req, res) => {
    if (req.user && req.user.role !== 'superadmin')
      return res.status(403).json({ error: 'Apenas Super Admins podem excluir projetos.' });
    try {
      await pool.query('DELETE FROM vault_secrets WHERE project_id = $1', [req.params.id]);
      await pool.query('DELETE FROM vault_projects WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
