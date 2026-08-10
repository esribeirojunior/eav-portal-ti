import express from 'express';
import crypto from 'crypto';

// Rotas de gestao de inventario e do fluxo de vinculacao com o Mosyle.
// Usa paths absolutos (montado via app.use(router)) porque inclui tanto
// /api/devices/* quanto /api/mosyle/unlinked-macs (que faz parte do fluxo
// de linking). Recebe deps via factory.
function formatTag(n) {
  return 'EAV-' + String(n).padStart(4, '0');
}

export function createDevicesRouter({ pool, authenticateToken, requireSuperadmin, sendRealtimeUpdate }) {
  const router = express.Router();

  // POST /api/devices/bulk-stock -- cadastra N unidades em Estoque - Lacrado.
  router.post('/api/devices/bulk-stock', authenticateToken, async (req, res) => {
    const { quantity, type, supplier, invoice_number, purchase_date, warranty_expiry, unit_cost, is_accessory, notes } =
      req.body;

    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1 || qty > 500) {
      return res.status(400).json({ error: 'Quantidade deve ser entre 1 e 500.' });
    }
    if (!type || typeof type !== 'string' || type.length > 60) {
      return res.status(400).json({ error: 'Tipo obrigatório.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Lock advisory pra evitar race entre dois bulk-stocks concorrentes gerando tags iguais.
      await client.query('SELECT pg_advisory_xact_lock(4711)');

      const { rows: mrows } = await client.query(`
        SELECT COALESCE(MAX(CAST(SUBSTRING(tag FROM 5) AS INTEGER)), 0) AS max_num
        FROM devices
        WHERE tag ~ '^EAV-[0-9]+$'
      `);
      let nextNum = (mrows[0].max_num || 0) + 1;

      const now = new Date().toISOString();
      const created = [];

      for (let i = 0; i < qty; i++) {
        const tag = formatTag(nextNum + i);
        const id = crypto.randomBytes(4).toString('hex');
        const conditionNote =
          [
            notes ? `Notas: ${notes}` : null,
            supplier ? `Fornecedor: ${supplier}` : null,
            invoice_number ? `NF: ${invoice_number}` : null,
            unit_cost ? `Custo unit: R$ ${unit_cost}` : null,
          ]
            .filter(Boolean)
            .join(' | ') || 'Cadastrado como estoque novo.';

        await client.query(
          `INSERT INTO devices (
            id, tag, serial_number, model, type, status, condition, created_at,
            is_accessory, invoice_number, supplier, purchase_date, warranty_expiry
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [
            id, tag, null, null, type, 'Estoque - Lacrado', conditionNote, now,
            !!is_accessory, invoice_number || null, supplier || null,
            purchase_date || null, warranty_expiry || null,
          ]
        );
        created.push({ id, tag });
      }

      await client.query(
        `INSERT INTO audit_logs (id, user_email, action, details, resource_type, resource_id, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          crypto.randomBytes(4).toString('hex'),
          req.user.email,
          'STOCK_BULK_CREATE',
          `Cadastro em lote: ${qty}x ${type}. Tags ${created[0].tag} a ${created[created.length - 1].tag}.`,
          'DEVICE',
          created.map((c) => c.id).join(','),
          now,
        ]
      );

      await client.query('COMMIT');
      sendRealtimeUpdate('devices');
      res.json({ success: true, count: created.length, devices: created });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[bulk-stock] Erro:', err);
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  // GET /api/mosyle/unlinked-macs -- macs do Mosyle sem tag EAV, candidatos a vincular.
  router.get('/api/mosyle/unlinked-macs', authenticateToken, async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT
          md.id            AS mosyle_id,
          md.serial_number AS serial_number,
          md.device_name   AS device_name,
          md.model         AS model,
          md.os            AS os,
          md.raw_data      AS raw_data,
          d.id             AS existing_device_id,
          d.tag            AS existing_tag,
          d.status         AS existing_status
        FROM mosyle_devices md
        LEFT JOIN devices d
          ON LOWER(d.serial_number) = LOWER(md.serial_number)
        WHERE md.serial_number IS NOT NULL
          AND md.serial_number <> ''
          AND (d.tag IS NULL OR d.tag NOT LIKE 'EAV-%')
        ORDER BY md.device_name ASC
      `);

      const items = rows.map((r) => {
        let userInfo = null;
        try {
          const raw = r.raw_data ? JSON.parse(r.raw_data) : null;
          if (raw) {
            const name = raw.username || null;
            const email = raw.useremail || null;
            if (name || email) userInfo = { name, email };
          }
        } catch {}
        return {
          mosyle_id: r.mosyle_id,
          serial_number: r.serial_number,
          device_name: r.device_name,
          model: r.model,
          os: r.os,
          existing_device_id: r.existing_device_id,
          existing_tag: r.existing_tag,
          existing_status: r.existing_status,
          user: userInfo,
        };
      });
      res.json({ items });
    } catch (err) {
      console.error('[unlinked-macs] Erro:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/devices/:id/link-mosyle -- vincula EAV lacrado a um mac do Mosyle.
  router.post('/api/devices/:id/link-mosyle', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { mosyle_id, notes } = req.body || {};
    if (!mosyle_id) return res.status(400).json({ error: 'mosyle_id é obrigatório.' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const eavRes = await client.query('SELECT * FROM devices WHERE id = $1', [id]);
      if (eavRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Dispositivo EAV não encontrado.' });
      }
      const eavDevice = eavRes.rows[0];
      if (eavDevice.status !== 'Estoque - Lacrado') {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: `Só é possível vincular dispositivos em Estoque - Lacrado. Estado atual: ${eavDevice.status}.`,
        });
      }

      const mosyleRes = await client.query('SELECT * FROM mosyle_devices WHERE id = $1', [mosyle_id]);
      if (mosyleRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Mac do Mosyle não encontrado.' });
      }
      const mosyleDev = mosyleRes.rows[0];
      if (!mosyleDev.serial_number) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Mac do Mosyle sem serial number; não é possível vincular.' });
      }

      let username = null,
        useremail = null,
        usertype = null;
      try {
        const raw = mosyleDev.raw_data ? JSON.parse(mosyleDev.raw_data) : null;
        if (raw) {
          username = raw.username || null;
          useremail = raw.useremail || null;
          usertype = raw.usertype || null;
        }
      } catch {}

      const oldDupRes = await client.query(
        `SELECT id, tag FROM devices
         WHERE LOWER(serial_number) = LOWER($1)
           AND id <> $2
           AND (tag IS NULL OR tag NOT LIKE 'EAV-%')`,
        [mosyleDev.serial_number, id]
      );
      let mergedFrom = null;
      if (oldDupRes.rows.length > 0) {
        const oldDevice = oldDupRes.rows[0];
        mergedFrom = { id: oldDevice.id, tag: oldDevice.tag };
        await client.query('UPDATE assignments SET device_id = $1 WHERE device_id = $2', [id, oldDevice.id]);
        await client.query('UPDATE maintenance_logs SET device_id = $1 WHERE device_id = $2', [id, oldDevice.id]);
        await client.query('DELETE FROM devices WHERE id = $1', [oldDevice.id]);
      }

      const mUser = username || useremail;
      const newStatus = mUser ? 'Em Uso' : 'Disponível';
      const now = new Date().toISOString();
      const modelToUse = mosyleDev.model || eavDevice.model;
      const typeToUse =
        mosyleDev.os === 'mac' ? 'MacBook' : mosyleDev.os === 'ios' ? 'iPad' : eavDevice.type || 'MacBook';

      await client.query(
        `UPDATE devices SET
           serial_number = $1,
           model = $2,
           type = $3,
           status = $4,
           supplier = $5,
           last_seen = $6,
           condition = COALESCE($7, condition)
         WHERE id = $8`,
        [
          mosyleDev.serial_number,
          modelToUse,
          typeToUse,
          newStatus,
          'Mosyle',
          now,
          notes ? (eavDevice.condition ? eavDevice.condition + ' | ' + notes : notes) : null,
          id,
        ]
      );

      if (mUser) {
        let mRole = usertype || 'Colaborador';
        if (mRole === 'Student') mRole = 'Aluno';
        else if (mRole === 'Teacher') mRole = 'Professor';
        else if (mRole === 'Staff' || mRole === 'Administrator') mRole = 'Colaborador';

        const activeRes = await client.query(
          'SELECT id FROM assignments WHERE device_id = $1 AND returned_at IS NULL',
          [id]
        );
        if (activeRes.rows.length === 0) {
          await client.query(
            'INSERT INTO assignments (id, device_id, user_name, user_email, user_role, assigned_at, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [crypto.randomBytes(4).toString('hex'), id, username || useremail || 'Desconhecido', useremail || '', mRole, now, now]
          );
        }
      }

      await client.query(
        `INSERT INTO audit_logs (id, user_email, action, details, resource_type, resource_id, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          crypto.randomBytes(4).toString('hex'),
          req.user.email,
          'LINK_MOSYLE',
          `${eavDevice.tag} vinculado ao Mosyle serial=${mosyleDev.serial_number} usuario=${username || useremail || '(nenhum)'}${mergedFrom ? ` (consolidado com device antigo tag=${mergedFrom.tag})` : ''}`,
          'DEVICE',
          id,
          now,
        ]
      );

      await client.query('COMMIT');
      sendRealtimeUpdate('devices');
      res.json({
        success: true,
        tag: eavDevice.tag,
        serial_number: mosyleDev.serial_number,
        new_status: newStatus,
        merged_from: mergedFrom,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[link-mosyle] Erro:', err);
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  // POST /api/devices/bulk-delete (superadmin) -- exclui devices + vinculos.
  router.post('/api/devices/bulk-delete', authenticateToken, requireSuperadmin, async (req, res) => {
    const { ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Envie um array de ids nao vazio.' });
    }
    if (ids.length > 200) {
      return res.status(400).json({ error: 'Maximo 200 dispositivos por vez.' });
    }
    if (!ids.every((id) => typeof id === 'string' && id.length > 0 && id.length < 64)) {
      return res.status(400).json({ error: 'Ids invalidos.' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const snap = await client.query(
        'SELECT id, tag, serial_number, status FROM devices WHERE id = ANY($1::text[])',
        [ids]
      );
      const foundIds = snap.rows.map((r) => r.id);
      if (foundIds.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Nenhum dispositivo encontrado.' });
      }

      const del1 = await client.query('DELETE FROM assignments WHERE device_id = ANY($1::text[])', [foundIds]);
      const del2 = await client.query('DELETE FROM maintenance_logs WHERE device_id = ANY($1::text[])', [foundIds]);
      const del3 = await client.query('DELETE FROM devices WHERE id = ANY($1::text[])', [foundIds]);

      await client.query(
        `INSERT INTO audit_logs (id, user_email, action, details, resource_type, resource_id, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          crypto.randomBytes(4).toString('hex'),
          req.user.email,
          'BULK_DELETE_DEVICES',
          `Deletados ${del3.rowCount} devices (assignments=${del1.rowCount}, maintenance=${del2.rowCount}). Tags: ${snap.rows.map((r) => r.tag).slice(0, 30).join(', ')}${snap.rows.length > 30 ? '...' : ''}`,
          'DEVICE',
          foundIds.join(','),
          new Date().toISOString(),
        ]
      );

      await client.query('COMMIT');
      sendRealtimeUpdate('devices');
      res.json({
        success: true,
        deleted_devices: del3.rowCount,
        deleted_assignments: del1.rowCount,
        deleted_maintenance_logs: del2.rowCount,
        not_found_ids: ids.filter((id) => !foundIds.includes(id)),
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[bulk-delete] Erro:', err);
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  // GET /api/devices/:id/history -- timeline (assignments + audit_logs).
  router.get('/api/devices/:id/history', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
      const [dev, assigns, audits] = await Promise.all([
        pool.query('SELECT id, tag, serial_number, model, type, status, supplier FROM devices WHERE id = $1', [id]),
        pool.query(
          `
          SELECT id, user_name, user_email, user_role, department_id, campus,
                 assigned_at, returned_at, return_photo_url, created_at
          FROM assignments
          WHERE device_id = $1
          ORDER BY assigned_at DESC NULLS LAST
        `,
          [id]
        ),
        pool.query(
          `
          SELECT id, user_email, action, details, created_at
          FROM audit_logs
          WHERE resource_type = 'DEVICE'
            AND resource_id = $1
          ORDER BY created_at DESC
          LIMIT 100
        `,
          [id]
        ),
      ]);

      if (dev.rows.length === 0) return res.status(404).json({ error: 'Dispositivo não encontrado.' });

      res.json({
        device: dev.rows[0],
        assignments: assigns.rows,
        audit_logs: audits.rows,
      });
    } catch (err) {
      console.error('[device history] Erro:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // PATCH /api/devices/:id/prepare -- Estoque Lacrado -> Disponível.
  router.patch('/api/devices/:id/prepare', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { serial_number, model, condition, ram_gb, cpu_model, os_version, hostname } = req.body || {};

    try {
      const { rows } = await pool.query('SELECT * FROM devices WHERE id = $1', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Dispositivo não encontrado.' });
      const device = rows[0];
      if (device.status !== 'Estoque - Lacrado') {
        return res.status(409).json({
          error: `Só é possível preparar dispositivos em Estoque - Lacrado. Estado atual: ${device.status}.`,
        });
      }

      if (serial_number) {
        const dup = await pool.query(
          'SELECT id FROM devices WHERE LOWER(serial_number) = LOWER($1) AND id <> $2',
          [serial_number, id]
        );
        if (dup.rows.length > 0) {
          return res.status(409).json({ error: 'Já existe outro dispositivo com esse serial number.' });
        }
      }

      const now = new Date().toISOString();
      await pool.query(
        `UPDATE devices SET
          status = $1,
          serial_number = COALESCE($2, serial_number),
          model = COALESCE($3, model),
          condition = COALESCE($4, condition),
          ram_gb = COALESCE($5, ram_gb),
          cpu_model = COALESCE($6, cpu_model),
          os_version = COALESCE($7, os_version),
          hostname = COALESCE($8, hostname),
          last_seen = $9
         WHERE id = $10`,
        [
          'Disponível',
          serial_number || null,
          model || null,
          condition || null,
          ram_gb ? Math.round(ram_gb) : null,
          cpu_model || null,
          os_version || null,
          hostname || null,
          now,
          id,
        ]
      );

      await pool.query(
        `INSERT INTO audit_logs (id, user_email, action, details, resource_type, resource_id, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          crypto.randomBytes(4).toString('hex'),
          req.user.email,
          'STOCK_PREPARE',
          `${device.tag} preparado. Serial: ${serial_number || '(vazio)'} Modelo: ${model || '(vazio)'}`,
          'DEVICE',
          id,
          now,
        ]
      );

      sendRealtimeUpdate('devices');
      res.json({ success: true });
    } catch (err) {
      console.error('[prepare] Erro:', err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
