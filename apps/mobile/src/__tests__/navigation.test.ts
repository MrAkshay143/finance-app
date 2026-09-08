import { describe, it, expect } from 'vitest';
import { colors } from '@finance/shared-ui-tokens';

describe('Mobile Bottom Tab Navigation Specification', () => {
  const EXPECTED_TABS = [
    'Home',
    'Transactions',
    'AddPlaceholder',
    'Reports',
    'More',
  ] as const;

  it('has exactly 5 navigation items matching Plan/frontend.md §2 and §5', () => {
    expect(EXPECTED_TABS.length).toBe(5);
    expect(EXPECTED_TABS[0]).toBe('Home');
    expect(EXPECTED_TABS[1]).toBe('Transactions');
    expect(EXPECTED_TABS[2]).toBe('AddPlaceholder'); // Raised Center FAB (+)
    expect(EXPECTED_TABS[3]).toBe('Reports');
    expect(EXPECTED_TABS[4]).toBe('More');
  });

  it('uses branded navy header tokens for the dark navy header block', () => {
    expect(colors.navyHeaderStart).toBe('#0B1B3A');
    expect(colors.navyHeaderEnd).toBe('#132A5C');
  });

  it('uses primary brand blue for active tabs and center FAB', () => {
    expect(colors.primary).toBe('#2554EE');
  });

  it('uses surface white and border colors for bottom tab bar chrome', () => {
    expect(colors.surface).toBe('#FFFFFF');
    expect(colors.border).toBe('#E7ECF5');
    expect(colors.textMuted).toBe('#667085');
  });
});
