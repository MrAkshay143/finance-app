import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolveInstitutionIcon,
  clearInstitutionIconCache,
  normalizeInstitutionName,
  extractCoreTokens,
  calculateSimilarity,
  getDeterministicColor,
  getInitials,
} from '../src/lib/resolveInstitutionLogo.js';
import { detectCardNetwork } from '../src/lib/cardNetwork.js';

describe('Institution Logo & Card Network Resolution Pipeline', () => {
  beforeEach(() => {
    clearInstitutionIconCache();
  });

  describe('1. Normalization & Stopword Stripping', () => {
    it('normalizes casing, punctuation, and whitespace', () => {
      expect(normalizeInstitutionName('  H.D.F.C. & Bank  ')).toBe('h d f c and bank');
      expect(normalizeInstitutionName('State Bank of India (SBI)')).toBe('state bank of india sbi');
    });

    it('strips stopwords leaving the core distinctive token', () => {
      expect(extractCoreTokens('hdfc salary account')).toBe('hdfc');
      expect(extractCoreTokens('state bank of india')).toBe('state');
      expect(extractCoreTokens('icici savings bank account')).toBe('icici');
    });

    it('falls back to normalized string if all words are stopwords', () => {
      expect(extractCoreTokens('bank')).toBe('bank');
      expect(extractCoreTokens('personal account')).toBe('personal account');
    });
  });

  describe('2. Exact Matching against Alias Table', () => {
    it('exact-matches popular Indian public sector banks', async () => {
      const sbi = await resolveInstitutionIcon('SBI');
      expect(sbi.type).toBe('logo');
      if (sbi.type === 'logo') {
        expect(sbi.domain).toBe('sbi.co.in');
        expect(sbi.urls[0]).toContain('sbi.co.in');
        expect(sbi.matchedBy).toBe('exact');
      }

      const stateBank = await resolveInstitutionIcon('State Bank of India');
      expect(stateBank.type).toBe('logo');
      if (stateBank.type === 'logo') {
        expect(stateBank.domain).toBe('sbi.co.in');
        expect(stateBank.urls[0]).toContain('sbi.co.in');
        expect(stateBank.urls.some((u) => u.includes('onlinesbi.sbi'))).toBe(true);
        expect(stateBank.matchedBy).toBe('exact');
      }

      const pnb = await resolveInstitutionIcon('PNB');
      expect(pnb.type).toBe('logo');
      if (pnb.type === 'logo') {
        expect(pnb.domain).toBe('pnbindia.in');
      }

      const bob = await resolveInstitutionIcon('Bank of Baroda');
      expect(bob.type).toBe('logo');
      if (bob.type === 'logo') {
        expect(bob.domain).toBe('bankofbaroda.in');
      }
    });

    it('exact-matches Indian private banks', async () => {
      const hdfc = await resolveInstitutionIcon('HDFC Bank');
      expect(hdfc.type).toBe('logo');
      if (hdfc.type === 'logo') {
        expect(hdfc.domain).toBe('hdfcbank.com');
      }

      const icici = await resolveInstitutionIcon('ICICI Bank');
      expect(icici.type).toBe('logo');
      if (icici.type === 'logo') {
        expect(icici.domain).toBe('icicibank.com');
      }

      const axis = await resolveInstitutionIcon('Axis Bank');
      expect(axis.type).toBe('logo');
      if (axis.type === 'logo') {
        expect(axis.domain).toBe('axisbank.com');
      }

      const kotak = await resolveInstitutionIcon('Kotak Mahindra Bank');
      expect(kotak.type).toBe('logo');
      if (kotak.type === 'logo') {
        expect(kotak.domain).toBe('kotak.com');
      }
    });

    it('exact-matches investment platforms & fintechs', async () => {
      const zerodha = await resolveInstitutionIcon('Zerodha');
      expect(zerodha.type).toBe('logo');
      if (zerodha.type === 'logo') {
        expect(zerodha.domain).toBe('zerodha.com');
      }

      const groww = await resolveInstitutionIcon('Groww');
      expect(groww.type).toBe('logo');
      if (groww.type === 'logo') {
        expect(groww.domain).toBe('groww.in');
      }

      const angel = await resolveInstitutionIcon('Angel One');
      expect(angel.type).toBe('logo');
      if (angel.type === 'logo') {
        expect(angel.domain).toBe('angelone.in');
      }
    });

    it('exact-matches global banks and NBFCs', async () => {
      const chase = await resolveInstitutionIcon('Chase');
      expect(chase.type).toBe('logo');
      if (chase.type === 'logo') {
        expect(chase.domain).toBe('chase.com');
      }

      const bajaj = await resolveInstitutionIcon('Bajaj Finance');
      expect(bajaj.type).toBe('logo');
      if (bajaj.type === 'logo') {
        expect(bajaj.domain).toBe('bajajfinserv.in');
      }
    });
  });

  describe('3. Stopword Stripping Match', () => {
    it('matches "HDFC Salary Account" -> hdfcbank.com', async () => {
      const res = await resolveInstitutionIcon('HDFC Salary Account');
      expect(res.type).toBe('logo');
      if (res.type === 'logo') {
        expect(res.domain).toBe('hdfcbank.com');
        expect(res.urls[0]).toContain('https://www.google.com/s2/favicons?domain=hdfcbank.com');
        expect(res.urls[1]).toContain('https://icons.duckduckgo.com/ip3/hdfcbank.com.ico');
      }
    });

    it('matches "ICICI Current Account" -> icicibank.com', async () => {
      const res = await resolveInstitutionIcon('ICICI Current Account');
      expect(res.type).toBe('logo');
      if (res.type === 'logo') {
        expect(res.domain).toBe('icicibank.com');
      }
    });

    it('matches "Kotak 811 Digital Savings Account" -> kotak.com', async () => {
      const res = await resolveInstitutionIcon('Kotak 811 Digital Savings Account');
      expect(res.type).toBe('logo');
      if (res.type === 'logo') {
        expect(res.domain).toBe('kotak.com');
      }
    });
  });

  describe('4. Fuzzy Matching (Threshold >= 0.75)', () => {
    it('matches minor typos and phonetic variations', async () => {
      // "kotak mahindr" missing 'a'
      const res = await resolveInstitutionIcon('kotak mahindr');
      expect(res.type).toBe('logo');
      if (res.type === 'logo') {
        expect(res.domain).toBe('kotak.com');
      }
    });

    it('matches "indus ind" or "indusind bank" with high similarity', async () => {
      const res = await resolveInstitutionIcon('indusind bnk');
      expect(res.type).toBe('logo');
      if (res.type === 'logo') {
        expect(res.domain).toBe('indusind.com');
      }
    });
  });

  describe('5. Dynamic Domain Guessing Fallback', () => {
    it('attempts candidate probing (.com, .in, .co.in) when no alias matches', async () => {
      const probedList: string[] = [];
      const customProbe = async (domain: string) => {
        probedList.push(domain);
        return domain === 'myfintech.in';
      };

      // "Corp" is correctly stripped as a stopword, leaving core "my fintech" -> "myfintech"
      const res = await resolveInstitutionIcon('My Fintech Corp', { customProbe });
      expect(probedList).toContain('myfintech.com');
      expect(probedList).toContain('myfintech.in');
      expect(res.type).toBe('logo');
      if (res.type === 'logo') {
        expect(res.domain).toBe('myfintech.in');
        expect(res.matchedBy).toBe('domain-guess');
      }
    });

    it('does NOT probe or guess domains for non-financial arbitrary words like "love"', async () => {
      const probedList: string[] = [];
      // Even if DuckDuckGo or web probe would return true for love.com
      const customProbe = async (domain: string) => {
        probedList.push(domain);
        return true;
      };

      // "love" has no financial keywords and is not in alias map
      const res = await resolveInstitutionIcon('love');
      expect(res.type).not.toBe('logo');
      expect(probedList).toHaveLength(0);
    });
  });

  describe('6. Fallback Initials Avatar (No Match)', () => {
    it('returns initials and deterministic HSL color when probe and alias match fail', async () => {
      const customProbe = async () => false;
      const res = await resolveInstitutionIcon('XyZ Unknown NonExistent Entity', { customProbe });
      expect(res.type).toBe('initials');
      if (res.type === 'initials') {
        expect(res.initials).toBe('XU');
        expect(res.color).toMatch(/^hsl\(\d+,\s*65%,\s*40%\)$/);
      }
    });

    it('handles empty or null institution name gracefully', async () => {
      const res1 = await resolveInstitutionIcon('');
      expect(res1.type).toBe('initials');
      if (res1.type === 'initials') {
        expect(res1.initials).toBe('AC');
      }

      const res2 = await resolveInstitutionIcon(null);
      expect(res2.type).toBe('initials');
      if (res2.type === 'initials') {
        expect(res2.initials).toBe('AC');
      }
    });

    it('computes deterministic colors consistently', () => {
      const color1 = getDeterministicColor('Personal Wallet');
      const color2 = getDeterministicColor('Personal Wallet');
      expect(color1).toBe(color2);

      const color3 = getDeterministicColor('Another Bank');
      expect(color1).not.toBe(color3);
    });

    it('generates clean uppercase initials', () => {
      expect(getInitials('State Bank')).toBe('SB');
      expect(getInitials('HDFC')).toBe('HD');
      expect(getInitials('X')).toBe('X');
    });
  });

  describe('7. Session In-Memory Cache', () => {
    it('returns cached results synchronously on subsequent requests without re-probing', async () => {
      let probeCount = 0;
      const customProbe = async () => {
        probeCount++;
        return true;
      };

      const first = await resolveInstitutionIcon('Custom Co', { customProbe });
      expect(probeCount).toBe(1);

      const second = await resolveInstitutionIcon('Custom Co', { customProbe });
      expect(probeCount).toBe(1); // Cached! Probe not called again
      expect(first).toEqual(second);
    });
  });

  describe('8. Card Network Detection (detectCardNetwork)', () => {
    it('detects Visa cards (/^4/)', () => {
      expect(detectCardNetwork('4111222233334444')).toBe('visa');
      expect(detectCardNetwork('•••• 4291')).toBe('visa');
      expect(detectCardNetwork('4590')).toBe('visa');
    });

    it('detects Mastercard cards (/^5[1-5]/ or /^2[2-7]/)', () => {
      expect(detectCardNetwork('5100123412341234')).toBe('mastercard');
      expect(detectCardNetwork('5599')).toBe('mastercard');
      expect(detectCardNetwork('2221')).toBe('mastercard');
      expect(detectCardNetwork('2720')).toBe('mastercard');
    });

    it('detects RuPay cards (/^(60|65|81|82|508)/)', () => {
      expect(detectCardNetwork('607123')).toBe('rupay');
      expect(detectCardNetwork('812345')).toBe('rupay');
      expect(detectCardNetwork('820011')).toBe('rupay');
      expect(detectCardNetwork('508123')).toBe('rupay');
    });

    it('detects Amex cards (/^3[47]/)', () => {
      expect(detectCardNetwork('341234567890123')).toBe('amex');
      expect(detectCardNetwork('378282246310005')).toBe('amex');
    });

    it('detects Diners Club cards (/^(36|38|30[0-5])/)', () => {
      expect(detectCardNetwork('361234')).toBe('diners');
      expect(detectCardNetwork('381234')).toBe('diners');
      expect(detectCardNetwork('300123')).toBe('diners');
      expect(detectCardNetwork('305123')).toBe('diners');
    });

    it('detects Discover cards (/^(6011|65)/)', () => {
      expect(detectCardNetwork('6011123412341234')).toBe('discover');
    });

    it('returns null for unrecognized or empty prefixes', () => {
      expect(detectCardNetwork('')).toBeNull();
      expect(detectCardNetwork(null)).toBeNull();
      expect(detectCardNetwork(undefined)).toBeNull();
      expect(detectCardNetwork('9999')).toBeNull();
    });
  });
});
