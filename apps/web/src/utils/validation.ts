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

/**
 * Real-time Email Validator
 */
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
      message: 'Valid email address',
    };
  }

  // Helpful intermediate feedback
  if (!trimmed.includes('@')) {
    return {
      isValid: false,
      status: 'invalid',
      message: 'Email must contain "@" (e.g. name@domain.com)',
    };
  }

  const parts = trimmed.split('@');
  if (parts.length > 1 && !parts[1].includes('.')) {
    return {
      isValid: false,
      status: 'invalid',
      message: 'Missing domain extension (e.g. .com, .in)',
    };
  }

  return {
    isValid: false,
    status: 'invalid',
    message: 'Please enter a valid email address',
  };
}

/**
 * Real-time Password Rules & Strength Validator
 */
export function validatePassword(password: string): PasswordValidationResult {
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
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(criteria).filter(Boolean).length;
  const isValid = criteria.minLength && score >= 4;

  let strengthLabel: 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
  if (score >= 5 && password.length >= 10) strengthLabel = 'Strong';
  else if (score >= 4) strengthLabel = 'Good';
  else if (score >= 3) strengthLabel = 'Fair';

  const status: FieldValidationStatus = isValid
    ? 'valid'
    : score >= 3
    ? 'warning'
    : 'invalid';

  const message = isValid
    ? `Strong password (${strengthLabel})`
    : !criteria.minLength
    ? 'Minimum 8 characters required'
    : 'Include uppercase, lowercase, numbers, and symbols';

  return {
    isValid,
    status,
    message,
    score,
    strengthLabel,
    criteria,
  };
}

/**
 * Real-time Confirm Password Match Validator
 */
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

/**
 * Real-time Amount & Currency Validator
 */
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
      message: 'Please enter a valid numeric amount',
    };
  }

  if (num < 0) {
    return {
      isValid: false,
      status: 'invalid',
      numericValue: num,
      message: 'Amount cannot be negative',
    };
  }

  if (!allowZero && num === 0) {
    return {
      isValid: false,
      status: 'invalid',
      numericValue: 0,
      message: 'Amount must be greater than 0',
    };
  }

  // Formatted currency label
  const formattedDisplay = `Formatted: ${formatCurrency(num, currency)}`;

  return {
    isValid: true,
    status: 'valid',
    numericValue: num,
    formattedDisplay,
    message: formattedDisplay,
  };
}

/**
 * Real-time Date of Birth / Age Validator
 */
export function validateAge(dobString: string, minAge = 16): ValidationResult {
  if (!dobString) {
    return { isValid: false, status: 'idle' };
  }

  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) {
    return { isValid: false, status: 'invalid', message: 'Invalid date format' };
  }

  const today = new Date();
  if (dob > today) {
    return { isValid: false, status: 'invalid', message: 'Date of birth cannot be in the future' };
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
      message: `Must be at least ${minAge} years old (current: ${age})`,
    };
  }

  return {
    isValid: true,
    status: 'valid',
    message: `Age: ${age} years (Eligible)`,
  };
}

/**
 * Real-time Mobile Number & Country Calling Code Validator
 */
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
      formatGuide: `Format: ${country.formatDescription} (${country.name})`,
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
      message: `Valid ${country.name} number (${formattedE164})`,
    };
  }

  const remaining = primaryLength - digitsOnly.length;
  const progressMsg =
    remaining > 0
      ? `${digitsOnly.length} / ${primaryLength} digits (${remaining} remaining)`
      : `${digitsOnly.length} / ${primaryLength} digits`;

  return {
    isValid: false,
    status: digitsOnly.length === primaryLength ? 'invalid' : 'idle',
    digitsEntered: digitsOnly.length,
    digitsRequired: primaryLength,
    message: result.error || progressMsg,
  };
}
