import React, { useState, useEffect } from 'react';
import { AlertCircle, Mail, Loader2, CheckCircle2, X } from 'lucide-react';
import { OtpInput } from './OtpInput.js';

interface OtpVerificationModalProps {
  email: string;
  isOpen: boolean;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onClose?: () => void;
  title?: string;
  description?: string;
}

export function OtpVerificationModal({
  email,
  isOpen,
  onVerify,
  onResend,
  onClose,
  title = 'Verify Email',
  description = 'Enter the 6-digit code sent to your email.',
}: OtpVerificationModalProps) {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [success, setSuccess] = useState(false);

  // Handle countdown for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otp.length !== 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    
    setIsVerifying(true);
    setError(null);
    try {
      await onVerify(otp);
      setSuccess(true);
      if (onClose) {
        setTimeout(onClose, 1500);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Verification failed. Please try again.');
      setOtp(''); // Clear OTP on failure
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    
    setIsResending(true);
    setError(null);
    try {
      await onResend();
      setResendCooldown(60); // Start 60s cooldown
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to resend code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
            <p className="text-slate-500">
              {description} <br />
              <span className="font-semibold text-slate-700">{email}</span>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-center">
              <OtpInput 
                length={6} 
                value={otp} 
                onChange={(val) => {
                  setOtp(val);
                  setError(null);
                }} 
                disabled={isVerifying || success}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p>Email verified.</p>
              </div>
            )}

            <button
              type="submit"
              disabled={otp.length !== 6 || isVerifying || success}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : success ? (
                'Verified'
              ) : (
                'Verify Code'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending || success}
                className="font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                {isResending ? (
                  <span className="flex items-center gap-1 justify-center">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Sending...
                  </span>
                ) : resendCooldown > 0 ? (
                  `Resend code in ${resendCooldown}s`
                ) : (
                  'Resend Code'
                )}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
