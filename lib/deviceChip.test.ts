import { describe, it, expect } from 'vitest';
import { extractChip, chipColor } from './deviceChip';

describe('extractChip', () => {
  it('extrai o chip do formato padrão do Mosyle', () => {
    expect(extractChip('MacBook Air (13-inch, M2, 2022)')).toBe('M2');
    expect(extractChip('Mac mini (M4, 2024)')).toBe('M4');
    expect(extractChip('MacBook Air (M1, 2020)')).toBe('M1');
  });

  it('reconhece variantes Pro/Max/Ultra', () => {
    expect(extractChip('MacBook Pro (14-inch, M3 Pro, Nov 2023)')).toBe('M3 Pro');
    expect(extractChip('MacBook Pro M4 Max')).toBe('M4 Max');
  });

  it('reconhece Intel', () => {
    expect(extractChip('Intel MacBook Pro')).toBe('Intel');
  });

  it('retorna null quando não há chip identificável', () => {
    expect(extractChip('MacBook Air 2020')).toBeNull();
    expect(extractChip('Dell Latitude 3440')).toBeNull();
    expect(extractChip('')).toBeNull();
    expect(extractChip(null)).toBeNull();
    expect(extractChip(undefined)).toBeNull();
  });

  it('não confunde números de modelo com chip', () => {
    // "MacBookAir10,1" tem "10,1" mas não é "M<n>"
    expect(extractChip('MacBookAir10,1')).toBeNull();
  });
});

describe('chipColor', () => {
  it('retorna classes distintas por geração de chip', () => {
    expect(chipColor('M1')).toContain('blue');
    expect(chipColor('M2')).toContain('emerald');
    expect(chipColor('M3')).toContain('purple');
    expect(chipColor('M4')).toContain('amber');
    expect(chipColor('Intel')).toContain('slate');
  });

  it('aplica a cor da geração base mesmo com variante', () => {
    expect(chipColor('M3 Pro')).toContain('purple');
    expect(chipColor('M4 Max')).toContain('amber');
  });

  it('retorna string vazia quando chip é null', () => {
    expect(chipColor(null)).toBe('');
  });
});
