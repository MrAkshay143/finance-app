import { describe, it, expect } from 'vitest';
import * as Icons from '../components/icons';
import fs from 'fs';
import path from 'path';

describe('Icons & Production Readiness Rules', () => {
  it('exports only valid vector icon components (no emojis)', () => {
    const iconNames = Object.keys(Icons);
    expect(iconNames.length).toBeGreaterThanOrEqual(7);

    for (const name of iconNames) {
      const component = (Icons as Record<string, any>)[name];
      expect(typeof component).toBe('function');
    }
  });

  it('contains strictly zero emojis in mobile source files', () => {
    const srcDir = path.resolve(__dirname, '..');
    const files: string[] = [];

    function collectFiles(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== '__tests__' && entry.name !== 'node_modules') {
            collectFiles(fullPath);
          }
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    }

    collectFiles(srcDir);
    expect(files.length).toBeGreaterThan(0);

    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const hasEmoji = emojiRegex.test(content);
      expect(hasEmoji, `Emoji found in ${path.basename(file)}`).toBe(false);
    }
  });

  it('contains zero banned placeholder phrases in mobile source files', () => {
    const srcDir = path.resolve(__dirname, '..');
    const files: string[] = [];

    function collectFiles(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== '__tests__' && entry.name !== 'node_modules') {
            collectFiles(fullPath);
          }
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    }

    collectFiles(srcDir);

    const bannedKeywords = [
      ['coming', 'soon'].join(' '),
      ['coming', 'in', 'v2'].join(' '),
      ['sample', 'data'].join(' '),
      ['demo', 'data'].join(' '),
      ['lorem', 'ipsum'].join(' '),
    ];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8').toLowerCase();
      for (const keyword of bannedKeywords) {
        expect(
          content.includes(keyword),
          `Banned phrase "${keyword}" found in ${path.basename(file)}`
        ).toBe(false);
      }
    }
  });
});
