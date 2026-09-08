#!/usr/bin/env node

/**
 * scripts/check-placeholders.cjs
 * Cross-platform Zero-Placeholder & Unicode Emoji Grep Gate
 *
 * Rules:
 * - Scans apps/ and packages/
 * - Excludes node_modules, dist, .git, Plan, UI Snaps, prd.md, binary files, lockfiles
 * - Strictly fails if any banned phrases appear in source code (case-insensitive):
 *   "coming soon", "coming in v2", "beta (v2)", "preview", "TODO", "sample data", "demo data", "lorem ipsum"
 * - Strictly fails if any Unicode emoji characters appear in UI / source code
 * - Reports filename, line number, and matching line content
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const SCAN_TARGETS = ['apps', 'packages'];

const EXCLUDED_DIR_NAMES = new Set([
  'node_modules',
  'dist',
  '.git',
  'Plan',
  'UI Snaps',
  '.turbo',
  '.next',
  'build',
  'coverage',
  '.cache'
]);

const EXCLUDED_FILE_NAMES = new Set([
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'prd.md',
  '.DS_Store'
]);

const EXCLUDED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
  '.woff', '.woff2', '.ttf', '.eot',
  '.mp4', '.webm', '.mp3', '.wav',
  '.pdf', '.zip', '.tar', '.gz', '.7z',
  '.map'
]);

// Banned phrases per spec (case-insensitive)
const BANNED_PATTERNS = [
  { label: 'Coming soon', regex: /\bcoming\s+soon\b/i },
  { label: 'Coming in V2', regex: /\bcoming\s+in\s+v2\b/i },
  { label: 'Beta (V2)', regex: /\bbeta\s*\(\s*v2\s*\)/i },
  { label: 'Preview', regex: /\bpreview\b/i },
  { label: 'TODO', regex: /\btodo\b/i },
  { label: 'Sample data', regex: /\bsample\s+data\b/i },
  { label: 'Demo data', regex: /\bdemo\s+data\b/i },
  { label: 'Lorem ipsum', regex: /\blorem\s+ipsum\b/i },
];

// Emoji regex matching pictographic and symbol emojis
const EMOJI_REGEX = /(?:\p{Extended_Pictographic}|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}])/u;

// Allowed legal/typographic symbols that have pictographic properties in unicode
const ALLOWED_SYMBOLS = new Set(['\u00A9', '\u00AE', '\u2122']);

function findEmojiMatch(line) {
  const matches = line.match(new RegExp(EMOJI_REGEX.source, 'gu'));
  if (!matches) return null;
  for (const m of matches) {
    if (!ALLOWED_SYMBOLS.has(m)) {
      return m;
    }
  }
  return null;
}

function collectFiles(dirPath, fileList = []) {
  if (!fs.existsSync(dirPath)) return fileList;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDED_DIR_NAMES.has(entry.name)) {
        continue;
      }
      collectFiles(fullPath, fileList);
    } else if (entry.isFile()) {
      if (EXCLUDED_FILE_NAMES.has(entry.name)) {
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (EXCLUDED_EXTENSIONS.has(ext)) {
        continue;
      }
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function runGate() {
  console.log('='.repeat(70));
  console.log('🔍 ZERO-PLACEHOLDER & EMOJI GREP GATE');
  console.log('='.repeat(70));
  console.log(`Scanning targets: ${SCAN_TARGETS.join(', ')}`);
  console.log(`Root directory:   ${ROOT_DIR}`);
  console.log('-'.repeat(70));

  const allFiles = [];
  for (const target of SCAN_TARGETS) {
    const targetPath = path.join(ROOT_DIR, target);
    collectFiles(targetPath, allFiles);
  }

  console.log(`Total candidate files to scan: ${allFiles.length}`);

  const violations = [];

  for (const filePath of allFiles) {
    const relativePath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
    let content = '';
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      // If unable to read as utf8, skip binary
      continue;
    }

    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check banned phrases
      for (const pattern of BANNED_PATTERNS) {
        if (pattern.regex.test(line)) {
          violations.push({
            file: relativePath,
            line: lineNumber,
            type: 'BANNED_PHRASE',
            label: pattern.label,
            snippet: line.trim()
          });
        }
      }

      // Check Unicode emojis
      const emojiChar = findEmojiMatch(line);
      if (emojiChar) {
        violations.push({
          file: relativePath,
          line: lineNumber,
          type: 'EMOJI',
          label: `Unicode emoji '${emojiChar}' (U+${emojiChar.codePointAt(0).toString(16).toUpperCase()})`,
          snippet: line.trim()
        });
      }
    }
  }

  console.log(`Scanned ${allFiles.length} files across ${SCAN_TARGETS.join(' and ')}.`);

  if (violations.length > 0) {
    console.error('\n' + '!'.repeat(70));
    console.error(`❌ VIOLATIONS FOUND: ${violations.length} occurrence(s) detected:`);
    console.error('!'.repeat(70) + '\n');

    for (const v of violations) {
      console.error(`  - ${v.file}:${v.line} [${v.type}: ${v.label}]`);
      console.error(`      ${v.snippet}`);
    }

    console.error('\n' + '!'.repeat(70));
    console.error('GATE FAILED: Shipped code must not contain placeholders or emojis.');
    console.error('!'.repeat(70));
    process.exit(1);
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ ZERO-PLACEHOLDER & EMOJI GATE PASSED (0 violations found).');
  console.log('='.repeat(70));
  process.exit(0);
}

runGate();
