import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  HelpCircle,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Pencil,
  KeyRound,
  RotateCcw,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Modal } from '../components/ui/Modal.js';
import { apiClient } from '../services/apiClient.js';
import { useAuthStore } from '../store/authStore.js';
import { toast } from '../store/toastStore.js';

interface QuestionItem {
  key: string;
  text: string;
}

interface ExistingQuestion {
  id: string;
  questionKey: string;
  questionText: string;
  createdAt?: string;
}

const DEFAULT_QUESTIONS: QuestionItem[] = [
  { key: 'first_pet', text: 'What was the name of your first pet?' },
  { key: 'mother_maiden_name', text: "What is your mother's maiden name?" },
  { key: 'elementary_school', text: 'What elementary school did you attend?' },
  { key: 'birth_city', text: 'In what city were you born?' },
  { key: 'first_car', text: 'What was the make or model of your first car?' },
  { key: 'favorite_book', text: 'What is the title of your favorite book?' },
  { key: 'childhood_street', text: 'What street did you grow up on?' },
];

export const SecurityQuestionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { setKbaConfigured } = useAuthStore();

  // Mode: 'VIEW' (when questions are already configured) vs 'EDIT' (setup wizard)
  const [mode, setMode] = useState<'VIEW' | 'EDIT'>('EDIT');
  const [isConfigured, setIsConfigured] = useState(false);
  const [existingQuestions, setExistingQuestions] = useState<ExistingQuestion[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  // Available questions for dropdown selection
  const [availableQuestions, setAvailableQuestions] = useState<QuestionItem[]>(DEFAULT_QUESTIONS);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [answers, setAnswers] = useState<Record<number, { key: string; answer: string }>>({
    1: { key: 'first_pet', answer: '' },
    2: { key: 'birth_city', answer: '' },
    3: { key: 'elementary_school', answer: '' },
  });
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [wizardError, setWizardError] = useState<string | null>(null);

  // Verify modal state
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyAnswers, setVerifyAnswers] = useState<Record<string, string>>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Fetch initial KBA status and available questions
  useEffect(() => {
    let mounted = true;

    Promise.all([
      apiClient.auth.getSecurityQuestions().catch(() => []),
      apiClient.auth.getAvailableSecurityQuestions().catch(() => DEFAULT_QUESTIONS),
    ])
      .then(([existingRes, availableRes]) => {
        if (!mounted) return;

        // Process available questions
        if (Array.isArray(availableRes) && availableRes.length > 0) {
          const mapped = availableRes.map((q: any) => ({
            key: q.key || q.questionKey || '',
            text: q.text || q.questionText || '',
          }));
          setAvailableQuestions(mapped);
        }

        // Process existing questions
        const questionsList = Array.isArray(existingRes)
          ? existingRes
          : (existingRes as any)?.data || [];

        if (questionsList.length >= 3) {
          setIsConfigured(true);
          setExistingQuestions(questionsList);
          setMode('VIEW');
          setKbaConfigured(true);
        } else {
          setIsConfigured(false);
          setMode('EDIT');
        }
      })
      .finally(() => {
        if (mounted) {
          setIsInitialLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [setKbaConfigured]);

  const currentAnswerData = answers[currentStep] || { key: '', answer: '' };

  const handleQuestionChange = (newKey: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentStep]: {
        ...prev[currentStep],
        key: newKey,
      },
    }));
  };

  const handleAnswerChange = (val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentStep]: {
        ...prev[currentStep],
        answer: val,
      },
    }));
  };

  // Filter out questions selected in other steps
  const selectableQuestions = availableQuestions.filter((q) => {
    for (const stepNum of [1, 2, 3] as const) {
      if (stepNum !== currentStep && answers[stepNum]?.key === q.key) {
        return false;
      }
    }
    return true;
  });

  const handleNextStep = () => {
    setWizardError(null);
    if (!currentAnswerData.key) {
      setWizardError('Please choose a security question.');
      return;
    }
    if (!currentAnswerData.answer.trim()) {
      setWizardError('Please enter your secret answer.');
      return;
    }

    if (currentStep < 3) {
      setCurrentStep((prev) => ((prev + 1) as 1 | 2 | 3));
      setShowAnswer(false);
    }
  };

  const handlePreviousStep = () => {
    setWizardError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => ((prev - 1) as 1 | 2 | 3));
      setShowAnswer(false);
    } else if (isConfigured) {
      setMode('VIEW');
    } else {
      navigate('/profile');
    }
  };

  const handleSubmitQuestions = async () => {
    setWizardError(null);
    if (!currentAnswerData.key) {
      setWizardError('Please choose a security question.');
      return;
    }
    if (!currentAnswerData.answer.trim()) {
      setWizardError('Please enter your secret answer.');
      return;
    }

    for (let i = 1; i <= 3; i++) {
      if (!answers[i]?.key || !answers[i]?.answer.trim()) {
        setWizardError(`Please complete question ${i} before submitting.`);
        setCurrentStep(i as 1 | 2 | 3);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        questions: [
          { questionKey: answers[1].key, answer: answers[1].answer.trim() },
          { questionKey: answers[2].key, answer: answers[2].answer.trim() },
          { questionKey: answers[3].key, answer: answers[3].answer.trim() },
        ],
      };

      await apiClient.auth.setupSecurityQuestions(payload);
      setKbaConfigured(true);
      setIsConfigured(true);

      // Refresh existing questions
      const updated = await apiClient.auth.getSecurityQuestions();
      const list = Array.isArray(updated) ? updated : (updated as any)?.data || [];
      setExistingQuestions(list);

      toast.success('Security questions saved successfully');
      setMode('VIEW');
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to save security questions. Please check your inputs.';
      setWizardError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Verify Modal
  const handleOpenVerify = () => {
    const init: Record<string, string> = {};
    existingQuestions.forEach((q) => {
      init[q.questionKey] = '';
    });
    setVerifyAnswers(init);
    setVerifyError(null);
    setIsVerifyModalOpen(true);
  };

  // Submit test verification
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);

    const payload = existingQuestions.map((q) => ({
      questionKey: q.questionKey,
      answer: (verifyAnswers[q.questionKey] || '').trim(),
    }));

    if (payload.some((p) => !p.answer)) {
      setVerifyError('Please enter answers for all 3 questions.');
      return;
    }

    setIsVerifying(true);
    try {
      await apiClient.auth.verifySecurityQuestions({ answers: payload });
      toast.success('All 3 security answers verified successfully');
      setIsVerifyModalOpen(false);
    } catch (err: any) {
      setVerifyError(
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Verification failed. One or more answers are incorrect.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex-1 flex flex-col pb-6">
        <AppHeader
          variant="nested"
          title="Security Questions"
          subtitle="Account Recovery & Identity Verification"
          backTo="/profile"
        />
        <div className="p-4 space-y-3">
          <div className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-6">
      {/* Streamlined Branded Header */}
      <AppHeader
        variant="nested"
        title="Security Questions"
        subtitle={
          mode === 'VIEW'
            ? 'Account Recovery & Verification'
            : 'Set up security questions to keep your account safe'
        }
        backTo={mode === 'VIEW' ? '/profile' : undefined}
        onBack={mode === 'EDIT' && isConfigured ? () => setMode('VIEW') : undefined}
        rightAction={
          mode === 'VIEW' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMode('EDIT');
                setCurrentStep(1);
              }}
              icon={<Pencil className="w-3.5 h-3.5" />}
            >
              Update
            </Button>
          ) : undefined
        }
      />

      <div className="p-4 space-y-4">
        {/* VIEW MODE: Questions Already Configured */}
        {mode === 'VIEW' && (
          <div className="space-y-4">
            {/* Status Card */}
            <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-emerald-950">Security Questions Active</h3>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Configured for password recovery & identity verification.
                  </p>
                </div>
              </div>
            </div>

            {/* List of 3 Configured Questions */}
            <Card className="p-4 space-y-3.5 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Configured Questions (3 of 3)
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  Bcrypt Encrypted
                </span>
              </div>

              <div className="space-y-3 divide-y divide-slate-100">
                {existingQuestions.map((q, index) => (
                  <div key={q.id || q.questionKey} className={`space-y-1 ${index > 0 ? 'pt-3' : ''}`}>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-100 text-brand-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <p className="text-xs font-semibold text-slate-800 leading-snug">
                        {q.questionText}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pl-6 text-xs text-slate-400 font-mono">
                      <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>••••••••••••</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Actions Card */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleOpenVerify}
                icon={<KeyRound className="w-4 h-4 text-brand-primary" />}
              >
                Test Answers
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => {
                  setMode('EDIT');
                  setCurrentStep(1);
                }}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Change Questions
              </Button>
            </div>
          </div>
        )}

        {/* EDIT / SETUP MODE: 3-Step Progressive Wizard */}
        {mode === 'EDIT' && (
          <div className="space-y-4">
            {/* Security Banner */}
            <div className="p-3 bg-blue-50/80 border border-blue-200/70 rounded-2xl flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-slate-900">Your security matters</h3>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Add 3 security questions to keep your account safe.
                </p>
              </div>
            </div>

            {/* Streamlined Stepper */}
            <div className="px-3 py-1">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
                <div
                  className="absolute top-4 left-6 h-0.5 bg-brand-primary transition-all duration-300 -z-0"
                  style={{
                    width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : 'calc(100% - 48px)',
                  }}
                />

                {[1, 2, 3].map((stepNum) => (
                  <div key={stepNum} className="flex flex-col items-center relative z-10">
                    <button
                      type="button"
                      onClick={() => {
                        if (stepNum === 1 || answers[stepNum - 1]?.answer) {
                          setCurrentStep(stepNum as 1 | 2 | 3);
                        }
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${
                        currentStep >= stepNum
                          ? 'bg-brand-primary text-white shadow-sm'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {stepNum}
                    </button>
                    <span
                      className={`text-[11px] mt-1 font-semibold ${
                        currentStep === stepNum ? 'text-brand-primary' : 'text-slate-500'
                      }`}
                    >
                      {`Question ${stepNum}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Alert */}
            {wizardError && (
              <div
                role="alert"
                className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{wizardError}</span>
              </div>
            )}

            {/* Question Card */}
            <Card className="p-4 space-y-3.5 shadow-card">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {`QUESTION ${currentStep} OF 3`}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  Select Question & Secret Answer
                </h3>
              </div>

              {/* Question Dropdown */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Choose a security question
                </label>
                <div className="relative flex items-center">
                  <select
                    value={currentAnswerData.key}
                    onChange={(e) => handleQuestionChange(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-white border border-borderDefault rounded-xl text-xs text-textDefault appearance-none focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  >
                    <option value="" disabled>
                      Choose a security question
                    </option>
                    {selectableQuestions.map((q) => (
                      <option key={q.key} value={q.key}>
                        {q.text}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 pointer-events-none text-slate-400">
                    <ChevronLeft className="w-4 h-4 -rotate-90" />
                  </div>
                </div>
              </div>

              {/* Secret Answer */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Your Answer
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showAnswer ? 'text' : 'password'}
                    placeholder="Enter your secret answer"
                    value={currentAnswerData.answer}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 bg-white border border-borderDefault rounded-xl text-xs text-textDefault focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAnswer(!showAnswer)}
                    aria-label={showAnswer ? 'Hide answer' : 'Show answer'}
                    className="absolute right-2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </Card>

            {/* Stepper Navigation Buttons */}
            <div className="pt-1">
              {currentStep < 3 ? (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handlePreviousStep}
                    icon={<ChevronLeft className="w-4 h-4" />}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={handleNextStep}
                    iconRight={<ArrowRight className="w-4 h-4" />}
                  >
                    Next Question
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handlePreviousStep}
                    icon={<ChevronLeft className="w-4 h-4" />}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    fullWidth
                    disabled={isSubmitting}
                    onClick={handleSubmitQuestions}
                    iconRight={<Shield className="w-4 h-4" />}
                  >
                    {isSubmitting ? 'Saving...' : 'Save All Questions'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Verify Test Modal */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        title="Test Security Answers"
      >
        <form onSubmit={handleVerifySubmit} className="space-y-3 p-1" noValidate>
          <p className="text-xs text-slate-600">
            Verify that you remember the answers to your 3 security questions:
          </p>

          {verifyError && (
            <div
              role="alert"
              className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{verifyError}</span>
            </div>
          )}

          <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
            {existingQuestions.map((q, idx) => (
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
                  value={verifyAnswers[q.questionKey] || ''}
                  onChange={(e) => {
                    setVerifyAnswers((prev) => ({
                      ...prev,
                      [q.questionKey]: e.target.value,
                    }));
                    setVerifyError(null);
                  }}
                  icon={<HelpCircle className="w-4 h-4 text-slate-400" />}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsVerifyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isVerifying}
            >
              {isVerifying ? 'Checking...' : 'Verify Answers'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SecurityQuestionsPage;
