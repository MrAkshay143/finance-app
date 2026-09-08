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
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
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
    } else if (password !== confirmPassword) {
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
    <div className="min-h-screen bg-[#EDF2F9] flex justify-center py-0 sm:py-4">
      <div className="w-full max-w-[430px] min-h-screen bg-[#F3F6FC] relative flex flex-col shadow-2xl border-x border-[#E2E8F0] overflow-x-hidden">
        {/* Navy Header Block */}
        <header className="bg-gradient-to-b from-[#0B1B3A] to-[#132A5C] text-white pt-8 pb-7 px-6 rounded-b-[28px] shadow-header relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-primary to-blue-400 text-white shadow-lg mb-3">
            <Wallet className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Finance Tracker</h1>
          <p className="text-xs text-slate-300 mt-1 font-normal">
            Personal Wealth & Spending Hub
          </p>
        </header>

        {/* Signup Form Container */}
        <main className="flex-1 p-5 space-y-4">
          {/* Welcome Card */}
          <div className="text-center pt-1 pb-2">
            <h2 className="text-xl font-bold text-textDefault tracking-tight">
              Create Your Account
            </h2>
            <p className="text-xs text-textMuted mt-1">
              Start your journey to financial clarity and discipline
            </p>
          </div>

          {/* Friendly API Error Display */}
          {error && (
            <div
              role="alert"
              className="p-3.5 bg-red-50/90 border border-red-200 rounded-2xl flex items-center gap-2.5 text-semantic-danger"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-semantic-danger" />
              <p className="text-xs font-medium leading-tight">{error}</p>
            </div>
          )}

          {/* Form Card */}
          <Card className="p-5 space-y-4 shadow-card">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-3">
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
                  icon={<User className="w-4 h-4 text-slate-400" />}
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
                icon={<Mail className="w-4 h-4 text-slate-400" />}
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

              {/* Password */}
              <div>
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Create a strong password"
                    value={password}
                    disabled={isLoading}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (validationErrors.password) {
                        setValidationErrors((prev) => ({ ...prev, password: undefined }));
                      }
                    }}
                    error={validationErrors.password}
                    icon={<Lock className="w-4 h-4 text-slate-400" />}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 p-1"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-600">Password Strength</span>
                      <span className={`font-bold ${strengthLabel.text}`}>
                        {strengthLabel.label}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strengthLabel.color}`}
                        style={{ width: strengthLabel.width }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-slate-500">
                      <span className={`flex items-center gap-1 ${passwordCriteria.minLength ? 'text-emerald-600 font-medium' : ''}`}>
                        {passwordCriteria.minLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-slate-400" />}
                        8+ characters
                      </span>
                      <span className={`flex items-center gap-1 ${passwordCriteria.hasUpper ? 'text-emerald-600 font-medium' : ''}`}>
                        {passwordCriteria.hasUpper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-slate-400" />}
                        Uppercase letter
                      </span>
                      <span className={`flex items-center gap-1 ${passwordCriteria.hasLower ? 'text-emerald-600 font-medium' : ''}`}>
                        {passwordCriteria.hasLower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-slate-400" />}
                        Lowercase letter
                      </span>
                      <span className={`flex items-center gap-1 ${passwordCriteria.hasNumber ? 'text-emerald-600 font-medium' : ''}`}>
                        {passwordCriteria.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 text-slate-400" />}
                        Numeric digit
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
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
                    error={validationErrors.confirmPassword}
                    icon={<Lock className="w-4 h-4 text-slate-400" />}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                    className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 p-1"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
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
          </Card>

          {/* Privacy Security Callout */}
          <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-center gap-2.5 text-textMuted text-xs">
            <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0" />
            <span>Your data is encrypted and securely stored.</span>
          </div>

          {/* Link to Login */}
          <div className="text-center pt-2 pb-6">
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
        </main>
      </div>
    </div>
  );
};

export default SignupPage;
