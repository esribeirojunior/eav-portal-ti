import express from 'express';

// Rotas administrativas (/api/admin/*): gestao de usuarios autorizados +
// endpoints de fix/debug de roles (restritos a superadmin).
// Montado em /api/admin no server.js.
export function createAdminRouter({ pool, authenticateToken, requireSuperadmin, hashPassword }) {
  const router = express.Router();

  // GET /api/admin/fix-roles -- lista id/email/role (debug, superadmin).
  router.get('/fix-roles', authenticateToken, requireSuperadmin, async (req, res) => {
    try {
      const result = await pool.query('SELECT id, email, role FROM authorized_users');
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/admin/force-role -- recria a coluna role se faltar (superadmin).
  router.get('/force-role', authenticateToken, requireSuperadmin, async (req, res) => {
    try {
      await pool.query("ALTER TABLE authorized_users ADD COLUMN role TEXT DEFAULT 'admin'");
      res.json({ success: true, message: 'Coluna criada com sucesso!' });
    } catch (error) {
      res.json({ success: false, message: error.message });
    }
  });

  // GET /api/admin/users -- lista usuarios autorizados.
  router.get('/users', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, email, role, modules, created_at FROM authorized_users ORDER BY created_at DESC'
      );
      res.json({ data: result.rows });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/users -- cria usuario autorizado (senha com bcrypt).
  router.post('/users', authenticateToken, async (req, res) => {
    try {
      const { email, password, role } = req.body;
      if (!email) return res.status(400).json({ error: 'Email obrigatorio' });
      const id = Math.random().toString(36).substring(2, 9);
      const pwd = password || 'eav@123';
      const pwdHash = await hashPassword(pwd);
      const userRole = role || 'admin';
      const defaultModules = '["assets","links","audit","tasks","vault","tutorials","lab"]';

      const check = await pool.query('SELECT * FROM authorized_users WHERE email = $1', [email]);
      if (check.rows.length > 0) return res.status(400).json({ error: 'Usuario ja existe' });

      await pool.query(
        'INSERT INTO authorized_users (id, email, password, role, modules, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, email, pwdHash, userRole, defaultModules, new Date().toISOString()]
      );
      res.json({ data: { id, email, role: userRole, modules: defaultModules } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/admin/users/:id
  router.delete('/users/:id', authenticateToken, async (req, res) => {
    try {
      await pool.query('DELETE FROM authorized_users WHERE id = $1', [req.params.id]);
      res.json({ data: 'ok' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
