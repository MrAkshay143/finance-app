import { z } from 'zod';

export const SUPPORTED_COUNTRY_CODES = [
  'IN',
  'US',
  'GB',
  'CA',
  'AU',
  'SG',
  'AE',
  'DE',
  'FR',
  'JP',
] as const;

export type CountryCode = (typeof SUPPORTED_COUNTRY_CODES)[number];

export const CountryCodeSchema = z.enum(SUPPORTED_COUNTRY_CODES);

export interface CountryMetadata {
  code: CountryCode;
  iso3: string;
  name: string;
  callingCode: string;
  defaultCurrency: string;
  flag: string;
  phoneLengths: number[];
  phonePattern: string; // Regex pattern for national number without dial code
  formatDescription: string;
  phonePlaceholder: string;
}

export type Country = CountryMetadata;

export const COUNTRY_REGISTRY: Record<CountryCode, CountryMetadata> = {
  IN: {
    code: 'IN',
    iso3: 'IND',
    name: 'India',
    callingCode: '+91',
    defaultCurrency: 'INR',
    flag: '🇮🇳',
    phoneLengths: [10],
    phonePattern: '^[6-9]\\d{9}$',
    formatDescription: '10 digits starting with 6, 7, 8, or 9',
    phonePlaceholder: '98765 43210',
  },
  US: {
    code: 'US',
    iso3: 'USA',
    name: 'United States',
    callingCode: '+1',
    defaultCurrency: 'USD',
    flag: '🇺🇸',
    phoneLengths: [10],
    phonePattern: '^[2-9]\\d{9}$',
    formatDescription: '10 digits (e.g. 555 019 2834)',
    phonePlaceholder: '(555) 019-2834',
  },
  GB: {
    code: 'GB',
    iso3: 'GBR',
    name: 'United Kingdom',
    callingCode: '+44',
    defaultCurrency: 'GBP',
    flag: '🇬🇧',
    phoneLengths: [10],
    phonePattern: '^7\\d{9}$',
    formatDescription: '10 digits starting with 7 (or 07... domestically)',
    phonePlaceholder: '7911 123456',
  },
  CA: {
    code: 'CA',
    iso3: 'CAN',
    name: 'Canada',
    callingCode: '+1',
    defaultCurrency: 'CAD',
    flag: '🇨🇦',
    phoneLengths: [10],
    phonePattern: '^[2-9]\\d{9}$',
    formatDescription: '10 digits (e.g. 555 019 2834)',
    phonePlaceholder: '(555) 019-2834',
  },
  AU: {
    code: 'AU',
    iso3: 'AUS',
    name: 'Australia',
    callingCode: '+61',
    defaultCurrency: 'AUD',
    flag: '🇦🇺',
    phoneLengths: [9],
    phonePattern: '^4\\d{8}$',
    formatDescription: '9 digits starting with 4 (or 04... domestically)',
    phonePlaceholder: '412 345 678',
  },
  SG: {
    code: 'SG',
    iso3: 'SGP',
    name: 'Singapore',
    callingCode: '+65',
    defaultCurrency: 'SGD',
    flag: '🇸🇬',
    phoneLengths: [8],
    phonePattern: '^[89]\\d{7}$',
    formatDescription: '8 digits starting with 8 or 9 (e.g. 8123 4567)',
    phonePlaceholder: '8123 4567',
  },
  AE: {
    code: 'AE',
    iso3: 'ARE',
    name: 'United Arab Emirates',
    callingCode: '+971',
    defaultCurrency: 'AED',
    flag: '🇦🇪',
    phoneLengths: [9],
    phonePattern: '^5\\d{8}$',
    formatDescription: '9 digits starting with 5 (or 05... domestically)',
    phonePlaceholder: '50 123 4567',
  },
  DE: {
    code: 'DE',
    iso3: 'DEU',
    name: 'Germany',
    callingCode: '+49',
    defaultCurrency: 'EUR',
    flag: '🇩🇪',
    phoneLengths: [10, 11],
    phonePattern: '^(?:1[567]\\d{8,9}|[1-9]\\d{9,10})$',
    formatDescription: '10 or 11 digits (e.g. 151 23456789)',
    phonePlaceholder: '151 23456789',
  },
  FR: {
    code: 'FR',
    iso3: 'FRA',
    name: 'France',
    callingCode: '+33',
    defaultCurrency: 'EUR',
    flag: '🇫🇷',
    phoneLengths: [9],
    phonePattern: '^[67]\\d{8}$',
    formatDescription: '9 digits starting with 6 or 7 (or 06/07 domestically)',
    phonePlaceholder: '6 12 34 56 78',
  },
  JP: {
    code: 'JP',
    iso3: 'JPN',
    name: 'Japan',
    callingCode: '+81',
    defaultCurrency: 'JPY',
    flag: '🇯🇵',
    phoneLengths: [10],
    phonePattern: '^[789]0\\d{8}$',
    formatDescription: '10 digits starting with 70, 80, or 90 (or 090... domestically)',
    phonePlaceholder: '90 1234 5678',
  },
};

export const COUNTRIES: CountryMetadata[] = Object.values(COUNTRY_REGISTRY).sort((a, b) =>
  a.name.localeCompare(b.name)
);

export function getCountryByCode(code: string): CountryMetadata | undefined {
  const upper = code.toUpperCase() as CountryCode;
  return COUNTRY_REGISTRY[upper];
}

export function getCountryByCallingCode(callingCode: string): CountryMetadata | undefined {
  const cleaned = callingCode.startsWith('+') ? callingCode : `+${callingCode}`;
  return COUNTRIES.find((c) => c.callingCode === cleaned);
}

export interface ParsedPhoneNumber {
  countryCode: CountryCode;
  country: CountryMetadata;
  callingCode: string;
  nationalNumber: string;
  raw: string;
}

/**
 * Parses any phone string (E.164, dial-code prefixed, or local number)
 * into its country, calling code, and national digits.
 */
export function parsePhoneNumber(phoneInput: string, defaultCountry: CountryCode = 'IN'): ParsedPhoneNumber {
  const trimmed = (phoneInput || '').trim();
  const defaultMeta = COUNTRY_REGISTRY[defaultCountry] || COUNTRY_REGISTRY.IN;
  if (!trimmed) {
    return {
      countryCode: defaultMeta.code,
      country: defaultMeta,
      callingCode: defaultMeta.callingCode,
      nationalNumber: '',
      raw: '',
    };
  }

  // Check if string starts with '+'
  if (trimmed.startsWith('+')) {
    // If defaultCountry's calling code matches, prioritize defaultCountry (e.g. CA vs US which both share +1)
    if (trimmed.startsWith(defaultMeta.callingCode)) {
      const nationalPart = trimmed.slice(defaultMeta.callingCode.length).replace(/\D/g, '');
      return {
        countryCode: defaultMeta.code,
        country: defaultMeta,
        callingCode: defaultMeta.callingCode,
        nationalNumber: nationalPart,
        raw: trimmed,
      };
    }

    // Match calling code from longest to shortest (+971, +91, +44, +1, etc.)
    const sortedCallingCodes = [...COUNTRIES].sort((a, b) => b.callingCode.length - a.callingCode.length);
    for (const country of sortedCallingCodes) {
      if (trimmed.startsWith(country.callingCode)) {
        const nationalPart = trimmed.slice(country.callingCode.length).replace(/\D/g, '');
        return {
          countryCode: country.code,
          country,
          callingCode: country.callingCode,
          nationalNumber: nationalPart,
          raw: trimmed,
        };
      }
    }
  }

  // If dial code is separated or not formatted with +, check default country first
  const digitsOnly = trimmed.replace(/\D/g, '');

  // 1. Check if digits start with defaultCountry's calling code without + (e.g. 919876543210 for IN)
  const defaultDialDigits = defaultMeta.callingCode.replace(/\D/g, '');
  if (
    digitsOnly.startsWith(defaultDialDigits) &&
    defaultMeta.phoneLengths.includes(digitsOnly.length - defaultDialDigits.length)
  ) {
    return {
      countryCode: defaultMeta.code,
      country: defaultMeta,
      callingCode: defaultMeta.callingCode,
      nationalNumber: digitsOnly.slice(defaultDialDigits.length),
      raw: trimmed,
    };
  }

  // 2. Check if digits match defaultCountry's phone lengths (or with domestic trunk zero)
  if (
    defaultMeta.phoneLengths.includes(digitsOnly.length) ||
    (digitsOnly.startsWith('0') && defaultMeta.phoneLengths.includes(digitsOnly.replace(/^0+/, '').length))
  ) {
    return {
      countryCode: defaultMeta.code,
      country: defaultMeta,
      callingCode: defaultMeta.callingCode,
      nationalNumber: digitsOnly,
      raw: trimmed,
    };
  }

  // 3. Otherwise check other countries by dial code
  const sortedByDialDigits = [...COUNTRIES].sort(
    (a, b) => b.callingCode.replace(/\D/g, '').length - a.callingCode.replace(/\D/g, '').length
  );

  for (const country of sortedByDialDigits) {
    const dialDigits = country.callingCode.replace(/\D/g, '');
    if (digitsOnly.startsWith(dialDigits)) {
      const remainder = digitsOnly.slice(dialDigits.length);
      if (country.phoneLengths.includes(remainder.length)) {
        return {
          countryCode: country.code,
          country,
          callingCode: country.callingCode,
          nationalNumber: remainder,
          raw: trimmed,
        };
      }
    }
  }

  // Otherwise assume default country
  return {
    countryCode: defaultMeta.code,
    country: defaultMeta,
    callingCode: defaultMeta.callingCode,
    nationalNumber: digitsOnly,
    raw: trimmed,
  };
}

export interface PhoneValidationResult {
  isValid: boolean;
  normalized?: string; // E.164 format: +919876543210
  e164?: string;       // Alias for E.164 format
  countryCode?: CountryCode;
  country?: CountryMetadata;
  nationalNumber?: string;
  error?: string;
}

/**
 * Validates and normalizes phone numbers against country-specific metadata.
 * Returns normalized E.164 string on success.
 */
export function validateAndNormalizePhone(
  phoneInput: string | null | undefined,
  preferredCountry: CountryCode = 'IN'
): PhoneValidationResult {
  if (!phoneInput || !phoneInput.trim()) {
    return {
      isValid: false,
      error: 'Phone number is required',
    };
  }

  const parsed = parsePhoneNumber(phoneInput, preferredCountry);
  const country = COUNTRY_REGISTRY[parsed.countryCode];
  if (!country) {
    return {
      isValid: false,
      error: 'Unsupported country calling code',
    };
  }

  const nationalDigits = parsed.nationalNumber;
  if (!nationalDigits) {
    return {
      isValid: false,
      error: 'Please enter a mobile number',
      countryCode: country.code,
      country,
    };
  }

  // Domestic trunk zero stripping (e.g. 07911... in UK, 04... in AU, 06... in FR, 090... in JP, 050... in AE, 015... in DE, 098... in IN)
  let cleanNational = nationalDigits;
  if (cleanNational.startsWith('0') && cleanNational.length > 1) {
    const stripped = cleanNational.replace(/^0+/, '');
    if (
      country.phoneLengths.includes(stripped.length) ||
      ['GB', 'AU', 'FR', 'JP', 'AE', 'DE', 'IN'].includes(country.code)
    ) {
      cleanNational = stripped;
    }
  }

  // Length check
  if (!country.phoneLengths.includes(cleanNational.length)) {
    const lengthsStr = country.phoneLengths.join(' or ');
    return {
      isValid: false,
      error: `Mobile number for ${country.name} must be ${lengthsStr} digits`,
      countryCode: country.code,
      country,
      nationalNumber: cleanNational,
    };
  }

  // Regex pattern check
  const regex = new RegExp(country.phonePattern);
  if (!regex.test(cleanNational)) {
    return {
      isValid: false,
      error: `Please enter a valid ${country.name} mobile number (${country.formatDescription})`,
      countryCode: country.code,
      country,
      nationalNumber: cleanNational,
    };
  }

  const normalized = `${country.callingCode}${cleanNational}`;
  return {
    isValid: true,
    normalized,
    e164: normalized,
    countryCode: country.code,
    country,
    nationalNumber: cleanNational,
  };
}

export const PhoneInputSchema = z
  .string()
  .refine(
    (val) => {
      if (!val) return true;
      return validateAndNormalizePhone(val).isValid;
    },
    {
      message: 'Please enter a valid mobile number',
    }
  );
