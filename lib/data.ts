// Developer brand colours — used across map markers, filter chips, and legend.
export const DEVELOPER_COLORS: Record<string, string> = {
  Emaar:     '#3b82f6',
  Damac:     '#8b5cf6',
  Nakheel:   '#10b981',
  Meraas:    '#f97316',
  Sobha:     '#ec4899',
  Aldar:     '#06b6d4',
  Ellington: '#f59e0b',
  Other:     '#64748b',
};

export function devColor(dev: string): string {
  return DEVELOPER_COLORS[dev] ?? DEVELOPER_COLORS.Other;
}
