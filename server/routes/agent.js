import express from 'express';
import { execFile } from 'child_process';

// Rotas do agente RMM (/api/agent/*): sync de hardware e ping de rede.
// /sync usa token proprio (AGENT_SYNC_TOKEN, env) -- NAO usa authenticateToken.
// /ping exige sessao autenticada. Montado em /api/agent.
const HOST_REGEX = /^[a-zA-Z0-9.\-:]+$/;

export function createAgentRouter({
  pool,
  readDBTable,
  convertPlaceholders,
  sendRealtimeUpdate,
  authenticateToken,
}) {
  const router = express.Router();

  // POST /api/agent/sync -- upsert do dispositivo a partir dos dados coletados.
  router.post('/sync', async (req, res) => {
    // Token do agente lido do env var AGENT_SYNC_TOKEN (configurar no Coolify).
    // Fail-closed: se a env nao estiver definida, todo sync e rejeitado.
    const expectedToken = process.env.AGENT_SYNC_TOKEN;
    if (!expectedToken) {
      console.error('[SECURITY] AGENT_SYNC_TOKEN nao configurado no servidor.');
      return res.status(503).json({ error: 'Agent authentication not configured on server' });
    }
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${expectedToken}`) {
      console.warn('[SECURITY] Tentativa de sync bloqueada por token inválido:', req.ip);
      return res.status(401).json({ error: 'Unauthorized: Invalid Agent Token' });
    }

    const {
      hostname,
      username,
      os,
      cpu,
      ram_gb,
      disk_total_gb,
      disk_free_gb,
      serial_number,
      model,
      manufacturer,
      mac_address,
      ip_address,
      uptime_days,
      wifi_ssid,
      battery_health,
      monitors,
      campus,
      rustdesk_id,
    } = req.body;

    if (!serial_number && !hostname) {
      return res.status(400).json({ error: 'Serial Number ou Hostname é obrigatório.' });
    }

    try {
      const devices = await readDBTable('devices');
      const existingIndex = devices.findIndex(
        (d) =>
          (d.serial_number && d.serial_number.toLowerCase() === (serial_number || '').toLowerCase()) ||
          (d.tag && d.tag.toLowerCase() === `EAV-${(serial_number || '').toUpperCase()}`)
      );

      let technicalInfo = `Hostname: ${hostname} | Sistema: ${os} | Processador: ${cpu} | RAM: ${ram_gb}GB | HD: ${disk_total_gb}GB (${disk_free_gb}GB Livre) | Usuário Logado: ${username} | MAC: ${mac_address} | IP: ${ip_address || 'N/A'}`;

      if (uptime_days !== undefined) technicalInfo += ` | Uptime: ${uptime_days} dias`;
      if (wifi_ssid !== undefined) technicalInfo += ` | Wi-Fi: ${wifi_ssid}`;
      if (battery_health !== undefined) technicalInfo += ` | Bateria: ${battery_health}`;
      if (monitors !== undefined) technicalInfo += ` | Monitores: ${monitors}`;
      if (rustdesk_id) technicalInfo += ` | RustDesk ID: ${rustdesk_id}`;

      let targetDevice;
      let actionStr;

      if (existingIndex >= 0) {
        // Atualiza o dispositivo existente
        const sql = convertPlaceholders(
          'UPDATE devices SET status=?, model=?, condition=?, last_seen=?, hostname=?, ip_address=?, mac_address=?, ram_gb=?, cpu_model=?, os_version=? WHERE id=?'
        );
        await pool.query(sql, [
          'Em Uso',
          model || devices[existingIndex].model,
          technicalInfo,
          new Date().toISOString(),
          hostname || '',
          ip_address || '',
          mac_address || '',
          Math.round(ram_gb || 0),
          cpu || '',
          os || '',
          devices[existingIndex].id,
        ]);
        targetDevice = {
          ...devices[existingIndex],
          status: 'Em Uso',
          model: model || devices[existingIndex].model,
          condition: technicalInfo,
          last_seen: new Date().toISOString(),
          hostname: hostname || '',
          ip_address: ip_address || '',
          mac_address: mac_address || '',
          ram_gb: Math.round(ram_gb || 0),
          cpu_model: cpu || '',
          os_version: os || '',
        };
        actionStr = 'updated';
      } else {
        // Cadastra um novo dispositivo
        const newDevice = {
          id: Math.random().toString(36).substring(2, 9),
          tag: `EAV-${(serial_number || hostname).toUpperCase()}`,
          serial_number: serial_number || 'DESCONHECIDO',
          model: `${manufacturer || ''} ${model || 'Desktop'}`.trim(),
          type: 'Computador',
          status: 'Em Uso',
          condition: technicalInfo,
          last_seen: new Date().toISOString(),
          created_at: new Date().toISOString(),
          hostname: hostname || '',
          ip_address: ip_address || '',
          mac_address: mac_address || '',
          ram_gb: Math.round(ram_gb || 0),
          cpu_model: cpu || '',
          os_version: os || '',
          is_accessory: false,
        };

        const keys = Object.keys(newDevice);
        const placeholders = keys.map(() => '?').join(', ');
        const sql = convertPlaceholders(
          `INSERT INTO devices (${keys.join(', ')}) VALUES (${placeholders})`
        );
        await pool.query(
          sql,
          keys.map((k) => newDevice[k])
        );
        targetDevice = newDevice;
        actionStr = 'created';
      }

      sendRealtimeUpdate('devices');

      return res.json({ success: true, action: actionStr, device: targetDevice });
    } catch (err) {
      console.error('[Agent Sync] Erro:', err);
      return res.status(500).json({ error: 'Erro no servidor: ' + err.message });
    }
  });

  // POST /api/agent/ping -- ping de rede. Valida host e usa execFile (sem shell).
  router.post('/ping', authenticateToken, (req, res) => {
    const { hostname, ip } = req.body;
    if (!hostname && !ip) return res.status(400).json({ error: 'Hostname ou IP necessário para o Ping.' });

    // Dá prioridade para o IP se disponível (evita falha de resolução DNS)
    const targetHost = ip || hostname;

    if (typeof targetHost !== 'string' || targetHost.length > 253 || !HOST_REGEX.test(targetHost)) {
      return res.status(400).json({ error: 'Hostname/IP inválido.' });
    }

    console.log(`[Ping] Disparando ping na rede para: ${targetHost}...`);

    // Suporte multiplataforma: Windows usa -n e -w(ms), Linux usa -c e -W(s)
    const isWin = process.platform === 'win32';
    const pingArgs = isWin ? ['-n', '1', '-w', '2000', targetHost] : ['-c', '1', '-W', '2', targetHost];

    execFile('ping', pingArgs, { timeout: 5000, windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        console.log(`[Ping] Falha: Host ${targetHost} não alcançável.`);
        return res.json({ online: false, error: 'Host inalcançável', output: stdout || stderr });
      }

      // Tentar extrair o tempo do ping "tempo=XXms", "time=XXms" ou "time=XX ms"
      let timeMatch = stdout.match(/tempo[=<](\d+)\s*ms/i) || stdout.match(/time[=<](\d+)\s*ms/i);
      let ms = timeMatch ? timeMatch[1] : '?';

      console.log(`[Ping] Sucesso: Host ${targetHost} online (${ms}ms)`);
      return res.json({ online: true, time: ms, output: stdout });
    });
  });

  return router;
}
