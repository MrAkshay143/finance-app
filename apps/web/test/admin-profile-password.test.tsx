import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { generateSecurePassword, validatePassword } from '../src/utils/validation.js';
import { AdminProfilePage } from '../src/pages/AdminProfilePage.js';

describe('Admin Profile Password Generator & UI Parity (Track 1)', () => {
  describe('generateSecurePassword utility', () => {
    it('generates a password of default length 16', () => {
      const password = generateSecurePassword();
      expect(password).toHaveLength(16);
    });

    it('enforces minimum length of 14', () => {
      const passwordShort = generateSecurePassword(8);
      expect(passwordShort).toHaveLength(14);
    });

    it('generates passwords of custom length >= 14', () => {
      const password24 = generateSecurePassword(24);
      expect(password24).toHaveLength(24);
    });

    it('guarantees at least 2 characters from each pool and excludes ambiguous characters', () => {
      const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
      const LOWER = 'abcdefghjkmnpqrstuvwxyz';
      const NUMBERS = '23456789';
      const SPECIAL = '!@#$%^&*()_+-=[]{};:';

      for (let i = 0; i < 20; i++) {
        const password = generateSecurePassword(16);

        // Excludes ambiguous characters
        expect(password).not.toMatch(/[IOlo01]/);

        // Count characters from each pool
        const upperCount = [...password].filter((c) => UPPER.includes(c)).length;
        const lowerCount = [...password].filter((c) => LOWER.includes(c)).length;
        const numCount = [...password].filter((c) => NUMBERS.includes(c)).length;
        const specialCount = [...password].filter((c) => SPECIAL.includes(c)).length;

        expect(upperCount).toBeGreaterThanOrEqual(2);
        expect(lowerCount).toBeGreaterThanOrEqual(2);
        expect(numCount).toBeGreaterThanOrEqual(2);
        expect(specialCount).toBeGreaterThanOrEqual(2);

        // Validates with validatePassword as Strong
        const validation = validatePassword(password);
        expect(validation.isValid).toBe(true);
        expect(validation.score).toBe(5);
        expect(validation.strengthLabel).toBe('Strong');
      }
    });

    it('produces distinct passwords across runs', () => {
      const p1 = generateSecurePassword();
      const p2 = generateSecurePassword();
      expect(p1).not.toBe(p2);
    });
  });

  describe('AdminProfilePage UI Parity', () => {
    it('renders Generate Secure Password button and standardized 4-segment strength meter and 2-column checklist', () => {
      const qc = new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: Infinity },
        },
      });

      const html = renderToString(
        <QueryClientProvider client={qc}>
          <MemoryRouter initialEntries={['/admin/profile']}>
            <AdminProfilePage />
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Section Header
      expect(html).toContain('Change Password');

      // Generate Password Button
      expect(html).toContain('Generate Secure Password');

      // 4-segment grid
      expect(html).toContain('grid grid-cols-4 gap-1.5 h-1.5');

      // 2-column checklist
      expect(html).toContain('grid grid-cols-2 gap-x-2 gap-y-1.5 pt-0.5 text-[11px]');

      // Criteria items
      expect(html).toContain('8+ characters');
      expect(html).toContain('Uppercase (A-Z)');
      expect(html).toContain('Lowercase (a-z)');
      expect(html).toContain('One number (0-9)');
      expect(html).toContain('Special symbol (!@#$)');

      // Labels
      expect(html).toContain('New Password');
      expect(html).toContain('Confirm New Password');
    });
  });
});
