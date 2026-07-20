// Valores canônicos dos estados do dispositivo. Fonte da verdade compartilhada
// entre frontend e backend. Preserva strings existentes no banco pra não exigir
// migração; novos estados (STOCK_SEALED, RETIRED) são aditivos.

export const DEVICE_STATUS = {
  STOCK_SEALED: 'Estoque - Lacrado',
  AVAILABLE: 'Disponível',
  IN_USE: 'Em Uso',
  MAINTENANCE: 'Manutenção',
  RETIRED: 'Descartado',
} as const;

export type DeviceStatusValue = typeof DEVICE_STATUS[keyof typeof DEVICE_STATUS];

// Ordem de exibição em UIs (sidebar, filtros, breakdowns).
export const DEVICE_STATUS_ORDER: DeviceStatusValue[] = [
  DEVICE_STATUS.STOCK_SEALED,
  DEVICE_STATUS.AVAILABLE,
  DEVICE_STATUS.IN_USE,
  DEVICE_STATUS.MAINTENANCE,
  DEVICE_STATUS.RETIRED,
];

// Labels curtos e cores usados na sidebar e badges.
export const DEVICE_STATUS_META: Record<DeviceStatusValue, { label: string; short: string; color: string }> = {
  [DEVICE_STATUS.STOCK_SEALED]: { label: 'Estoque Lacrado',  short: 'Lacrado',     color: 'amber'   },
  [DEVICE_STATUS.AVAILABLE]:    { label: 'Disponível',       short: 'Disponível',  color: 'emerald' },
  [DEVICE_STATUS.IN_USE]:       { label: 'Em Uso',           short: 'Em Uso',      color: 'indigo'  },
  [DEVICE_STATUS.MAINTENANCE]:  { label: 'Em Manutenção',    short: 'Manutenção',  color: 'orange'  },
  [DEVICE_STATUS.RETIRED]:      { label: 'Descartado',       short: 'Descartado',  color: 'slate'   },
};

// Transições permitidas na UI (fluxo esperado). Não é enforcement de banco --
// só orienta quais botões mostrar em cada estado.
export const DEVICE_STATUS_TRANSITIONS: Record<DeviceStatusValue, DeviceStatusValue[]> = {
  [DEVICE_STATUS.STOCK_SEALED]: [DEVICE_STATUS.AVAILABLE, DEVICE_STATUS.RETIRED],
  [DEVICE_STATUS.AVAILABLE]:    [DEVICE_STATUS.IN_USE, DEVICE_STATUS.MAINTENANCE, DEVICE_STATUS.RETIRED],
  [DEVICE_STATUS.IN_USE]:       [DEVICE_STATUS.AVAILABLE, DEVICE_STATUS.MAINTENANCE],
  [DEVICE_STATUS.MAINTENANCE]:  [DEVICE_STATUS.AVAILABLE, DEVICE_STATUS.RETIRED],
  [DEVICE_STATUS.RETIRED]:      [],
};
