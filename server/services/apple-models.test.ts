import { describe, it, expect } from 'vitest';
import { getFriendlyAppleModelName } from './apple-models.js';

describe('getFriendlyAppleModelName', () => {
  it('traduz identificadores conhecidos', () => {
    expect(getFriendlyAppleModelName('Mac14,2')).toBe('MacBook Air (13-inch, M2, 2022)');
    expect(getFriendlyAppleModelName('MacBookAir10,1')).toBe('MacBook Air (M1, 2020)');
    expect(getFriendlyAppleModelName('Mac16,12')).toBe('Mac mini (M4, 2024)');
    expect(getFriendlyAppleModelName('iPad14,1')).toBe('iPad mini (6th gen)');
  });

  it('é case-insensitive e ignora espaços', () => {
    expect(getFriendlyAppleModelName('  mac14,2  ')).toBe('MacBook Air (13-inch, M2, 2022)');
  });

  it('retorna o identificador original quando não mapeado', () => {
    expect(getFriendlyAppleModelName('Mac99,9')).toBe('Mac99,9');
  });

  it('retorna "Desconhecido" para vazio/nulo', () => {
    expect(getFriendlyAppleModelName('')).toBe('Desconhecido');
    expect(getFriendlyAppleModelName(null)).toBe('Desconhecido');
    expect(getFriendlyAppleModelName(undefined)).toBe('Desconhecido');
  });
});
