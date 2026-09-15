import { validateAndNormalizePhone, COUNTRY_REGISTRY, CountryCode } from '@finance/shared-types';
import { formatCurrency } from '@finance/shared-ui-tokens';

export type FieldValidationStatus = 'idle' | 'valid' | 'invalid' | 'warning';

export interface ValidationResult {
  isValid: boolean;
  status: FieldValidationStatus;
  message?: string;
}

export interface PasswordCriteria {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export interface PasswordValidationResult extends ValidationResult {
  criteria: PasswordCriteria;
  score: number;
  strengthLabel: 'Weak' | 'Fair' | 'Good' | 'Strong';
}

export interface PhoneValidationResult extends ValidationResult {
  digitsEntered: number;
  digitsRequired: number;
  formatGuide?: string;
  normalizedE164?: string;
}

export interface AmountValidationResult extends ValidationResult {
  numericValue: number;
  formattedDisplay?: string;
}

// Real-time email address validator
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) {
    return { isValid: false, status: 'idle', message: undefined };
  }

  // RFC standard compliant email pattern
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (emailRegex.test(trimmed)) {
    return {
      isValid: true,
      status: 'valid',
      message: 'Valid email',
    };
  }

  return {
    isValid: false,
    status: 'invalid',
    message: 'Enter a valid email',
  };
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSpecial: boolean;
}

const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecial: false,
};

// Real-time password rules and strength validator with dynamic policy fallback.
export function validatePassword(password: string, policy?: PasswordPolicy): PasswordValidationResult {
  const p = policy ?? DEFAULT_PASSWORD_POLICY;

  if (!password) {
    return {
      isValid: false,
      status: 'idle',
      score: 0,
      strengthLabel: 'Weak',
      criteria: {
        minLength: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSpecial: false,
      },
    };
  }

  const criteria: PasswordCriteria = {
    minLength: password.length >= p.minLength,
    hasUpper: p.requireUppercase ? /[A-Z]/.test(password) : true,
    hasLower: p.requireLowercase ? /[a-z]/.test(password) : true,
    hasNumber: p.requireDigit ? /[0-9]/.test(password) : true,
    hasSpecial: p.requireSpecial ? /[^A-Za-z0-9]/.test(password) : true,
  };

  const score = Object.values(criteria).filter(Boolean).length;
  const isValid = Object.values(criteria).every(Boolean);

  let strengthLabel: 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
  if (isValid && password.length >= p.minLength + 4) strengthLabel = 'Strong';
  else if (isValid) strengthLabel = 'Good';
  else if (score >= 3) strengthLabel = 'Fair';

  const status: FieldValidationStatus = isValid
    ? 'valid'
    : score >= 3
    ? 'warning'
    : 'invalid';

  let failReason = '';
  if (!criteria.minLength) failReason = `${p.minLength}+ characters required`;
  else if (!criteria.hasUpper) failReason = 'Add an uppercase letter';
  else if (!criteria.hasLower) failReason = 'Add a lowercase letter';
  else if (!criteria.hasNumber) failReason = 'Add a number';
  else if (!criteria.hasSpecial) failReason = 'Add a special character';

  const message = isValid ? `${strengthLabel} password` : failReason;

  return {
    isValid,
    status,
    message,
    score,
    strengthLabel,
    criteria,
  };
}

// Real-time confirm password match validator
export function validateConfirmPassword(password: string, confirmPassword: string): ValidationResult {
  if (!confirmPassword) {
    return { isValid: false, status: 'idle' };
  }

  if (password === confirmPassword) {
    return {
      isValid: true,
      status: 'valid',
      message: 'Passwords match',
    };
  }

  return {
    isValid: false,
    status: 'invalid',
    message: 'Passwords do not match',
  };
}

// Real-time amount and currency validator
export function validateAmount(
  rawAmount: string | number,
  currency = 'INR',
  allowZero = false
): AmountValidationResult {
  const strVal = String(rawAmount).trim();
  if (!strVal) {
    return { isValid: false, status: 'idle', numericValue: 0 };
  }

  const num = parseFloat(strVal);
  if (isNaN(num)) {
    return {
      isValid: false,
      status: 'invalid',
      numericValue: 0,
      message: 'Enter valid amount',
    };
  }

  if (num < 0) {
    return {
      isValid: false,
      status: 'invalid',
      numericValue: num,
      message: 'Cannot be negative',
    };
  }

  if (!allowZero && num === 0) {
    return {
      isValid: false,
      status: 'invalid',
      numericValue: 0,
      message: 'Must be greater than 0',
    };
  }

  // Formatted currency label
  const formattedDisplay = formatCurrency(num, currency);

  return {
    isValid: true,
    status: 'valid',
    numericValue: num,
    formattedDisplay,
    message: formattedDisplay,
  };
}

// Real-time date of birth and age eligibility validator
export function validateAge(dobString: string, minAge = 16): ValidationResult {
  if (!dobString) {
    return { isValid: false, status: 'idle' };
  }

  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) {
    return { isValid: false, status: 'invalid', message: 'Invalid date' };
  }

  const today = new Date();
  if (dob > today) {
    return { isValid: false, status: 'invalid', message: 'Cannot be in future' };
  }

  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  if (age < minAge) {
    return {
      isValid: false,
      status: 'invalid',
      message: `Must be ${minAge} or older`,
    };
  }

  return {
    isValid: true,
    status: 'valid',
    message: `Eligible (${minAge}+)`,
  };
}

// Real-time mobile number and country calling code validator
export function validatePhoneRealtime(
  nationalNumber: string,
  countryIso: string = 'IN'
): PhoneValidationResult {
  const digitsOnly = nationalNumber.replace(/\D/g, '');
  const validIso: CountryCode = (countryIso in COUNTRY_REGISTRY ? countryIso : 'IN') as CountryCode;
  const country = COUNTRY_REGISTRY[validIso] || COUNTRY_REGISTRY.IN;
  const primaryLength = country.phoneLengths[0] || 10;

  if (!digitsOnly) {
    return {
      isValid: false,
      status: 'idle',
      digitsEntered: 0,
      digitsRequired: primaryLength,
      formatGuide: `${primaryLength} digits required`,
    };
  }

  const fullNumber = `${country.callingCode}${digitsOnly}`;
  const result = validateAndNormalizePhone(fullNumber, validIso);

  if (result.isValid) {
    const formattedE164 = result.normalized || result.e164 || fullNumber;
    return {
      isValid: true,
      status: 'valid',
      digitsEntered: digitsOnly.length,
      digitsRequired: primaryLength,
      normalizedE164: formattedE164,
      message: 'Valid number',
    };
  }

  // If user entered too many digits
  if (digitsOnly.length > primaryLength) {
    return {
      isValid: false,
      status: 'invalid',
      digitsEntered: digitsOnly.length,
      digitsRequired: primaryLength,
      message: `Max ${primaryLength} digits`,
    };
  }

  // If user entered required number of digits but regex pattern failed
  if (country.phoneLengths.includes(digitsOnly.length)) {
    const errMsg =
      country.code === 'IN'
        ? 'Must start with 6, 7, 8, or 9'
        : result.error || 'Invalid number';
    return {
      isValid: false,
      status: 'invalid',
      digitsEntered: digitsOnly.length,
      digitsRequired: primaryLength,
      message: errMsg,
    };
  }

  // In-progress: clean counter
  return {
    isValid: false,
    status: 'idle',
    digitsEntered: digitsOnly.length,
    digitsRequired: primaryLength,
    message: `${digitsOnly.length}/${primaryLength} digits`,
  };
}

// Cryptographically secure password generator meeting all strength criteria
export function generateSecurePassword(length = 16): string {
  const targetLength = Math.max(14, length);

  const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const LOWER = 'abcdefghjkmnpqrstuvwxyz';
  const NUMBERS = '23456789';
  const SPECIAL = '!@#$%^&*()_+-=[]{};:';
  const ALL = UPPER + LOWER + NUMBERS + SPECIAL;

  const getRandomInt = (max: number): number => {
    const array = new Uint32Array(1);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      globalThis.crypto.getRandomValues(array);
    }
    return array[0] % max;
  };

  const getRandomChar = (pool: string): string => {
    return pool[getRandomInt(pool.length)];
  };

  const passwordChars: string[] = [];

  // Guarantees at least 2 characters from each pool
  for (let i = 0; i < 2; i++) {
    passwordChars.push(getRandomChar(UPPER));
    passwordChars.push(getRandomChar(LOWER));
    passwordChars.push(getRandomChar(NUMBERS));
    passwordChars.push(getRandomChar(SPECIAL));
  }

  // Fills remainder to reach length (minimum 14)
  while (passwordChars.length < targetLength) {
    passwordChars.push(getRandomChar(ALL));
  }

  // Shuffles array using Fisher-Yates with crypto random indices
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    const temp = passwordChars[i];
    passwordChars[i] = passwordChars[j];
    passwordChars[j] = temp;
  }

  return passwordChars.join('');
}
