import { describe, it, expect } from 'vitest';
import { isValidIdentifier, ALLOWED_TABLES } from './db.js';

describe('blindagem SQLi do /api/db', () => {
  it('aceita identificadores de coluna legítimos', () => {
    for (const col of ['tag', 'serial_number', 'user_email', 'created_at', 'device_id', 'id', 'modules']) {
      expect(isValidIdentifier(col)).toBe(true);
    }
  });

  it('rejeita payloads de SQL injection', () => {
    const payloads = [
      '1=1 OR pg_sleep(5)',
      'id; DROP TABLE devices;--',
      '(SELECT password FROM authorized_users LIMIT 1)',
      'public.authorized_users', // bypass por schema-qualified
      'tag) OR (1=1',
      'col--comment',
      '',
      'a'.repeat(64), // acima do limite de 63
    ];
    for (const p of payloads) {
      expect(isValidIdentifier(p)).toBe(false);
    }
  });

  it('rejeita não-strings', () => {
    expect(isValidIdentifier(null as any)).toBe(false);
    expect(isValidIdentifier(undefined as any)).toBe(false);
    expect(isValidIdentifier(123 as any)).toBe(false);
  });

  it('allowlist contém as tabelas reais do portal e não permite tabelas arbitrárias', () => {
    expect(ALLOWED_TABLES.has('devices')).toBe(true);
    expect(ALLOWED_TABLES.has('authorized_users')).toBe(true);
    expect(ALLOWED_TABLES.has('vault_secrets')).toBe(true);
    // Tabelas de outros sistemas no mesmo banco (n8n) NÃO entram.
    expect(ALLOWED_TABLES.has('workflow_entity')).toBe(false);
    expect(ALLOWED_TABLES.has('user_sessions')).toBe(false);
    expect(ALLOWED_TABLES.has('public.authorized_users')).toBe(false);
  });
});
