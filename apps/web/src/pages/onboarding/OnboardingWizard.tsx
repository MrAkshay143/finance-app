import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Calendar,
  MapPin,
  Phone,
  IndianRupee,
  TrendingUp,
  Target,
  Shield,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { apiClient } from '../../services/apiClient.js';
import { Card } from '../../components/ui/Card.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Select } from '../../components/ui/Select.js';
import { PhoneInputWithCountry } from '../../components/ui/PhoneInputWithCountry.js';
import { formatCurrency, getCurrencySymbol, getIncomeBracketOptions } from '../../utils/currency.js';
import { useUserCurrency } from '../../hooks/useUserCurrency.js';
import { validateAndNormalizePhone } from '@finance/shared-types';
import type { RiskAppetite, InvestmentHorizon } from '@finance/shared-types';
import { validateAge, validateAmount } from '../../utils/validation.js';

export const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { user, setOnboardingCompleted } = useAuthStore();
  const { currency: userCurrency } = useUserCurrency();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1: Personal Details
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(user?.mobileNumber || '');

  // Minimum age 16 limit (Date must be at least 16 years in the past)
  const maxDobDate = new Date();
  maxDobDate.setFullYear(maxDobDate.getFullYear() - 16);
  const maxDobString = maxDobDate.toISOString().slice(0, 10);

  // Step 2: Monthly Targets (Rupees) - Start empty without prefilled dummy values
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [monthlyExpenseBudget, setMonthlyExpenseBudget] = useState<string>('');
  const [monthlyInvestmentTarget, setMonthlyInvestmentTarget] = useState<string>('');

  // Step 3: Financial Profile
  const [incomeRange, setIncomeRange] = useState('');
  const [savingsTarget, setSavingsTarget] = useState<string>('');
  const [investmentExperience, setInvestmentExperience] = useState('Intermediate');
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetite>('MEDIUM');
  const [investmentHorizon, setInvestmentHorizon] = useState<InvestmentHorizon>('MEDIUM');

  // Real-time validation checks
  const dobResult = dateOfBirth ? validateAge(dateOfBirth, 16) : null;
  const incomeResult = monthlyIncome ? validateAmount(monthlyIncome, userCurrency, false) : null;
  const expenseResult = monthlyExpenseBudget ? validateAmount(monthlyExpenseBudget, userCurrency, true) : null;
  const investResult = monthlyInvestmentTarget ? validateAmount(monthlyInvestmentTarget, userCurrency, true) : null;
  const savingsResult = savingsTarget ? validateAmount(savingsTarget, userCurrency, true) : null;

  const handleStep1Next = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side age validation: must be at least 16 years old
    if (dateOfBirth) {
      const selectedDob = new Date(dateOfBirth);
      if (selectedDob > maxDobDate) {
        setErrorMessage('You must be at least 16 years old to register.');
        return;
      }
    }

    if (phone.trim()) {
      const phoneVal = validateAndNormalizePhone(phone.trim());
      if (!phoneVal.isValid) {
        setErrorMessage(phoneVal.error || 'Please enter a valid mobile number.');
        return;
      }
    }

    setIsLoading(true);

    try {
      await apiClient.profile.updateBasic({
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        mobileNumber: phone.trim() || undefined,
      });

      setCurrentStep(2);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save personal details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const inc = Number(monthlyIncome);
    const exp = Number(monthlyExpenseBudget);

    if (!monthlyIncome || isNaN(inc) || inc <= 0) {
      setErrorMessage('Please enter a valid monthly income target greater than 0.');
      return;
    }

    if (!monthlyExpenseBudget || isNaN(exp) || exp < 0) {
      setErrorMessage('Please enter a valid monthly expense budget.');
      return;
    }

    setCurrentStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const inc = Number(monthlyIncome);
      const exp = Number(monthlyExpenseBudget);
      const inv = Number(monthlyInvestmentTarget);
      const sav = Number(savingsTarget);

      await apiClient.profile.updateFinanceProfile({
        monthlyIncome: inc,
        monthlyIncomeTarget: inc,
        monthlyExpenseBudget: exp,
        monthlyInvestmentTarget: isNaN(inv) ? 0 : inv,
        incomeRange,
        savingsTarget: isNaN(sav) ? 0 : sav,
        investmentExperience,
        riskAppetite,
        investmentHorizon,
      });

      setOnboardingCompleted(true);
      navigate('/security/questions', { replace: true });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save financial profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDF2F9] flex justify-center py-0">
      <div className="w-full max-w-[430px] min-h-screen bg-[#F3F6FC] relative flex flex-col shadow-2xl border-x border-[#E2E8F0] overflow-x-clip">
        {/* Dark Navy Header */}
        <header className="bg-gradient-to-b from-[#0B1B3A] to-[#132A5C] text-white pt-6 pb-6 px-5 rounded-b-[24px] shadow-header sticky top-0 z-30 text-center">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
              Welcome Onboard
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 text-white">
              {`Step ${currentStep} of 3`}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Financial Onboarding</h1>
          <p className="text-xs text-slate-300 mt-1">
            Set your baselines for FAM scores and insights.
          </p>

          {/* Stepper Progress Bar */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                currentStep >= 1 ? 'bg-brand-primary' : 'bg-white/20'
              }`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                currentStep >= 2 ? 'bg-brand-primary' : 'bg-white/20'
              }`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                currentStep >= 3 ? 'bg-brand-primary' : 'bg-white/20'
              }`}
            />
          </div>
        </header>

        {/* Wizard Main Content */}
        <main className="flex-1 p-5 space-y-4">
          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-semantic-danger"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-semantic-danger" />
              <p className="text-xs font-medium leading-tight">{errorMessage}</p>
            </div>
          )}

          {/* Step 1: Personal Details */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Next} className="space-y-4">
              <Card className="p-5 space-y-4">
                <div className="flex items-center gap-2.5 pb-1 border-b border-borderDefault">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-brand-primary">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-textDefault">Personal Details</h2>
                    <p className="text-xs text-textMuted">Tell us about yourself</p>
                  </div>
                </div>

                <Input
                  label="Date of Birth"
                  type="date"
                  max={maxDobString}
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  icon={<Calendar className="w-4 h-4 text-slate-400" />}
                  status={dobResult ? (dobResult.isValid ? 'valid' : 'invalid') : 'idle'}
                  validMessage={dobResult?.isValid ? dobResult.message : undefined}
                  error={dobResult && !dobResult.isValid ? dobResult.message : undefined}
                  helperText="Must be at least 16 years old to register."
                />

                <PhoneInputWithCountry
                  label="Phone / Mobile"
                  value={phone}
                  onChange={(val) => setPhone(val)}
                  helperText="Used for transaction alerts and recovery."
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-textDefault">
                    Address
                  </label>
                  <div className="relative">
                    <textarea
                      rows={3}
                      maxLength={200}
                      placeholder="Street address, City, State, PIN"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-borderDefault bg-white text-textDefault placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    />
                    <div className="text-[10px] text-textMuted text-right mt-0.5">
                      {address.length}/200
                    </div>
                  </div>
                </div>
              </Card>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isLoading}
                iconRight={<ArrowRight className="w-4 h-4" />}
              >
                {isLoading ? 'Saving...' : 'Continue to Monthly Targets'}
              </Button>
            </form>
          )}

          {/* Step 2: Monthly Targets */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Next} className="space-y-4">
              <Card className="p-5 space-y-4">
                <div className="flex items-center gap-2.5 pb-1 border-b border-borderDefault">
                  <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center text-semantic-success">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-textDefault">Monthly Financial Targets</h2>
                    <p className="text-xs text-textMuted">Establish income, budget & savings goals</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <Input
                    label="Expected Monthly Income"
                    type="number"
                    required
                    min={0}
                    step={500}
                    placeholder="e.g. 50000"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    icon={<span className="text-xs font-bold text-slate-400">{getCurrencySymbol(userCurrency)}</span>}
                    status={incomeResult ? (incomeResult.isValid ? 'valid' : 'invalid') : 'idle'}
                    validMessage={incomeResult?.formattedDisplay}
                    helperText={!incomeResult ? 'Expected monthly take-home income' : undefined}
                  />
                </div>

                <div className="space-y-1">
                  <Input
                    label="Monthly Expense Budget"
                    type="number"
                    required
                    min={0}
                    step={500}
                    placeholder="e.g. 30000"
                    value={monthlyExpenseBudget}
                    onChange={(e) => setMonthlyExpenseBudget(e.target.value)}
                    icon={<span className="text-xs font-bold text-slate-400">{getCurrencySymbol(userCurrency)}</span>}
                    status={expenseResult ? (expenseResult.isValid ? 'valid' : 'invalid') : 'idle'}
                    validMessage={expenseResult?.formattedDisplay}
                    helperText={!expenseResult ? 'Planned monthly spending cap' : undefined}
                  />
                </div>

                <div className="space-y-1">
                  <Input
                    label="Monthly Investment Target"
                    type="number"
                    min={0}
                    step={500}
                    placeholder="e.g. 10000"
                    value={monthlyInvestmentTarget}
                    onChange={(e) => setMonthlyInvestmentTarget(e.target.value)}
                    icon={<TrendingUp className="w-4 h-4 text-slate-400" />}
                    status={investResult ? (investResult.isValid ? 'valid' : 'idle') : 'idle'}
                    validMessage={investResult?.formattedDisplay}
                    helperText={!investResult ? 'Optional monthly investment allocation' : undefined}
                  />
                </div>

                {/* Summary Cardlet */}
                <div className="p-3 bg-blue-50/70 rounded-xl space-y-1.5 text-xs border border-blue-100">
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>Monthly Income:</span>
                    <span className="font-bold text-semantic-success">
                      {monthlyIncome ? formatCurrency(Number(monthlyIncome), userCurrency) : formatCurrency(0, userCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>Expense Budget:</span>
                    <span className="font-bold text-semantic-danger">
                      {monthlyExpenseBudget ? formatCurrency(Number(monthlyExpenseBudget), userCurrency) : formatCurrency(0, userCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>Investment Target:</span>
                    <span className="font-bold text-semantic-investment">
                      {monthlyInvestmentTarget ? formatCurrency(Number(monthlyInvestmentTarget), userCurrency) : formatCurrency(0, userCurrency)}
                    </span>
                  </div>
                </div>
              </Card>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => setCurrentStep(1)}
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  iconRight={<ArrowRight className="w-4 h-4" />}
                >
                  Continue to Profile
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Financial Profile */}
          {currentStep === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <Card className="p-5 space-y-4">
                <div className="flex items-center gap-2.5 pb-1 border-b border-borderDefault">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-semantic-investment">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-textDefault">Investor Profile</h2>
                    <p className="text-xs text-textMuted">Calibrate risk appetite & horizon</p>
                  </div>
                </div>

                <Select
                  label="Annual Income Range"
                  value={incomeRange}
                  onChange={(e) => setIncomeRange(e.target.value)}
                  options={[
                    { value: '', label: 'Select your income range...' },
                    ...getIncomeBracketOptions(userCurrency),
                  ]}
                />

                <Input
                  label="Annual Savings Target"
                  type="number"
                  min={0}
                  step={5000}
                  placeholder="e.g. 100000"
                  value={savingsTarget}
                  onChange={(e) => setSavingsTarget(e.target.value)}
                  icon={<span className="text-xs font-bold text-slate-400">{getCurrencySymbol(userCurrency)}</span>}
                  status={savingsResult ? (savingsResult.isValid ? 'valid' : 'idle') : 'idle'}
                  validMessage={savingsResult?.formattedDisplay}
                  helperText={!savingsResult ? 'Target annual savings goal' : undefined}
                />

                <Select
                  label="Investment Experience"
                  value={investmentExperience}
                  onChange={(e) => setInvestmentExperience(e.target.value)}
                  options={[
                    { value: 'Beginner', label: 'Beginner (New to investing)' },
                    { value: 'Intermediate', label: 'Intermediate (Stocks / Mutual Funds)' },
                    { value: 'Experienced', label: 'Experienced (Active Portfolio)' },
                    { value: 'Advanced', label: 'Advanced (Equities, F&O, Real Estate)' },
                  ]}
                />

                <Select
                  label="Risk Appetite"
                  value={riskAppetite}
                  onChange={(e) => setRiskAppetite(e.target.value as RiskAppetite)}
                  options={[
                    { value: 'LOW', label: 'Low (Capital Preservation Focus)' },
                    { value: 'MEDIUM', label: 'Medium (Balanced Growth & Security)' },
                    { value: 'HIGH', label: 'High (Aggressive Wealth Expansion)' },
                  ]}
                />

                <Select
                  label="Investment Horizon"
                  value={investmentHorizon}
                  onChange={(e) => setInvestmentHorizon(e.target.value as InvestmentHorizon)}
                  options={[
                    { value: 'SHORT', label: 'Short Term (Under 2 Years)' },
                    { value: 'MEDIUM', label: 'Medium Term (2 to 5 Years)' },
                    { value: 'LONG', label: 'Long Term (5+ Years)' },
                  ]}
                />
              </Card>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  disabled={isLoading}
                  onClick={() => setCurrentStep(2)}
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
                  iconRight={<CheckCircle2 className="w-4 h-4" />}
                >
                  {isLoading ? 'Completing Setup...' : 'Complete Onboarding'}
                </Button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
};

export default OnboardingWizard;
