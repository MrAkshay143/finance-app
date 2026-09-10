import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { apiClient, getFriendlyErrorMessage } from '../../services/apiClient.js';
import { toast } from '../../store/toastStore.js';
import { validateEmail, validatePassword, validateConfirmPassword } from '../../utils/validation.js';

interface SecurityQuestionPrompt {
  questionKey: string;
  questionText: string;
}

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // Multi-step: 1 = Email, 2 = Security Questions, 3 = New Password, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [email, setEmail] = useState('');
  const [questions, setQuestions] = useState<SecurityQuestionPrompt[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [resetToken, setResetToken] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Validation
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(newPassword);
  const confirmValidation = validateConfirmPassword(newPassword, confirmPassword);

  // Step 1: Submit Email to fetch KBA Questions
  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setEmailError('Email address is required');
      return;
    }
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.message || 'Please enter a valid email address');
      return;
    }

    setEmailError(null);
    setIsLoading(true);

    try {
      const res = await apiClient.auth.initiateForgotPassword(trimmed);
      if (res?.questions && res.questions.length >= 3) {
        setQuestions(res.questions);
        const initialAnswers: Record<string, string> = {};
        res.questions.forEach((q: { questionKey: string; questionText: string }) => {
          initialAnswers[q.questionKey] = '';
        });
        setAnswers(initialAnswers);
        setStep(2);
      } else {
        setErrorMessage('Security questions are not configured for this account. Please contact an administrator.');
      }
    } catch (err: any) {
      setErrorMessage(
        getFriendlyErrorMessage(err, 'No account found with this email or security questions not configured.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify Answers to receive Reset Token
  const handleVerifyQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const answerPayload = questions.map((q) => ({
      questionKey: q.questionKey,
      answer: (answers[q.questionKey] || '').trim(),
    }));

    // Check all answers filled
    if (answerPayload.some((a) => !a.answer)) {
      setErrorMessage('Please provide answers for all 3 security questions.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiClient.auth.verifyForgotPassword({
        email: email.trim().toLowerCase(),
        answers: answerPayload,
      });

      if (res?.resetToken) {
        setResetToken(res.resetToken);
        setStep(3);
        toast.success('Identity verified. Please choose a new password.');
      } else {
        setErrorMessage('Failed to verify answers. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(
        getFriendlyErrorMessage(err, 'Incorrect answers. Please check your answers and try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!resetToken) {
      setErrorMessage('Session expired. Please restart the recovery process.');
      setStep(1);
      return;
    }

    if (!passwordValidation.isValid) {
      setErrorMessage(passwordValidation.message || 'Password does not meet complexity requirements');
      return;
    }

    if (!confirmValidation.isValid) {
      setErrorMessage(confirmValidation.message || 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.auth.resetPassword({
        resetToken,
        newPassword,
      });

      setStep(4);
      toast.success('Password reset successfully');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2500);
    } catch (err: any) {
      setErrorMessage(
        getFriendlyErrorMessage(err, 'Failed to reset password. Please try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-[420px] flex flex-col justify-center">
        {/* Brand Header */}
        <div className="text-center mb-2.5">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-[#132A5C] border border-[#0B1B3A]/20 shadow-md mb-1.5">
            <KeyRound className="w-5 h-5 text-blue-300" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
            Account Recovery
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            {step === 1 && 'Enter your email to find your account'}
            {step === 2 && 'Answer your 3 security questions to verify identity'}
            {step === 3 && 'Create a strong, secure new password'}
            {step === 4 && 'Recovery Complete'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-xl border border-slate-200/80 space-y-3">
          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <p className="leading-tight">{errorMessage}</p>
            </div>
          )}

          {/* Step 1: Email Form */}
          {step === 1 && (
            <form onSubmit={handleInitiate} className="space-y-3.5" noValidate>
              <Input
                label="Registered Email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                disabled={isLoading}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                  setErrorMessage(null);
                }}
                error={emailError || undefined}
                icon={<Mail className="w-4 h-4 text-slate-400" />}
                autoComplete="email"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isLoading}
                iconRight={<ArrowRight className="w-4 h-4" />}
              >
                {isLoading ? 'Searching...' : 'Continue'}
              </Button>
            </form>
          )}

          {/* Step 2: KBA Questions Form */}
          {step === 2 && (
            <form onSubmit={handleVerifyQuestions} className="space-y-3" noValidate>
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
                {questions.map((q, idx) => (
                  <div key={q.questionKey} className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-blue-100 text-brand-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate">{q.questionText}</span>
                    </label>
                    <Input
                      type="text"
                      required
                      placeholder="Your answer"
                      value={answers[q.questionKey] || ''}
                      disabled={isLoading}
                      onChange={(e) => {
                        setAnswers((prev) => ({
                          ...prev,
                          [q.questionKey]: e.target.value,
                        }));
                        setErrorMessage(null);
                      }}
                      icon={<HelpCircle className="w-4 h-4 text-slate-400" />}
                    />
                  </div>
                ))}
              </div>

              <div className="pt-1 grid grid-cols-[100px_1fr] gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setStep(1);
                    setErrorMessage(null);
                  }}
                  disabled={isLoading}
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={isLoading}
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  {isLoading ? 'Verifying...' : 'Verify Answers'}
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: New Password Form */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-3" noValidate>
              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min 8 characters (A-Z, 0-9)"
                  value={newPassword}
                  disabled={isLoading}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  icon={<Lock className="w-4 h-4 text-slate-400" />}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 rounded p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                disabled={isLoading}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrorMessage(null);
                }}
                icon={<Lock className="w-4 h-4 text-slate-400" />}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isLoading}
                iconRight={<ArrowRight className="w-4 h-4" />}
              >
                {isLoading ? 'Updating Password...' : 'Reset Password'}
              </Button>
            </form>
          )}

          {/* Step 4: Success State */}
          {step === 4 && (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Password Reset Successful</h3>
              <p className="text-xs text-slate-600">
                Your password has been updated. Redirecting to sign in page...
              </p>
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={() => navigate('/login', { replace: true })}
              >
                Sign In Now
              </Button>
            </div>
          )}

          {/* Security Notice */}
          <div className="py-2 px-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-primary shrink-0" />
            <span>Protected by end-to-end encrypted security verification.</span>
          </div>

          {/* Back to Login Link */}
          <div className="text-center pt-1">
            <Link
              to="/login"
              className="text-xs text-brand-primary font-semibold hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
