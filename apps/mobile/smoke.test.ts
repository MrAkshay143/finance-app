import { describe, it, expect } from 'vitest';
import { colors } from '@finance/shared-ui-tokens';

describe('Mobile Smoke Test', () => {
  it('loads design tokens correctly', () => {
    expect(colors.primary).toBe('#2554EE');
  });
});
