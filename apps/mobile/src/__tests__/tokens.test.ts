import { describe, it, expect } from 'vitest';
import { colors, radii, shadows, spacing } from '@finance/shared-ui-tokens';

describe('Mobile Design Tokens Test', () => {
  it('loads color tokens correctly', () => {
    expect(colors.primary).toBe('#2554EE');
    expect(colors.navyHeaderStart).toBe('#0B1B3A');
    expect(colors.navyHeaderEnd).toBe('#132A5C');
    expect(colors.background).toBe('#F3F6FC');
    expect(colors.surface).toBe('#FFFFFF');
    expect(colors.border).toBe('#E7ECF5');
  });

  it('loads radii tokens correctly', () => {
    expect(radii.card).toBe('18px');
    expect(radii.modal).toBe('20px');
    expect(radii.pill).toBe('9999px');
  });

  it('loads shadow and spacing tokens correctly', () => {
    expect(shadows.fab).toBe('0 4px 14px rgba(37, 84, 238, 0.40)');
    expect(spacing[4]).toBe('16px');
  });
});
