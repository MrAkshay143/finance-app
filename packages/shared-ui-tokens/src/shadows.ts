export const shadows = {
  card: '0 2px 8px rgba(16, 24, 40, 0.06)',
  cardHover: '0 4px 16px rgba(16, 24, 40, 0.08)',
  modal: '0 12px 32px rgba(11, 27, 58, 0.16)',
  fab: '0 4px 14px rgba(37, 84, 238, 0.40)',
  header: '0 4px 20px rgba(11, 27, 58, 0.12)',
} as const;

export type ShadowToken = keyof typeof shadows;
