import { describe, it, expect } from 'vitest';
import {
  DEVICE_STATUS,
  DEVICE_STATUS_ORDER,
  DEVICE_STATUS_META,
  DEVICE_STATUS_TRANSITIONS,
} from './deviceStatus';

describe('DEVICE_STATUS (contrato de valores)', () => {
  it('mantém as strings canônicas que o banco usa', () => {
    // Se alguém mudar esses valores, quebra o filtro de status em produção.
    expect(DEVICE_STATUS.STOCK_SEALED).toBe('Estoque - Lacrado');
    expect(DEVICE_STATUS.AVAILABLE).toBe('Disponível');
    expect(DEVICE_STATUS.IN_USE).toBe('Em Uso');
    expect(DEVICE_STATUS.MAINTENANCE).toBe('Manutenção');
    expect(DEVICE_STATUS.RETIRED).toBe('Descartado');
  });

  it('todo status na ordem de exibição tem metadata', () => {
    for (const status of DEVICE_STATUS_ORDER) {
      expect(DEVICE_STATUS_META[status]).toBeDefined();
      expect(DEVICE_STATUS_META[status].label).toBeTruthy();
      expect(DEVICE_STATUS_META[status].color).toBeTruthy();
    }
  });

  it('todo status tem transições declaradas (mesmo que vazia)', () => {
    for (const status of DEVICE_STATUS_ORDER) {
      expect(Array.isArray(DEVICE_STATUS_TRANSITIONS[status])).toBe(true);
    }
  });

  it('Descartado é estado terminal (sem transições)', () => {
    expect(DEVICE_STATUS_TRANSITIONS[DEVICE_STATUS.RETIRED]).toEqual([]);
  });

  it('Estoque Lacrado pode ir para Disponível (fluxo de preparação)', () => {
    expect(DEVICE_STATUS_TRANSITIONS[DEVICE_STATUS.STOCK_SEALED]).toContain(
      DEVICE_STATUS.AVAILABLE
    );
  });

  it('toda transição aponta para um status válido', () => {
    const valid = new Set(Object.values(DEVICE_STATUS));
    for (const [, targets] of Object.entries(DEVICE_STATUS_TRANSITIONS)) {
      for (const t of targets) expect(valid.has(t)).toBe(true);
    }
  });
});
