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
  const { login, isLoading, error, clearError, lockoutUntil, isAuthenticated, user } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
  const [lockoutRemaining, setLockoutRemaining] = useState<number | null>(null);

  const searchParams = new URLSearchParams(location.search);
  const isSessionExpired = Boolean(
    (location.state as any)?.sessionExpired ||
    searchParams.get('reason') === 'session_expired' ||
    searchParams.get('expired') === 'true'
  );

  // If arriving due to session expiration, immediately purge any stale in-memory auth state
  useEffect(() => {
    if (isSessionExpired) {
      useAuthStore.getState().logout().catch(() => {});
    }
  }, [isSessionExpired]);

  // Clear previous errors on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Guard: If legitimately authenticated and not expired, redirect to appropriate home
  useEffect(() => {
    if (!isSessionExpired && isAuthenticated && user) {
      const defaultHome = user.role === 'ADMIN'
        ? '/admin'
        : (user.onboardingCompleted ? '/dashboard' : '/onboarding');
      navigate(defaultHome, { replace: true });
    }
  }, [isAuthenticated, user, navigate, isSessionExpired]);

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

  const emailResult = validateEmail(email);

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

      const fromPath = (location.state as any)?.from?.pathname;
      let destination: string;

      if (res.user.role === 'ADMIN') {
        destination = fromPath && fromPath.startsWith('/admin') ? fromPath : '/admin';
      } else {
        if (!res.user.onboardingCompleted) {
          destination = '/onboarding';
        } else {
          destination = fromPath && !fromPath.startsWith('/admin') ? fromPath : '/dashboard';
        }
      }

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
    <div className="h-[100dvh] max-h-[100dvh] w-full overflow-hidden overscroll-none relative bg-slate-50 flex flex-col items-center justify-center p-3 sm:p-4">
      {/* Modern ambient glow orbs & fine geometric dot grid */}
      <div className="absolute top-0 left-1/4 -translate-y-1/2 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 translate-y-1/2 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-50" />

      <div className="relative z-10 w-full max-w-[400px] flex flex-col justify-center my-auto">
        {/* Brand Header */}
        <div className="text-center mb-2.5">
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
          <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
            Finance Tracker
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5 font-normal">
            Personal Wealth & Spending Hub
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-xl border border-slate-200/80 space-y-3">
          <div className="mb-0.5">
            <h2 className="text-sm font-bold text-slate-900">Sign In to Your Account</h2>
          </div>

          {/* Session Expired Alert Banner */}
          {isSessionExpired && !isLocked && (
            <div
              role="alert"
              className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-800 text-xs font-medium"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <p className="leading-tight">Session expired. Please sign in again.</p>
            </div>
          )}

          {/* Account Lockout Alert Banner */}
          {isLocked && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-semantic-danger text-xs"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-semantic-danger" />
              <div className="space-y-0.5">
                <p className="font-bold">Account Temporarily Locked</p>
                <p className="text-slate-700">
                  Too many failed login attempts. Please wait{' '}
                  <span className="font-bold text-semantic-danger font-mono">
                    {Math.floor(remainingSeconds / 60)}m {remainingSeconds % 60}s
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Friendly API Error Display */}
          {error && !isLocked && (
            <div
              role="alert"
              className="p-2.5 bg-red-50/90 border border-red-200 rounded-xl flex items-center gap-2 text-semantic-danger text-xs font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-semantic-danger" />
              <p className="leading-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
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
              showStatusIcon
              icon={<Mail className="w-4 h-4 text-slate-400" />}
              autoComplete="email"
            />

            {/* Password Input */}
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter account password"
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

            {/* Remember Session & Forgot Link */}
            <div className="flex items-center justify-between pt-0.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  disabled={isLoading || isLocked}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary border-slate-300"
                />
                <span className="text-slate-700 font-medium">Remember session</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-brand-primary font-semibold hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
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

          {/* Security Notice */}
          <div className="py-2 px-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-primary shrink-0" />
            <span>End-to-end encrypted session with SHA-256 credentials.</span>
          </div>

          {/* Link to Signup */}
          <div className="text-center pt-1">
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
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
