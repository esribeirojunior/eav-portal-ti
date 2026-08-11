import express from 'express';

// Rotas de integracao com o Mosyle (/api/mosyle/*): configura/consulta/
// desativa as credenciais (guardadas cifradas em vault_secrets) e dispara
// o sync manual. Todas restritas a superadmin. runMosyleSync e injetado
// (mesma instancia usada pelo auto-sync horario). Montado em /api/mosyle.
export function createMosyleRouter({ pool, authenticateToken, encryptSecret, decryptSecret, runMosyleSync }) {
  const router = express.Router();

  // POST /api/mosyle/config -- salva credenciais cifradas.
  router.post('/config', authenticateToken, async (req, res) => {
    if (req.user && req.user.role !== 'superadmin')
      return res.status(403).json({ error: 'Apenas Super Admins podem configurar integrações.' });
    try {
      const { email, password, token } = req.body;
      const configId = 'mosyle_config_id_static';
      const configValue = JSON.stringify({ email, password, token });
      const encryptedValue = encryptSecret(configValue);

      // Upsert logic (deleta se existir e insere)
      await pool.query('DELETE FROM vault_secrets WHERE key_name = $1', ['mosyle_api_config']);
      await pool.query(
        'INSERT INTO vault_secrets (id, key_name, encrypted_value, note, created_at) VALUES ($1, $2, $3, $4, $5)',
        [configId, 'mosyle_api_config', encryptedValue, 'Credenciais da API do Mosyle', new Date().toISOString()]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/mosyle/config -- retorna dados mascarados.
  router.get('/config', authenticateToken, async (req, res) => {
    if (req.user && req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acesso negado.' });
    try {
      const result = await pool.query('SELECT encrypted_value FROM vault_secrets WHERE key_name = $1', [
        'mosyle_api_config',
      ]);
      if (result.rows.length > 0) {
        const decrypted = decryptSecret(result.rows[0].encrypted_value);
        if (decrypted) {
          const config = JSON.parse(decrypted);
          return res.json({
            configured: true,
            email: config.email,
            tokenPreview: config.token ? config.token.substring(0, 5) + '...' : '',
          });
        }
      }
      res.json({ configured: false });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/mosyle/deactivate -- remove as credenciais.
  router.post('/deactivate', authenticateToken, async (req, res) => {
    if (req.user && req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acesso negado.' });
    try {
      await pool.query('DELETE FROM vault_secrets WHERE key_name = $1', ['mosyle_api_config']);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/mosyle/sync -- dispara o sync manual.
  router.post('/sync', authenticateToken, async (req, res) => {
    if (req.user && req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acesso negado.' });
    await runMosyleSync(res);
  });

  return router;
}
