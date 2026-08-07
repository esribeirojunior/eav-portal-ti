import { describe, it, expect } from 'vitest';
import { inferLastUserFromDeviceName } from './device-names.js';

describe('inferLastUserFromDeviceName', () => {
  it('extrai nome do padrão "MacBook ... de <NOME>"', () => {
    expect(inferLastUserFromDeviceName('MacBook Air de Renata Pereira')).toBe('Renata Pereira');
    expect(inferLastUserFromDeviceName('Mac de Camila Lopes')).toBe('Camila Lopes');
    expect(inferLastUserFromDeviceName('Mac mini de João Silva')).toBe('João Silva');
  });

  it('aceita nome próprio direto (sem prefixo)', () => {
    expect(inferLastUserFromDeviceName('Eduardo de Souza Rodrigues')).toBe(
      'Eduardo de Souza Rodrigues'
    );
    expect(inferLastUserFromDeviceName('Maria Sofia Lellis Kfuri')).toBe('Maria Sofia Lellis Kfuri');
  });

  it('rejeita nomes genéricos/de teste', () => {
    expect(inferLastUserFromDeviceName('aluno teste')).toBeNull();
    expect(inferLastUserFromDeviceName('MacBook de admin')).toBeNull();
    expect(inferLastUserFromDeviceName('Mac de test')).toBeNull();
  });

  it('rejeita strings que não parecem nome', () => {
    expect(inferLastUserFromDeviceName('MacBookAir10,1')).toBeNull();
    expect(inferLastUserFromDeviceName('LAPTOP-4KYGJG4')).toBeNull();
    expect(inferLastUserFromDeviceName('')).toBeNull();
    expect(inferLastUserFromDeviceName(null)).toBeNull();
  });
});
