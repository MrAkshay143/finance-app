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
import { validateAndNormalizePhone } from '@finance/shared-types';
import { validateEmail, validateConfirmPassword } from '../../utils/validation.js';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isLoading, error, clearError } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string | undefined>>({});

  const emailResult = validateEmail(email);
  const confirmResult = validateConfirmPassword(password, confirmPassword);

  useEffect(() => {
    clearError();
  }, [clearError]);

  // Password strength calculations
  const passwordCriteria = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const strengthScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.minLength) score += 1;
    if (passwordCriteria.hasUpper) score += 1;
    if (passwordCriteria.hasLower) score += 1;
    if (passwordCriteria.hasNumber) score += 1;
    if (passwordCriteria.hasSpecial) score += 1;
    return score;
  }, [passwordCriteria]);

  const strengthLabel = useMemo(() => {
    if (!password) return { label: 'Not Entered', color: 'bg-slate-200', text: 'text-slate-400', width: '0%' };
    if (strengthScore <= 2) return { label: 'Weak', color: 'bg-red-500', text: 'text-red-500', width: '33%' };
    if (strengthScore <= 4) return { label: 'Medium', color: 'bg-amber-500', text: 'text-amber-500', width: '66%' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500', width: '100%' };
  }, [password, strengthScore]);

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
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    } else if (!passwordCriteria.hasUpper || !passwordCriteria.hasLower || !passwordCriteria.hasNumber) {
      errs.password = 'Password must include uppercase, lowercase, and a number';
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
        password,
      });

      // New users go to Onboarding Wizard
      navigate('/onboarding', { replace: true });
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-[100dvh] overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-[420px] flex flex-col justify-center">
        {/* Compact Brand Header */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-[#132A5C] border border-[#0B1B3A]/20 shadow-md mb-1">
            <img
              src="/pwa-192x192.png"
              alt="Finance"
              className="w-8 h-8 rounded-xl object-cover"
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
              validMessage="Valid email"
              showStatusIcon
              icon={<Mail className="w-3.5 h-3.5 text-slate-400" />}
              autoComplete="email"
            />

            {/* Mobile Number */}
            <PhoneInputWithCountry
              label="Mobile Number"
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

            {/* Password and Confirm Password Row (2 columns) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 8 chars"
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
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-8 text-slate-400 hover:text-slate-600 rounded-md p-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="relative">
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
                  error={validationErrors.confirmPassword || (confirmPassword && !confirmResult.isValid ? 'Passwords do not match' : undefined)}
                  icon={<Lock className="w-3.5 h-3.5 text-slate-400" />}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                  className="absolute right-2.5 top-8 text-slate-400 hover:text-slate-600 rounded-md p-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Compact Password Strength Indicator */}
            {password.length > 0 && (
              <div className="flex items-center justify-between text-[11px] px-1 py-0.5">
                <div className="flex items-center gap-1.5 flex-1 mr-3">
                  <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strengthLabel.color}`}
                      style={{ width: strengthLabel.width }}
                    />
                  </div>
                </div>
                <span className={`font-semibold shrink-0 ${strengthLabel.text}`}>
                  {strengthLabel.label}
                </span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
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
