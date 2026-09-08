import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  HelpCircle,
  Info,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { apiClient } from '../services/apiClient.js';
import { useAuthStore } from '../store/authStore.js';

interface QuestionItem {
  key: string;
  text: string;
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
  const { user, setKbaConfigured } = useAuthStore();

  const [availableQuestions, setAvailableQuestions] = useState<QuestionItem[]>(DEFAULT_QUESTIONS);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [answers, setAnswers] = useState<Record<number, { key: string; answer: string }>>({
    1: { key: 'first_pet', answer: '' },
    2: { key: 'birth_city', answer: '' },
    3: { key: 'elementary_school', answer: '' },
  });
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch available questions from backend
  useEffect(() => {
    let mounted = true;
    apiClient.auth
      .getAvailableSecurityQuestions()
      .then((res) => {
        if (mounted && Array.isArray(res) && res.length > 0) {
          const mapped = res.map((q) => ({
            key: q.key || q.questionKey || '',
            text: q.text || q.questionText || '',
          }));
          setAvailableQuestions(mapped);

          // Update defaults if needed
          if (mapped[0] && mapped[1] && mapped[2]) {
            setAnswers((prev) => ({
              1: { key: mapped[0].key, answer: prev[1]?.answer || '' },
              2: { key: mapped[1].key, answer: prev[2]?.answer || '' },
              3: { key: mapped[2].key, answer: prev[3]?.answer || '' },
            }));
          }
        }
      })
      .catch(() => {
        // Fallback to default questions if API fails or offline
      });

    return () => {
      mounted = false;
    };
  }, []);

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
    setErrorMessage(null);
    if (!currentAnswerData.key) {
      setErrorMessage('Please choose a security question.');
      return;
    }
    if (!currentAnswerData.answer.trim()) {
      setErrorMessage('Please enter your secret answer.');
      return;
    }

    if (currentStep < 3) {
      setCurrentStep((prev) => ((prev + 1) as 1 | 2 | 3));
      setShowAnswer(false);
    }
  };

  const handlePreviousStep = () => {
    setErrorMessage(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => ((prev - 1) as 1 | 2 | 3));
      setShowAnswer(false);
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    if (!currentAnswerData.key) {
      setErrorMessage('Please choose a security question.');
      return;
    }
    if (!currentAnswerData.answer.trim()) {
      setErrorMessage('Please enter your secret answer.');
      return;
    }

    // Check all 3 answers are present
    for (let i = 1; i <= 3; i++) {
      if (!answers[i]?.key || !answers[i]?.answer.trim()) {
        setErrorMessage(`Please complete question ${i} before submitting.`);
        setCurrentStep(i as 1 | 2 | 3);
        return;
      }
    }

    setIsLoading(true);
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
      setSuccessMessage('Security questions configured successfully!');

      setTimeout(() => {
        navigate('/profile', { replace: true });
      }, 1500);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to save security questions. Please check your answers and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-6">
      {/* Root Branded Header */}
      <AppHeader
        variant="root"
        title="Finance Tracker"
        subtitle={`Welcome back, ${user?.firstName || user?.fullName || 'User'}`}
      />

      <div className="p-4 space-y-4">
        {/* Sub-Header Title Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePreviousStep}
              aria-label="Go back"
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 active:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 transition-colors text-slate-700"
            >
              <ChevronLeft className="w-6 h-6" aria-hidden="true" />
            </button>
            <div>
              <h2 className="text-base font-bold text-textDefault tracking-tight leading-tight">
                Security Questions
              </h2>
              <p className="text-xs text-textMuted mt-0.5">
                Set up security questions to keep your account safe
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50/80 border border-blue-100 text-brand-primary text-[11px] font-semibold shrink-0">
            <Lock className="w-3.5 h-3.5" />
            <span>Your security matters</span>
          </div>
        </div>

        {/* Security Advisory Callout Card */}
        <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-brand-primary shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-800">Add 3 security questions</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Used to recover your password. Answers are encrypted and case-insensitive.
            </p>
          </div>
        </div>

        {/* 3-Step Stepper */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between relative">
            {/* Connecting Lines */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
            <div
              className="absolute top-4 left-6 h-0.5 bg-brand-primary transition-all duration-300 -z-0"
              style={{
                width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : 'calc(100% - 48px)',
              }}
            />

            {/* Step 1 */}
            <div className="flex flex-col items-center relative z-10">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
                  currentStep >= 1
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                1
              </button>
              <span
                className={`text-[11px] mt-1.5 font-semibold ${
                  currentStep === 1 ? 'text-brand-primary font-bold' : 'text-slate-500'
                }`}
              >
                Question 1
              </span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center relative z-10">
              <button
                type="button"
                onClick={() => {
                  if (answers[1]?.answer) setCurrentStep(2);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
                  currentStep >= 2
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                2
              </button>
              <span
                className={`text-[11px] mt-1.5 font-semibold ${
                  currentStep === 2 ? 'text-brand-primary font-bold' : 'text-slate-500'
                }`}
              >
                Question 2
              </span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center relative z-10">
              <button
                type="button"
                onClick={() => {
                  if (answers[1]?.answer && answers[2]?.answer) setCurrentStep(3);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
                  currentStep >= 3
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                3
              </button>
              <span
                className={`text-[11px] mt-1.5 font-semibold ${
                  currentStep === 3 ? 'text-brand-primary font-bold' : 'text-slate-500'
                }`}
              >
                Question 3
              </span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-semantic-danger text-xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div
            role="status"
            className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-semantic-success text-xs"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Question Form Card */}
        <Card className="p-5 space-y-4 shadow-card">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {`QUESTION ${currentStep} OF 3`}
            </span>
            <h3 className="text-base font-bold text-textDefault mt-0.5">
              Choose a security question
            </h3>
            <p className="text-xs text-textMuted mt-0.5">
              Select a question from the list and provide your answer.
            </p>
          </div>

          {/* Security Question Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-textDefault">
              Security Question <span className="text-semantic-danger">*</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 pointer-events-none">
                <HelpCircle className="w-4 h-4" />
              </div>
              <select
                value={currentAnswerData.key}
                onChange={(e) => handleQuestionChange(e.target.value)}
                className="w-full pl-12 pr-8 py-2.5 bg-white border border-borderDefault rounded-xl text-xs text-textDefault appearance-none focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="" disabled>
                  Choose a question...
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

          {/* Answer Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-textDefault">
              Your Answer <span className="text-semantic-danger">*</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 pointer-events-none">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showAnswer ? 'text' : 'password'}
                placeholder="Enter your answer"
                value={currentAnswerData.answer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                className="w-full pl-12 pr-10 py-2.5 bg-white border border-borderDefault rounded-xl text-xs text-textDefault focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <button
                type="button"
                onClick={() => setShowAnswer(!showAnswer)}
                aria-label={showAnswer ? 'Hide answer' : 'Show answer'}
                className="absolute right-3 text-slate-400 hover:text-slate-600 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 p-1"
              >
                {showAnswer ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Info Callout */}
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
            <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
            <span>Choose an answer easy for you to remember, hard to guess.</span>
          </div>
        </Card>

        {/* Bottom Actions */}
        <div className="pt-2">
          {currentStep < 3 ? (
            <Button
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleNextStep}
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              Next Question
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handlePreviousStep}
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isLoading}
                onClick={handleSubmit}
                iconRight={<Shield className="w-4 h-4" />}
              >
                {isLoading ? 'Saving Security Questions...' : 'Save Security Questions'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityQuestionsPage;
