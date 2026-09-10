import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { PhoneInputWithCountry } from '../../components/ui/PhoneInputWithCountry.js';
import { CountrySelector } from '../../components/ui/CountrySelector.js';
import { CurrencySelector } from '../../components/ui/CurrencySelector.js';
import {
  validateAndNormalizePhone,
  CountryCode,
  CurrencyCode,
  COUNTRY_REGISTRY,
} from '@finance/shared-types';
import { validateEmail, validatePassword, validateConfirmPassword } from '../../utils/validation.js';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isLoading, error, clearError } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [country, setCountry] = useState<CountryCode>('IN');
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string | undefined>>({});

  const handleCountryChange = (newCountry: CountryCode) => {
    setCountry(newCountry);
    const suggestedCurrency = COUNTRY_REGISTRY[newCountry]?.defaultCurrency;
    if (suggestedCurrency) {
      setCurrency(suggestedCurrency as CurrencyCode);
    }
  };

  const emailResult = validateEmail(email);
  const passwordResult = validatePassword(password);
  const confirmResult = validateConfirmPassword(password, confirmPassword);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const strengthDetails = useMemo(() => {
    if (!password) {
      return { segmentCount: 0, barColor: 'bg-slate-200', textColor: 'text-slate-400' };
    }
    switch (passwordResult.strengthLabel) {
      case 'Strong':
        return { segmentCount: 4, barColor: 'bg-emerald-500', textColor: 'text-emerald-600' };
      case 'Good':
        return { segmentCount: 3, barColor: 'bg-emerald-500', textColor: 'text-emerald-600' };
      case 'Fair':
        return { segmentCount: 2, barColor: 'bg-amber-500', textColor: 'text-amber-600' };
      case 'Weak':
      default:
        return { segmentCount: 1, barColor: 'bg-rose-500', textColor: 'text-rose-600' };
    }
  }, [password, passwordResult.strengthLabel]);

  const passwordCriteriaList = useMemo(() => {
    return [
      { label: '8+ characters', met: passwordResult.criteria.minLength },
      { label: 'Uppercase (A-Z)', met: passwordResult.criteria.hasUpper },
      { label: 'Lowercase (a-z)', met: passwordResult.criteria.hasLower },
      { label: 'One number (0-9)', met: passwordResult.criteria.hasNumber },
      { label: 'Special symbol (!@#$) (optional)', met: passwordResult.criteria.hasSpecial },
    ];
  }, [passwordResult.criteria]);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!firstName.trim()) {
      errs.firstName = 'First name is required';
    }

    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!emailResult.isValid) {
      errs.email = emailResult.message || 'Please enter a valid email address';
    }

    if (mobileNumber.trim()) {
      const phoneValidation = validateAndNormalizePhone(mobileNumber.trim());
      if (!phoneValidation.isValid) {
        errs.mobileNumber = phoneValidation.error || 'Please enter a valid mobile number';
      }
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (!passwordResult.isValid) {
      errs.password = passwordResult.message || 'Password does not meet requirements';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Confirmation password is required';
    } else if (!confirmResult.isValid) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await signup({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim().toLowerCase(),
        mobileNumber: mobileNumber.trim() || undefined,
        country,
        currency,
        password,
      });

      // New users go to Onboarding Wizard
      navigate('/onboarding', { replace: true });
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-[100dvh] relative overflow-hidden bg-slate-50 flex items-center justify-center p-3 sm:p-4">
      {/* Modern ambient glow orbs & fine geometric dot grid */}
      <div className="absolute top-0 left-1/4 -translate-y-1/2 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 translate-y-1/2 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-50" />

      <div className="relative z-10 w-full max-w-[420px] flex flex-col justify-center">
        {/* Compact Brand Header */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-[52px] h-[52px] rounded-2xl bg-[#132A5C] border border-[#0B1B3A]/20 shadow-md mb-1.5 ring-4 ring-white/80">
            <img
              src="/pwa-192x192.png"
              alt="Finance"
              className="w-10 h-10 rounded-xl object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-base font-bold tracking-tight text-slate-900 leading-tight">
            Create Your Account
          </h1>
          <p className="text-[11px] text-slate-500 font-normal">
            Start your journey to financial clarity and discipline
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 shadow-xl border border-slate-200/80 space-y-2.5">
          {/* Friendly API Error Display */}
          {error && (
            <div
              role="alert"
              className="p-2.5 bg-red-50/90 border border-red-200 rounded-xl flex items-center gap-2 text-semantic-danger text-xs font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-semantic-danger" />
              <p className="leading-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
            {/* Name Row (2 columns) */}
            <div className="grid grid-cols-2 gap-2.5">
              <Input
                label="First Name"
                required
                placeholder="First name"
                value={firstName}
                disabled={isLoading}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (validationErrors.firstName) {
                    setValidationErrors((prev) => ({ ...prev, firstName: undefined }));
                  }
                }}
                error={validationErrors.firstName}
                status={firstName.trim().length >= 2 ? 'valid' : validationErrors.firstName ? 'invalid' : 'idle'}
                icon={<User className="w-3.5 h-3.5 text-slate-400" />}
                autoComplete="given-name"
              />

              <Input
                label="Last Name"
                placeholder="Last name"
                value={lastName}
                disabled={isLoading}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </div>

            {/* Email Address */}
            <Input
              label="Email Address"
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              disabled={isLoading}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validationErrors.email) {
                  setValidationErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              error={validationErrors.email}
              status={email.trim() ? (emailResult.isValid ? 'valid' : validationErrors.email ? 'invalid' : 'idle') : 'idle'}
              showStatusIcon
              icon={<Mail className="w-3.5 h-3.5 text-slate-400" />}
              autoComplete="email"
            />

            {/* Country and Currency Selectors (Placed ABOVE Mobile Number) */}
            <div className="grid grid-cols-2 gap-2.5">
              <CountrySelector
                label="Country"
                required
                value={country}
                onChange={(val) => handleCountryChange(val as CountryCode)}
                disabled={isLoading}
              />
              <CurrencySelector
                label="Currency"
                required
                value={currency}
                onChange={(val) => setCurrency(val as CurrencyCode)}
                disabled={isLoading}
              />
            </div>

            {/* Mobile Number */}
            <PhoneInputWithCountry
              label="Mobile Number"
              defaultCountry={country}
              value={mobileNumber}
              disabled={isLoading}
              onChange={(val) => {
                setMobileNumber(val);
                if (validationErrors.mobileNumber) {
                  setValidationErrors((prev) => ({ ...prev, mobileNumber: undefined }));
                }
              }}
              error={validationErrors.mobileNumber}
            />

            {/* Row 1: Full-width Password Field with clean eye toggle */}
            <div className="space-y-2">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="At least 8 characters"
                value={password}
                disabled={isLoading}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationErrors.password) {
                    setValidationErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                error={validationErrors.password}
                icon={<Lock className="w-3.5 h-3.5 text-slate-400" />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="text-slate-400 hover:text-slate-600 p-0.5 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                autoComplete="new-password"
              />

              {/* Below Row 1: Interactive 4-Segment Strength Meter & 2-Column Criteria Checklist */}
              {password.length > 0 && (
                <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-medium text-slate-600">Password Strength</span>
                    <span
                      className={`text-[11px] font-bold ${
                        password ? strengthDetails.textColor : 'text-slate-400'
                      }`}
                    >
                      {password ? passwordResult.strengthLabel : 'Not entered'}
                    </span>
                  </div>

                  {/* 4-Segment Strength Bar */}
                  <div className="grid grid-cols-4 gap-1.5 h-1.5">
                    {[1, 2, 3, 4].map((seg) => (
                      <div
                        key={seg}
                        className={`h-full rounded-full transition-all duration-300 ${
                          password && seg <= strengthDetails.segmentCount
                            ? strengthDetails.barColor
                            : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  {/* 2-Column Criteria Checklist */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-0.5 text-[11px]">
                    {passwordCriteriaList.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 min-w-0">
                        {item.met ? (
                          <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-slate-300 bg-slate-100 shrink-0" />
                        )}
                        <span
                          className={`truncate ${
                            item.met ? 'text-slate-700 font-medium' : 'text-slate-400'
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Row 2: Full-width Confirm Password Field with real-time matching feedback */}
            <div>
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="Re-enter password"
                value={confirmPassword}
                disabled={isLoading}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (validationErrors.confirmPassword) {
                    setValidationErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                error={
                  confirmPassword
                    ? !confirmResult.isValid
                      ? 'Passwords do not match'
                      : undefined
                    : validationErrors.confirmPassword
                }
                status={
                  confirmPassword
                    ? confirmResult.isValid
                      ? 'valid'
                      : 'invalid'
                    : validationErrors.confirmPassword
                    ? 'invalid'
                    : 'idle'
                }
                validMessage={confirmPassword && confirmResult.isValid ? 'Passwords match' : undefined}
                icon={<Lock className="w-3.5 h-3.5 text-slate-400" />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                    className="text-slate-400 hover:text-slate-600 p-0.5 focus:outline-none transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                autoComplete="new-password"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isLoading}
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          {/* Privacy Security Callout */}
          <div className="py-1.5 px-2.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-primary shrink-0" />
            <span>Bank-grade encrypted registration and credential security.</span>
          </div>

          {/* Link to Login */}
          <div className="text-center pt-0.5">
            <p className="text-xs text-textMuted">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-brand-primary font-bold hover:underline ml-1"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
