import crypto from 'crypto';
import { getFriendlyAppleModelName } from './apple-models.js';
import { inferLastUserFromDeviceName } from '../lib/device-names.js';

// Sincronizacao com a API do Mosyle. Espelha mac/ipads em mosyle_devices e
// atualiza o inventario central (devices + assignments + audit trail).
// Extraido do server.js como factory pra ser compartilhado entre a rota
// /api/mosyle/sync e o auto-sync horario. `manualResponse` (opcional) e o
// objeto res do Express quando disparado manualmente; quando nulo (auto),
// apenas loga.
export function createMosyleSync({ pool, decryptSecret, sendRealtimeUpdate }) {
  return async function runMosyleSync(manualResponse = null) {
    try {
      let token = process.env.MOSYLE_ACCESS_TOKEN;
      let config = {
        email: process.env.MOSYLE_EMAIL || '',
        password: process.env.MOSYLE_PASSWORD || '',
      };

      // Se nao tiver o token no env, tenta pegar tudo (token+email+password) do vault.
      if (!token) {
        const result = await pool.query(
          'SELECT encrypted_value FROM vault_secrets WHERE key_name = $1',
          ['mosyle_api_config']
        );
        if (result.rows.length === 0) {
          if (manualResponse)
            return manualResponse.status(400).json({
              error:
                'Credenciais do Mosyle nao configuradas. Adicione MOSYLE_ACCESS_TOKEN, MOSYLE_EMAIL e MOSYLE_PASSWORD nas Environment Variables do Coolify, ou reconfigure via portal.',
            });
          console.log('[Auto-Sync] Credenciais do Mosyle nao configuradas.');
          return;
        }

        const decrypted = decryptSecret(result.rows[0].encrypted_value);
        if (!decrypted) {
          if (manualResponse)
            return manualResponse.status(500).json({ error: 'Erro ao descriptografar credenciais do banco.' });
          console.error('[Auto-Sync] Erro ao descriptografar credenciais do banco.');
          return;
        }

        const stored = JSON.parse(decrypted);
        token = stored.token ? stored.token.trim() : null;
        // Env var tem precedencia; so pega do vault se env estiver vazia.
        if (!config.email) config.email = stored.email || '';
        if (!config.password) config.password = stored.password || '';
      } else {
        token = token.trim();
      }

      if (!token) {
        if (manualResponse) return manualResponse.status(400).json({ error: 'Token invalido ou vazio.' });
        console.error('[Auto-Sync] Token invalido ou vazio.');
        return;
      }

      if (!config.email || !config.password) {
        const errMsg =
          'Email/Senha do Mosyle nao configurados. Adicione MOSYLE_EMAIL e MOSYLE_PASSWORD no Coolify, ou reconfigure via portal.';
        if (manualResponse) return manualResponse.status(400).json({ error: errMsg });
        console.error('[Auto-Sync] ' + errMsg);
        return;
      }

      const fetch = (await import('node-fetch')).default;

      // 1. Fazer o Login para pegar o JWT Bearer Token
      const loginResponse = await fetch('https://managerapi.mosyle.com/v2/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token, email: config.email, password: config.password }),
      });

      if (!loginResponse.ok) {
        const errText = await loginResponse.text();
        if (manualResponse)
          return manualResponse
            .status(401)
            .json({ error: 'Falha no login do Mosyle. Verifique o Email/Senha e o Token.', details: errText });
        console.error('[Auto-Sync] Falha no login do Mosyle:', errText);
        return;
      }

      const bearerHeader = loginResponse.headers.get('authorization');
      if (!bearerHeader) {
        if (manualResponse)
          return manualResponse.status(500).json({ error: 'Mosyle não retornou o JWT Bearer Token no cabeçalho.' });
        console.error('[Auto-Sync] Mosyle não retornou o JWT Bearer Token.');
        return;
      }

      const mosyleEndpoint = 'https://managerapi.mosyle.com/v2/listdevices';
      const specificColumns = [
        'deviceudid', 'serial_number', 'device_name', 'device_model', 'os', 'osversion',
        'total_disk', 'battery', 'tags', 'usertype', 'userid', 'username', 'useremail', 'CustomDeviceAttributes',
      ];

      const responseMac = await fetch(mosyleEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: bearerHeader },
        body: JSON.stringify({
          accessToken: token,
          operation: 'list',
          options: { os: 'mac', page_size: 1000, specific_columns: specificColumns },
        }),
      });

      const responseIos = await fetch(mosyleEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: bearerHeader },
        body: JSON.stringify({
          accessToken: token,
          operation: 'list',
          options: { os: 'ios', page_size: 1000, specific_columns: specificColumns },
        }),
      });

      let dataMac, dataIos;
      try {
        dataMac = await responseMac.json();
        dataIos = await responseIos.json();
      } catch (e) {
        if (manualResponse)
          return manualResponse.status(500).json({ error: `Erro ao ler resposta da API do Mosyle.` });
        console.error('[Auto-Sync] Erro ao ler resposta da API.');
        return;
      }

      if (!responseMac.ok || !responseIos.ok) {
        if (manualResponse)
          return manualResponse
            .status(500)
            .json({ error: `Erro na API do Mosyle. Certifique-se de que o token é válido.` });
        console.error('[Auto-Sync] Erro na API do Mosyle.');
        return;
      }

      const allDevices = [...(dataMac?.response?.devices || []), ...(dataIos?.response?.devices || [])];

      // Mapear e salvar no banco de dados isolado (mosyle_devices)
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Apagamos a tabela atual de mosyle e inserimos a nova lista espelhada
        await client.query('DELETE FROM mosyle_devices');

        for (const dev of allDevices) {
          const id = Math.random().toString(36).substring(2, 9);
          const rawModel = dev.device_model || dev.Model || dev.MachineModel || dev.MachineName || 'Desconhecido';
          const modelStr = getFriendlyAppleModelName(rawModel);

          await client.query(
            'INSERT INTO mosyle_devices (id, deviceudid, serial_number, device_name, os, model, total_disk, battery_level, raw_data, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
            [
              id,
              dev.deviceudid || '',
              dev.serial_number || '',
              dev.device_name || dev.LocalHostName || '',
              dev.os || '',
              modelStr,
              dev.total_disk || '',
              dev.battery_level || '',
              JSON.stringify(dev),
              new Date().toISOString(),
            ]
          );

          // ==========================================
          // AUTO-SYNC COM O INVENTÁRIO CENTRAL
          // ==========================================
          if (dev.serial_number) {
            const sn = dev.serial_number;
            // Padronizamos 'MacBook' (CamelCase) para bater com o enum DeviceType do frontend.
            const typeStr = dev.os === 'mac' ? 'MacBook' : 'iPad';
            const osVersion = dev.osversion || '';
            const now = new Date().toISOString();

            // 1. Atualizar ou Inserir em 'devices'
            const deviceRes = await client.query(
              'SELECT id, tag, supplier, status FROM devices WHERE serial_number = $1',
              [sn]
            );
            let centralDeviceId;
            const mUser = dev.username || dev.useremail;

            if (deviceRes.rows.length > 0) {
              centralDeviceId = deviceRes.rows[0].id;
              const currentTag = deviceRes.rows[0].tag;
              const currentSupplier = deviceRes.rows[0].supplier;
              const currentStatus = deviceRes.rows[0].status;

              // Preserva a tag existente se for EAV-XXXX (nao sobrescreve por 'Mosyle MDM').
              const tagToUpdate = currentTag && currentTag.trim() !== '' ? currentTag : 'Mosyle MDM';
              const supplierToUpdate = currentSupplier && currentSupplier.trim() !== '' ? currentSupplier : 'Mosyle';

              // Se o device foi cadastrado como estoque lacrado, o sync NAO promove
              // pra Em Uso automaticamente -- aguarda o admin vincular via
              // POST /api/devices/:id/link-mosyle.
              const newStatus =
                currentStatus === 'Estoque - Lacrado' ? 'Estoque - Lacrado' : mUser ? 'Em Uso' : 'Disponível';

              await client.query(
                'UPDATE devices SET model = $1, type = $2, os_version = $3, last_seen = $4, status = $5, tag = $6, supplier = $7 WHERE id = $8',
                [modelStr, typeStr, osVersion, now, newStatus, tagToUpdate, supplierToUpdate, centralDeviceId]
              );

              // Se o status era Lacrado, NAO cria/atualiza assignment -- aguarda vinculacao manual.
              if (currentStatus === 'Estoque - Lacrado') continue;
            } else {
              centralDeviceId = crypto.randomBytes(4).toString('hex');
              const newStatus = mUser ? 'Em Uso' : 'Disponível';
              await client.query(
                'INSERT INTO devices (id, serial_number, model, type, status, condition, created_at, last_seen, os_version, tag, supplier) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
                [centralDeviceId, sn, modelStr, typeStr, newStatus, 'Novo', now, now, osVersion, 'Mosyle MDM', 'Mosyle']
              );
            }

            // 2. Lógica de Atribuição (Assignments) + audit trail
            const logMosyleAudit = async (action, details) => {
              try {
                await client.query(
                  `INSERT INTO audit_logs (id, user_email, action, details, resource_type, resource_id, created_at)
                   VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                  [crypto.randomBytes(4).toString('hex'), 'mosyle-sync@system', action, details, 'DEVICE', centralDeviceId, now]
                );
              } catch (e) {
                console.warn(`[Auto-Sync] Falha ao gravar audit ${action}:`, e.message);
              }
            };

            if (mUser) {
              let mRole = dev.usertype || 'Colaborador';
              if (mRole === 'Student') mRole = 'Aluno';
              else if (mRole === 'Teacher') mRole = 'Professor';
              else if (mRole === 'Staff' || mRole === 'Administrator') mRole = 'Colaborador';

              const assignRes = await client.query(
                'SELECT id, user_name FROM assignments WHERE device_id = $1 AND returned_at IS NULL',
                [centralDeviceId]
              );

              let needsNewAssignment = false;
              let previousUser = null;
              if (assignRes.rows.length > 0) {
                const currentAssign = assignRes.rows[0];
                if (currentAssign.user_name !== (dev.username || dev.useremail)) {
                  await client.query('UPDATE assignments SET returned_at = $1 WHERE id = $2', [now, currentAssign.id]);
                  previousUser = currentAssign.user_name;
                  needsNewAssignment = true;
                } else {
                  await client.query('UPDATE assignments SET user_role = $1 WHERE id = $2', [mRole, currentAssign.id]);
                }
              } else {
                needsNewAssignment = true;
              }

              if (needsNewAssignment) {
                const assignId = Math.random().toString(36).substring(2, 9);
                const newUserName = dev.username || dev.useremail || 'Desconhecido';
                await client.query(
                  'INSERT INTO assignments (id, device_id, user_name, user_email, user_role, assigned_at, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                  [assignId, centralDeviceId, newUserName, dev.useremail || '', mRole, now, now]
                );
                if (previousUser) {
                  await logMosyleAudit(
                    'MOSYLE_USER_CHANGE',
                    `Trocou de usuario no Mosyle: ${previousUser} -> ${newUserName}${dev.useremail ? ` <${dev.useremail}>` : ''} (${mRole})`
                  );
                } else {
                  await logMosyleAudit(
                    'MOSYLE_USER_ASSIGN',
                    `Novo usuario no Mosyle: ${newUserName}${dev.useremail ? ` <${dev.useremail}>` : ''} (${mRole})`
                  );
                }
              }
            } else {
              // Sem usuário no MDM -> encerra qualquer atribuição ativa e loga.
              const activeRes = await client.query(
                'SELECT id, user_name, user_email FROM assignments WHERE device_id = $1 AND returned_at IS NULL',
                [centralDeviceId]
              );
              if (activeRes.rows.length > 0) {
                const wasWith = activeRes.rows
                  .map((a) => `${a.user_name}${a.user_email ? ` <${a.user_email}>` : ''}`)
                  .join(', ');
                await client.query('UPDATE assignments SET returned_at = $1 WHERE device_id = $2 AND returned_at IS NULL', [now, centralDeviceId]);
                await logMosyleAudit(
                  'MOSYLE_USER_UNASSIGN',
                  `Usuario removido no Mosyle: ${wasWith} (mac agora sem vinculo no MDM)`
                );
              }

              // Infere o ultimo usuario conhecido pelo device_name (idempotente).
              const deviceName = dev.device_name || dev.LocalHostName || '';
              const inferred = inferLastUserFromDeviceName(deviceName);
              if (inferred) {
                const existing = await client.query(
                  `SELECT id FROM audit_logs
                   WHERE resource_id = $1 AND action = 'MOSYLE_INFERRED_LAST_USER'
                   LIMIT 1`,
                  [centralDeviceId]
                );
                if (existing.rows.length === 0) {
                  await logMosyleAudit(
                    'MOSYLE_INFERRED_LAST_USER',
                    `Último usuário conhecido (inferido do device_name do Mosyle): ${inferred}. Estado atual: sem vínculo no MDM.`
                  );
                }
              }
            }
          }
        }
        await client.query('COMMIT');
      } catch (dbErr) {
        await client.query('ROLLBACK');
        if (manualResponse)
          return manualResponse
            .status(500)
            .json({ error: 'Erro ao salvar dispositivos do Mosyle no banco local: ' + dbErr.message });
        console.error('[Auto-Sync] Erro no DB:', dbErr.message);
        return;
      } finally {
        client.release();
      }

      if (manualResponse) {
        manualResponse.json({
          success: true,
          message: `Sincronização concluída com sucesso! ${allDevices.length} dispositivos (Macs/iPads) foram mapeados e salvos em ambiente isolado.`,
        });
      } else {
        console.log(`[Auto-Sync] Concluído: ${allDevices.length} dispositivos (Macs/iPads) foram mapeados e salvos.`);
      }
    } catch (err) {
      console.error('[Mosyle Auto-Sync]', err);
      if (manualResponse) manualResponse.status(500).json({ error: err.message });
    }
  };
}
