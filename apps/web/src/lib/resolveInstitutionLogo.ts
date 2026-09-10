import {
  INSTITUTION_ALIASES,
  INSTITUTION_STOPWORD_SET,
} from '@finance/shared-ui-tokens';

export type IconResult =
  | {
      type: 'logo';
      domain: string;
      urls: string[];
      matchedBy: 'exact' | 'fuzzy' | 'domain-guess';
    }
  | {
      type: 'initials';
      initials: string;
      color: string;
      name: string;
    };

export interface ResolveOptions {
  probeTimeout?: number;
  customProbe?: (domain: string) => Promise<boolean>;
}

/**
 * In-memory session cache keyed by raw institution input string.
 * Cleared on page reload. Never written to DB or localStorage.
 */
const sessionIconCache = new Map<string, IconResult>();

/**
 * Clears the session cache (primarily for unit testing).
 */
export function clearInstitutionIconCache(): void {
  sessionIconCache.clear();
}

/**
 * Normalizes input string: lowercase, replace & with 'and', strip punctuation, collapse whitespace.
 */
export function normalizeInstitutionName(input: string): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Strips stopwords, leaving the core distinctive token(s).
 * If all words are stopwords, returns the normalized string.
 */
export function extractCoreTokens(normalized: string): string {
  if (!normalized) return '';
  const words = normalized.split(' ').filter(Boolean);
  const filtered = words.filter((w) => !INSTITUTION_STOPWORD_SET.has(w));
  if (filtered.length > 0) {
    return filtered.join(' ');
  }
  return normalized;
}

/**
 * Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/**
 * Calculate similarity between 0 and 1 using Levenshtein distance and token overlap.
 */
export function calculateSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;

  const levDist = levenshteinDistance(s1, s2);
  const levSim = 1 - levDist / maxLen;

  // Check token overlap
  const words1 = new Set(s1.split(' ').filter(Boolean));
  const words2 = new Set(s2.split(' ').filter(Boolean));
  let overlap = 0;
  for (const w of words1) {
    if (words2.has(w)) overlap++;
  }
  const union = new Set([...words1, ...words2]).size;
  const jaccard = union > 0 ? overlap / union : 0;

  // If one string contains the other and length is meaningful
  const containsSim =
    (s1.includes(s2) || s2.includes(s1)) && Math.min(s1.length, s2.length) >= 3
      ? Math.min(s1.length, s2.length) / maxLen
      : 0;

  return Math.max(levSim, jaccard, containsSim);
}

/**
 * Pre-computes exact alias -> domain lookup table for fast O(1) matching.
 */
const aliasToDomainMap = new Map<string, string>();
for (const [domain, aliases] of Object.entries(INSTITUTION_ALIASES)) {
  aliasToDomainMap.set(domain.toLowerCase(), domain);
  for (const alias of aliases) {
    const norm = normalizeInstitutionName(alias);
    if (norm) aliasToDomainMap.set(norm, domain);
    const core = extractCoreTokens(norm);
    if (core) aliasToDomainMap.set(core, domain);
  }
}

/**
 * Ordered fallback chain of icon URLs for a domain:
 * 1. Google Favicons (high-res 128px)
 * 2. DuckDuckGo Icons (standard ico)
 */
export function buildIconUrls(domain: string): string[] {
  return [
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`,
    `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`,
  ];
}

/**
 * Deterministic HSL color based on string hash.
 */
export function getDeterministicColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 65%, 40%)`;
}

/**
 * Extracts 1-2 uppercase letters for initials avatar.
 */
export function getInitials(name: string): string {
  const clean = name.replace(/[^\w\s]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length === 1) {
    return parts[0].toUpperCase();
  }
  return 'AC';
}

/**
 * In-browser favicon probe helper. Uses DuckDuckGo endpoint which returns 404 for nonexistent domains.
 */
async function probeFavicon(domain: string, timeout = 1200): Promise<boolean> {
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return false;
  }
  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        img.src = '';
        resolve(false);
      }
    }, timeout);

    img.onload = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(img.naturalWidth > 0);
      }
    };

    img.onerror = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(false);
      }
    };

    img.src = `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
  });
}

/**
 * Resolve institution icon from raw institution name.
 * 
 * Pipeline:
 * 1. Cache check
 * 2. Normalization
 * 3. Stopwords stripping -> Core token
 * 4. Exact alias match
 * 5. Fuzzy match (Levenshtein + token overlap >= 0.75)
 * 6. Dynamic domain guessing (.com, .in, .co.in probe)
 * 7. Fallback initials avatar with deterministic HSL background
 */
export async function resolveInstitutionIcon(
  rawInstitutionName?: string | null,
  options: ResolveOptions = {}
): Promise<IconResult> {
  const raw = (rawInstitutionName || '').trim();
  if (!raw) {
    return {
      type: 'initials',
      initials: 'AC',
      color: 'hsl(215, 65%, 40%)',
      name: 'Account',
    };
  }

  // 1. Session Cache check
  const cached = sessionIconCache.get(raw);
  if (cached) {
    return cached;
  }

  // 2. Normalize
  const normalized = normalizeInstitutionName(raw);

  // 3. Stopword stripping -> core token
  const coreToken = extractCoreTokens(normalized);

  // 4. Exact match
  const exactDomain =
    aliasToDomainMap.get(coreToken) ||
    aliasToDomainMap.get(normalized) ||
    aliasToDomainMap.get(raw.toLowerCase());

  if (exactDomain) {
    const result: IconResult = {
      type: 'logo',
      domain: exactDomain,
      urls: buildIconUrls(exactDomain),
      matchedBy: 'exact',
    };
    sessionIconCache.set(raw, result);
    return result;
  }

  // 5. Fuzzy match against all aliases (threshold >= 0.75)
  let bestScore = 0;
  let bestDomain: string | null = null;
  const FUZZY_THRESHOLD = 0.75;

  for (const [domain, aliases] of Object.entries(INSTITUTION_ALIASES)) {
    for (const alias of aliases) {
      const normAlias = normalizeInstitutionName(alias);
      const scoreWithCore = calculateSimilarity(coreToken, normAlias);
      const scoreWithNorm = calculateSimilarity(normalized, normAlias);
      const score = Math.max(scoreWithCore, scoreWithNorm);

      if (score > bestScore) {
        bestScore = score;
        bestDomain = domain;
      }
    }
  }

  if (bestDomain && bestScore >= FUZZY_THRESHOLD) {
    const result: IconResult = {
      type: 'logo',
      domain: bestDomain,
      urls: buildIconUrls(bestDomain),
      matchedBy: 'fuzzy',
    };
    sessionIconCache.set(raw, result);
    return result;
  }

  // 6. Dynamic domain guessing (if cleaned token has 3+ characters)
  const cleanWord = coreToken.replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  if (cleanWord.length >= 3) {
    const candidates = [`${cleanWord}.com`, `${cleanWord}.in`, `${cleanWord}.co.in`];
    const probeFn = options.customProbe || probeFavicon;

    for (const candidate of candidates) {
      try {
        const ok = await probeFn(candidate);
        if (ok) {
          const result: IconResult = {
            type: 'logo',
            domain: candidate,
            urls: buildIconUrls(candidate),
            matchedBy: 'domain-guess',
          };
          sessionIconCache.set(raw, result);
          return result;
        }
      } catch {
        // Probe failed, continue next candidate
      }
    }
  }

  // 7. Fallback: Initials Avatar
  const result: IconResult = {
    type: 'initials',
    initials: getInitials(coreToken || raw),
    color: getDeterministicColor(raw),
    name: raw,
  };
  sessionIconCache.set(raw, result);
  return result;
}
