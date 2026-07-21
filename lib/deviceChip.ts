// Utilitario pra extrair o chip Apple (M1/M2/M3/M4/etc) do campo model.
//
// Exemplos que reconhece:
//   "MacBook Air (13-inch, M2, 2022)"   -> "M2"
//   "MacBook Air M1, 2020"              -> "M1"
//   "Mac mini (M4, 2024)"               -> "M4"
//   "MacBook Pro (14-inch, M3 Pro, ...)"-> "M3 Pro"
//   "MacBook Pro M4 Max"                -> "M4 Max"
//   "MacBook Air 2020"                  -> null (nenhum chip mencionado)
//   "Intel MacBook Pro"                 -> "Intel"
// Retorna null se nao achar chip identificavel.

const CHIP_RE = /\bM([1-9])(?:\s+(Pro|Max|Ultra))?\b/i;

export function extractChip(model?: string | null): string | null {
  if (!model) return null;
  const s = String(model);
  // Intel primeiro (nao segue o padrao M<n>)
  if (/\bintel\b/i.test(s)) return 'Intel';
  const m = s.match(CHIP_RE);
  if (!m) return null;
  const base = 'M' + m[1];
  return m[2] ? `${base} ${m[2].replace(/^./, c => c.toUpperCase())}` : base;
}

// Cor Tailwind sugerida para o badge. Chips mais novos = cor mais quente.
export function chipColor(chip: string | null): string {
  if (!chip) return '';
  if (chip === 'Intel') return 'bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300 border-slate-300 dark:border-slate-500/30';
  if (chip.startsWith('M1')) return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
  if (chip.startsWith('M2')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
  if (chip.startsWith('M3')) return 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-500/20';
  if (chip.startsWith('M4')) return 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
  return 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white/70 border-slate-300 dark:border-white/20';
}
