import express from 'express';

// Proxy generico estilo Supabase (/api/db). Alem de extrair do server.js,
// esta versao ENDURECE contra SQL injection:
//   - `table` deve estar na allowlist ALLOWED_TABLES.
//   - Todo identificador (coluna em filters, ilikeCol, orderCol, chaves de
//     insert/update) deve casar IDENT_RE (apenas [a-zA-Z_][a-zA-Z0-9_]*).
// Isso bloqueia payloads como "1=1 OR pg_sleep(5)", "id; DROP TABLE",
// "public.authorized_users" etc, sem rejeitar nenhuma query legitima
// (nomes de tabela/coluna reais sempre passam).

// Tabelas reais do portal (ver initPostgresDB no server.js). Qualquer outra
// e rejeitada. Tabelas do n8n/outros sistemas no mesmo banco NAO entram aqui.
const ALLOWED_TABLES = new Set([
  'devices',
  'mosyle_devices',
  'maintenance_logs',
  'assignments',
  'department',
  'shortcuts',
  'vault_projects',
  'vault_secrets',
  'authorized_users',
  'it_tasks',
  'it_task_comments',
  'audit_logs',
]);

const IDENT_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

// Exportados para teste unitario da blindagem contra SQL injection.
export function isValidIdentifier(name) {
  return typeof name === 'string' && name.length <= 63 && IDENT_RE.test(name);
}
export { ALLOWED_TABLES };

export function createDbRouter({
  pool,
  authenticateToken,
  processBase64Fields,
  convertPlaceholders,
  sendRealtimeUpdate,
}) {
  const router = express.Router();

  router.post('/', authenticateToken, async (req, res) => {
    processBase64Fields(req.body);
    const {
      table,
      filters = {},
      ilikeCol,
      ilikeVal,
      insertData,
      updateData,
      isDelete,
      isUpsert,
      orderCol,
      orderAsc,
      isSingle,
    } = req.body;

    // --- BLINDAGEM CONTRA SQL INJECTION ---
    if (!ALLOWED_TABLES.has(table)) {
      return res.status(400).json({ error: { message: 'Tabela inválida.' } });
    }
    // Colunas dos filtros
    for (const k of Object.keys(filters)) {
      if (!isValidIdentifier(k)) {
        return res.status(400).json({ error: { message: `Coluna de filtro inválida: ${k}` } });
      }
    }
    // ilike / order
    if (ilikeCol !== undefined && ilikeCol !== null && ilikeCol !== '' && !isValidIdentifier(ilikeCol)) {
      return res.status(400).json({ error: { message: 'Coluna ilike inválida.' } });
    }
    if (orderCol !== undefined && orderCol !== null && orderCol !== '' && !isValidIdentifier(orderCol)) {
      return res.status(400).json({ error: { message: 'Coluna de ordenação inválida.' } });
    }
    // chaves de insert/update
    const dataKeysToCheck = [];
    if (updateData) dataKeysToCheck.push(...Object.keys(updateData));
    if (insertData) {
      const arr = Array.isArray(insertData) ? insertData : [insertData];
      for (const item of arr) if (item && typeof item === 'object') dataKeysToCheck.push(...Object.keys(item));
    }
    for (const k of dataKeysToCheck) {
      if (!isValidIdentifier(k)) {
        return res.status(400).json({ error: { message: `Coluna inválida: ${k}` } });
      }
    }
    // --- FIM DA BLINDAGEM ---

    try {
      const isMutation = isDelete || updateData || insertData || isUpsert;
      if (isMutation) {
        const role = req.user ? req.user.role : 'viewer';

        // Privilege Escalation Prevention
        if (table === 'authorized_users' && role !== 'superadmin') {
          return res
            .status(403)
            .json({ error: 'Acesso negado: Apenas Super Admins podem modificar contas de usuários.' });
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
      }
      let whereClause = '';
      const params = [];
      const filterKeys = Object.keys(filters);

      if (filterKeys.length > 0) {
        const clauses = [];
        for (const k of filterKeys) {
          if (filters[k] === null) {
            clauses.push(`${k} IS NULL`);
          } else {
            clauses.push(`${k} = ?`);
            params.push(filters[k]);
          }
        }
        whereClause = 'WHERE ' + clauses.join(' AND ');
      }

      if (ilikeCol && ilikeVal) {
        whereClause += (whereClause ? ' AND ' : 'WHERE ') + `${ilikeCol} LIKE ?`;
        params.push(`%${ilikeVal.replace(/%/g, '')}%`);
      }

      if (isDelete) {
        const sql = convertPlaceholders(`DELETE FROM ${table} ${whereClause}`);
        await pool.query(sql, params);
        sendRealtimeUpdate(table);
        return res.json({ data: null, error: null });
      }

      if (updateData) {
        if (table === 'devices') {
          const tag = updateData.tag;
          const serial = updateData.serial_number;

          if (tag || serial) {
            // Descobre o ID do dispositivo sendo atualizado para não se validar contra si mesmo
            const selectSql = convertPlaceholders(`SELECT id FROM devices ${whereClause}`);
            const selectRes = await pool.query(selectSql, params);
            const currentId = selectRes.rows[0]?.id;

            const checks = [];
            const queryParams = [];
            let idx = 1;

            if (tag) {
              checks.push(`LOWER(tag) = LOWER($${idx++})`);
              queryParams.push(tag.trim());
            }
            if (serial) {
              checks.push(
                `(serial_number IS NOT NULL AND serial_number <> '' AND LOWER(serial_number) = LOWER($${idx++}))`
              );
              queryParams.push(serial.trim());
            }

            let checkSql = `SELECT id, tag, serial_number FROM devices WHERE (${checks.join(' OR ')})`;
            if (currentId) {
              checkSql += ` AND id <> $${idx++}`;
              queryParams.push(currentId);
            }

            const dupRes = await pool.query(checkSql, queryParams);
            if (dupRes.rows.length > 0) {
              const dup = dupRes.rows[0];
              const isTagDup = tag && dup.tag && dup.tag.toLowerCase() === tag.trim().toLowerCase();
              const field = isTagDup ? 'Nº de Patrimônio (Tag)' : 'Nº de Série (Service Tag)';
              const value = isTagDup ? dup.tag : dup.serial_number;
              return res.status(400).json({
                error: {
                  message: `Não é possível salvar. Já existe um dispositivo cadastrado com este ${field}: "${value}".`,
                },
              });
            }
          }
        }

        const updateKeys = Object.keys(updateData);
        const setClause = updateKeys.map((k) => `${k} = ?`).join(', ');
        const updateParams = updateKeys.map((k) => updateData[k]);
        const sql = convertPlaceholders(`UPDATE ${table} SET ${setClause} ${whereClause}`);
        const updateRes = await pool.query(sql, [...updateParams, ...params]);

        // Se nenhuma linha for alterada, retornar erro para não falhar silenciosamente
        if (updateRes.rowCount === 0) {
          return res.status(404).json({
            error: { message: `Nenhum registro encontrado para atualizar. Filtros: ${JSON.stringify(filters)}` },
          });
        }

        sendRealtimeUpdate(table);

        const selectSql = convertPlaceholders(`SELECT * FROM ${table} ${whereClause}`);
        const updatedData = await pool.query(selectSql, params);
        return res.json({ data: isSingle ? updatedData.rows[0] : updatedData.rows, error: null });
      }

      if (insertData) {
        const newItems = Array.isArray(insertData) ? insertData : [insertData];
        const results = [];
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          for (const item of newItems) {
            const finalItem = { ...item };

            if (table === 'devices') {
              const itemTag = finalItem.tag ? finalItem.tag.trim() : null;
              const itemSerial = finalItem.serial_number ? finalItem.serial_number.trim() : null;

              let existingDevice = null;
              if (itemTag || itemSerial) {
                const checks = [];
                const checkParams = [];
                let idx = 1;
                const isPlaceholderTag = (t) =>
                  !t || t.toLowerCase() === 'n/a' || t.toLowerCase() === 'na' || t === '-' || t === '--';
                if (itemTag && !isPlaceholderTag(itemTag)) {
                  checks.push(`LOWER(tag) = LOWER($${idx++})`);
                  checkParams.push(itemTag);
                }
                if (itemSerial && !isPlaceholderTag(itemSerial)) {
                  checks.push(
                    `(serial_number IS NOT NULL AND serial_number <> '' AND LOWER(serial_number) = LOWER($${idx++}))`
                  );
                  checkParams.push(itemSerial);
                }

                if (checks.length > 0) {
                  const checkSql = `SELECT * FROM devices WHERE ${checks.join(' OR ')}`;
                  const dupRes = await client.query(checkSql, checkParams);
                  if (dupRes.rows.length > 0) {
                    existingDevice = dupRes.rows[0];
                  }
                }
              }

              if (existingDevice && !isUpsert) {
                // Bloqueia e retorna erro informando que o item já existe (somente para INSERTS normais)
                await client.query('ROLLBACK');
                client.release();

                const isTagDup =
                  itemTag && existingDevice.tag && existingDevice.tag.toLowerCase() === itemTag.toLowerCase();
                const field = isTagDup ? 'Nº de Patrimônio (Tag)' : 'Nº de Série (Service Tag)';
                const value = isTagDup ? existingDevice.tag : existingDevice.serial_number;

                return res.status(400).json({
                  error: {
                    message: `Já existe um dispositivo com este ${field}: "${value}".`,
                  },
                });
              }

              // Se for isUpsert e existir, garantimos que usamos o mesmo ID para atualizar
              if (existingDevice && isUpsert) {
                finalItem.id = existingDevice.id;
              }
            }

            if (!finalItem.id) finalItem.id = Math.random().toString(36).substring(2, 9);
            const tablesWithoutCreatedAt = ['department', 'shortcuts', 'audit_logs'];
            if (!finalItem.created_at && !isUpsert && !tablesWithoutCreatedAt.includes(table)) {
              finalItem.created_at = new Date().toISOString();
            }

            let conflictClause = '';
            if (isUpsert) {
              const updateCols = Object.keys(finalItem)
                .filter((k) => k !== 'id')
                .map((k) => `${k}=excluded.${k}`)
                .join(', ');
              conflictClause = `ON CONFLICT(id) DO UPDATE SET ${updateCols}`;
            }

            const keys = Object.keys(finalItem);
            const placeholders = keys.map(() => '?').join(', ');
            const values = keys.map((k) => finalItem[k]);

            const sql = convertPlaceholders(
              `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) ${conflictClause}`
            );
            await client.query(sql, values);
            results.push(finalItem);
          }
          await client.query('COMMIT');
          client.release();
        } catch (err) {
          await client.query('ROLLBACK');
          client.release();
          console.error('Erro na query SQL:', err);
          return res.status(500).json({ error: { message: err.message } });
        }
        sendRealtimeUpdate(table);
        return res.json({ data: isSingle ? results[0] : results, error: null });
      }

      let orderClause = '';
      if (orderCol) {
        orderClause = `ORDER BY ${orderCol} ${orderAsc ? 'ASC' : 'DESC'}`;
      }

      const selectSql = convertPlaceholders(`SELECT * FROM ${table} ${whereClause} ${orderClause}`);
      const selectRes = await pool.query(selectSql, params);
      let result = selectRes.rows;

      if (table === 'devices') {
        const allAssignmentsRes = await pool.query('SELECT * FROM assignments');
        const allDepartmentsRes = await pool.query('SELECT * FROM department');
        const allMaintenanceRes = await pool.query('SELECT * FROM maintenance_logs');

        const allAssignments = allAssignmentsRes.rows;
        const allDepartments = allDepartmentsRes.rows;
        const allMaintenance = allMaintenanceRes.rows;

        result = result.map((dev) => {
          const devAssigns = allAssignments
            .filter((a) => String(a.device_id) === String(dev.id))
            .map((a) => {
              const dept = allDepartments.find((d) => String(d.id) === String(a.department_id));
              return { ...a, department: dept ? { name: dept.name } : null };
            });

          const devMaintenance = allMaintenance.filter((m) => String(m.device_id) === String(dev.id));

          return { ...dev, assignments: devAssigns, maintenance_logs: devMaintenance };
        });
      }

      if (table === 'authorized_users') {
        // Retorna as informações seguras do usuário, incluindo o cargo (role) e excluindo a senha (password)
        result = result.map((u) => ({
          id: u.id,
          email: u.email,
          role: u.role,
          modules: u.modules,
          created_at: u.created_at,
        }));
      }

      return res.json({ data: isSingle ? result[0] || null : result, error: null });
    } catch (err) {
      return res.status(500).json({ error: { message: err.message } });
    }
  });

  return router;
}
