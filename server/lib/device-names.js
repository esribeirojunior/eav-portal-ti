// Extrai o nome do "último usuário" a partir do campo device_name do Mosyle.
// Reconhece "MacBook Air de <NOME>", "Mac de <NOME>", "iPad de <NOME>", ou
// aceita o nome direto se parece nome próprio (capitalizado, sem números).
// Retorna null se não conseguir extrair com confiança.
//
// Funcao pura extraida de server.js. Antes estava duplicada tambem no script
// scripts/legacy/backfill (extractUserName) -- agora ha uma unica fonte.

const DEVICE_NAME_PREFIX_RE =
  /^(MacBook\s+(?:Air|Pro)?|MacBook|Mac\s+mini|Mac|iMac|iPad|iPhone)\s+de\s+/i;

export function inferLastUserFromDeviceName(deviceName) {
  if (!deviceName) return null;
  const s = String(deviceName).trim();
  if (s.length === 0) return null;
  if (DEVICE_NAME_PREFIX_RE.test(s)) {
    const name = s.replace(DEVICE_NAME_PREFIX_RE, '').trim();
    if (name.length >= 3 && !/^(desconhecido|test|admin|aluno teste)$/i.test(name)) {
      return name;
    }
    return null;
  }
  // Nome direto: primeira letra maiúscula, tem espaço, sem números/símbolos.
  if (/^[A-ZÁÉÍÓÚÂÊÔÇ][a-záéíóúâêôç]/.test(s) && s.includes(' ') && !/[0-9(),]/.test(s)) {
    return s;
  }
  return null;
}
