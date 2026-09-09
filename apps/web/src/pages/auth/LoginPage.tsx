import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { validateEmail } from '../../utils/validation.js';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError, lockoutUntil } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
  const [lockoutRemaining, setLockoutRemaining] = useState<number | null>(null);

  const emailResult = validateEmail(email);

  // Clear previous errors on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Lockout countdown timer
  useEffect(() => {
    if (!lockoutUntil) {
      setLockoutRemaining(null);
      return;
    }

    const updateTimer = () => {
      const remainingMs = lockoutUntil - Date.now();
      if (remainingMs <= 0) {
        setLockoutRemaining(null);
      } else {
        setLockoutRemaining(Math.ceil(remainingMs / 1000));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = 'Email address is required';
    } else if (!emailResult.isValid) {
      errors.email = emailResult.message || 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining && lockoutRemaining > 0) return;
    if (!validate()) return;

    try {
      const res = await login(
        {
          email: email.trim().toLowerCase(),
          password,
        },
        rememberMe
      );

      const destination = (location.state as any)?.from?.pathname ||
        (res.user.onboardingCompleted ? '/dashboard' : '/onboarding');
      navigate(destination, { replace: true });
    } catch {
      // Error handled in store and displayed
    }
  };

  const isLocked = Boolean(
    (lockoutRemaining !== null && lockoutRemaining > 0) ||
    (lockoutUntil && lockoutUntil > Date.now())
  );
  const remainingSeconds =
    lockoutRemaining !== null
      ? lockoutRemaining
      : lockoutUntil
      ? Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000))
      : 0;

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

        {/* Login Form Container */}
        <main className="flex-1 p-5 space-y-4">
          {/* Welcome Card */}
          <div className="text-center pt-1 pb-2">
            <h2 className="text-xl font-bold text-textDefault tracking-tight">
              Sign In to Your Account
            </h2>
            <p className="text-xs text-textMuted mt-1">
              Secure access to your personal finance dashboard
            </p>
          </div>

          {/* Account Lockout Alert Banner */}
          {isLocked && (
            <div
              role="alert"
              className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-semantic-danger"
            >
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-semantic-danger" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-semantic-danger">Account Temporarily Locked</p>
                <p className="text-slate-700 leading-relaxed">
                  Too many failed login attempts. Please wait{' '}
                  <span className="font-bold text-semantic-danger font-mono">
                    {Math.floor(remainingSeconds / 60)}m {remainingSeconds % 60}s
                  </span>{' '}
                  before trying again.
                </p>
              </div>
            </div>
          )}

          {/* Friendly API Error Display */}
          {error && !isLocked && (
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
              {/* Email Input */}
              <Input
                label="Email Address"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                disabled={isLoading || isLocked}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationErrors.email) {
                    setValidationErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                error={validationErrors.email}
                status={email.trim() ? (emailResult.isValid ? 'valid' : validationErrors.email ? 'invalid' : 'idle') : 'idle'}
                validMessage="Valid email format"
                showStatusIcon
                icon={<Mail className="w-4 h-4 text-slate-400" />}
                autoComplete="email"
              />

              {/* Password Input */}
              <div>
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your account password"
                    value={password}
                    disabled={isLoading || isLocked}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (validationErrors.password) {
                        setValidationErrors((prev) => ({ ...prev, password: undefined }));
                      }
                    }}
                    error={validationErrors.password}
                    icon={<Lock className="w-4 h-4 text-slate-400" />}
                    autoComplete="current-password"
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
              </div>

              {/* Remember Session & Forgot Link */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    disabled={isLoading || isLocked}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 border-slate-300"
                  />
                  <span className="text-textDefault font-medium">Remember session</span>
                </label>

                <Link
                  to="/security/questions"
                  className="text-brand-primary font-semibold hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isLoading || isLocked}
                iconRight={<ArrowRight className="w-4 h-4" />}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </Card>

          {/* Security Notice Card */}
          <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-center gap-2.5 text-textMuted text-xs">
            <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0" />
            <span>End-to-end encrypted session with SHA-256 salted credentials.</span>
          </div>

          {/* Link to Signup */}
          <div className="text-center pt-2 pb-6">
            <p className="text-xs text-textMuted">
              Do not have an account?{' '}
              <Link
                to="/signup"
                className="text-brand-primary font-bold hover:underline ml-1"
              >
                Create Account
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LoginPage;
