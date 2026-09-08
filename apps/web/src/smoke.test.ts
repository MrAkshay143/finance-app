import { describe, it, expect } from 'vitest';
import { colors } from '@finance/shared-ui-tokens';

describe('Web Smoke Test', () => {
  it('loads design tokens correctly', () => {
    expect(colors.primary).toBe('#2554EE');
    expect(colors.navyHeaderStart).toBe('#0B1B3A');
  });
});
