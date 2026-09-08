import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  User,
  Shield,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Info,
  Save,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  TrendingUp,
  Target,
  Briefcase,
  Phone,
  Mail,
  Calendar,
  MapPin,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { PhoneInputWithCountry } from '../components/ui/PhoneInputWithCountry.js';
import { useAuthStore } from '../store/authStore.js';
import { apiClient } from '../services/apiClient.js';
import { formatCurrency, getCurrencySymbol } from '../utils/currency.js';
import { useUserCurrency } from '../hooks/useUserCurrency.js';
import { validateAndNormalizePhone } from '@finance/shared-types';
import type { RiskAppetite, InvestmentHorizon } from '@finance/shared-types';

export const ProfileSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currency: userCurrency } = useUserCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') === 'finance' ? 'finance' : 'basic';
  const [activeTab, setActiveTab] = useState<'basic' | 'finance'>(activeTabParam);

  const { user, kbaConfigured, updateUser } = useAuthStore();

  // Basic Profile State
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [mobileNumber, setMobileNumber] = useState(user?.mobileNumber || '');
  const [email, setEmail] = useState(user?.email || '');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');

  // Finance Profile State — initialised empty; populated by useEffect from API
  const [monthlyIncome, setMonthlyIncome] = useState<number | string>('');
  const [monthlyExpenseBudget, setMonthlyExpenseBudget] = useState<number | string>('');
  const [monthlyInvestmentTarget, setMonthlyInvestmentTarget] = useState<number | string>('');
  const [incomeRange, setIncomeRange] = useState('');
  const [savingsTarget, setSavingsTarget] = useState<number | string>('');

  const [investmentExperience, setInvestmentExperience] = useState('Intermediate');
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetite>('MEDIUM');
  const [investmentHorizon, setInvestmentHorizon] = useState<InvestmentHorizon>('MEDIUM');

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync tab change
  const handleTabChange = (tab: 'basic' | 'finance') => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  // Fetch initial profile data
  useEffect(() => {
    let mounted = true;
    apiClient.profile
      .get()
      .then((data: any) => {
        if (!mounted || !data) return;

        const u = data.user;
        if (u) {
          if (u.firstName) setFirstName(u.firstName);
          if (u.lastName) setLastName(u.lastName);
          if (u.mobileNumber) setMobileNumber(u.mobileNumber);
          if (u.email) setEmail(u.email);
        }

        const fp = data.financeProfile;
        if (fp) {
          if (fp.dateOfBirth) {
            const d = new Date(fp.dateOfBirth);
            setDateOfBirth(d.toISOString().split('T')[0] || '');
          }
          if (fp.address) setAddress(fp.address);
          if (fp.monthlyIncome !== undefined) setMonthlyIncome(fp.monthlyIncome);
          if (fp.monthlyExpenseBudget !== undefined) setMonthlyExpenseBudget(fp.monthlyExpenseBudget);
          if (fp.monthlyInvestmentTarget !== undefined) setMonthlyInvestmentTarget(fp.monthlyInvestmentTarget);
          if (fp.incomeRange) setIncomeRange(fp.incomeRange);
          if (fp.savingsTarget !== undefined && fp.savingsTarget !== null) setSavingsTarget(fp.savingsTarget);
          if (fp.investmentExperience) setInvestmentExperience(fp.investmentExperience);
          if (fp.riskAppetite) setRiskAppetite(fp.riskAppetite);
          if (fp.investmentHorizon) setInvestmentHorizon(fp.investmentHorizon);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  // Save Basic Profile (PUT /api/v1/profile/basic)
  const handleSaveBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    if (mobileNumber.trim()) {
      const phoneVal = validateAndNormalizePhone(mobileNumber.trim());
      if (!phoneVal.isValid) {
        setIsLoading(false);
        setErrorMessage(phoneVal.error || 'Please enter a valid mobile number.');
        return;
      }
    }

    try {
      await apiClient.profile.updateBasic({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        mobileNumber: mobileNumber.trim() || undefined,
        phone: mobileNumber.trim() || undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
        address: address.trim() || undefined,
      });

      updateUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        mobileNumber: mobileNumber.trim() || null,
      });

      setSuccessMessage('Basic profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to update profile. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Save Finance Profile (PUT /api/v1/profile/finance)
  const handleSaveFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage(null);
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

      setSuccessMessage('Finance profile targets updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to save financial profile. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-6">
      {/* Root Branded Navy Header */}
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
              onClick={() => navigate('/profile')}
              aria-label="Go back to profile"
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 active:bg-slate-300 transition-colors text-slate-700"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-base font-bold text-textDefault tracking-tight leading-tight">
                {activeTab === 'basic' ? 'Basic Profile' : 'Finance Profile'}
              </h2>
              <p className="text-xs text-textMuted mt-0.5">
                {activeTab === 'basic'
                  ? 'Manage your personal information'
                  : 'Set your monthly income, budget and investment targets'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50/80 border border-blue-100 text-brand-primary text-[11px] font-semibold shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Your data is secure and private</span>
          </div>
        </div>

        {/* Tab Segmented Control */}
        <div className="flex p-1 bg-slate-200/80 rounded-2xl">
          <button
            type="button"
            onClick={() => handleTabChange('basic')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'basic'
                ? 'bg-white text-brand-primary shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Personal Details
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('finance')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'finance'
                ? 'bg-white text-brand-primary shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Finance Targets
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div
            role="status"
            className="p-3.5 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-2 text-semantic-success text-xs font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-semantic-danger text-xs font-semibold"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* BASIC PROFILE TAB */}
        {activeTab === 'basic' && (
          <form onSubmit={handleSaveBasic} className="space-y-4">
            {/* Personal Details Card */}
            <Card className="p-5 space-y-4 shadow-card">
              <div className="flex items-center gap-3 pb-2 border-b border-borderDefault">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-brand-primary shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-textDefault">Personal Details</h3>
                  <p className="text-xs text-textMuted">Tell us about yourself</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  required
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  icon={<User className="w-4 h-4 text-slate-400" />}
                />
                <Input
                  label="Last Name"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              {/* Mobile Number */}
              <PhoneInputWithCountry
                label="Mobile Number"
                required
                value={mobileNumber}
                onChange={(val) => setMobileNumber(val)}
              />

              {/* Email Address (Read-only) */}
              <Input
                label="Email Address"
                type="email"
                required
                disabled
                value={email}
                icon={<Mail className="w-4 h-4 text-slate-400" />}
              />

              {/* Date of Birth */}
              {(() => {
                const maxDobDate = new Date();
                maxDobDate.setFullYear(maxDobDate.getFullYear() - 16);
                const maxDobStr = maxDobDate.toISOString().slice(0, 10);
                return (
                  <Input
                    label="Date of Birth"
                    type="date"
                    required
                    max={maxDobStr}
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    icon={<Calendar className="w-4 h-4 text-slate-400" />}
                    helperText="Must be at least 16 years old."
                    disabled={isLoading}
                  />
                );
              })()}


              {/* Address */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-textDefault">
                  Address
                </label>
                <div className="relative flex items-start">
                  <div className="absolute left-3 top-3 text-slate-400 pointer-events-none">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <textarea
                    rows={3}
                    maxLength={200}
                    placeholder="123, MG Road, Bangalore"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-borderDefault bg-white text-textDefault placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                </div>
                <div className="text-[10px] text-textMuted text-right">
                  {address.length}/200
                </div>
              </div>

              {/* Info Notice */}
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
                <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                <span>Keep your details updated for accurate insights.</span>
              </div>
            </Card>

            {/* Security Questions Status Card */}
            <Card className="p-4 space-y-3 bg-amber-50/40 border border-amber-200/60 shadow-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Security</h3>
                  <p className="text-[11px] text-slate-600">Protect your account</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/security/questions')}
                className="w-full p-3 bg-white rounded-xl border border-amber-200/80 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-semantic-danger shrink-0 font-bold">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-textDefault">
                      Security Questions (KBA)
                    </h4>
                    <p className="text-[11px] text-textMuted mt-0.5">
                      {kbaConfigured
                        ? 'Configured - 3 secret questions active'
                        : 'Not set - set them to enable password recovery'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            </Card>

            {/* Save Profile Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isLoading}
              icon={<Save className="w-4 h-4" />}
            >
              {isLoading ? 'Saving Profile...' : 'Save Profile'}
            </Button>
          </form>
        )}

        {/* FINANCE PROFILE TAB */}
        {activeTab === 'finance' && (
          <form onSubmit={handleSaveFinance} className="space-y-4">
            {/* Monthly Baseline Targets Card */}
            <Card className="p-5 space-y-4 shadow-card">
              <div className="flex items-center gap-3 pb-2 border-b border-borderDefault">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-semantic-success shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-textDefault">Monthly Targets</h3>
                  <p className="text-xs text-textMuted">Establish baseline financial parameters</p>
                </div>
              </div>

              <Input
                label="Expected Monthly Income"
                type="number"
                required
                min={0}
                step={500}
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                icon={<span className="text-xs font-bold text-slate-400">{getCurrencySymbol(userCurrency)}</span>}
                helperText={`Formatted: ${formatCurrency(monthlyIncome, userCurrency)}`}
              />

              <Input
                label="Monthly Expense Budget"
                type="number"
                required
                min={0}
                step={500}
                value={monthlyExpenseBudget}
                onChange={(e) => setMonthlyExpenseBudget(e.target.value)}
                icon={<span className="text-xs font-bold text-slate-400">{getCurrencySymbol(userCurrency)}</span>}
                helperText={`Formatted: ${formatCurrency(monthlyExpenseBudget, userCurrency)}`}
              />

              <Input
                label="Monthly Investment Target"
                type="number"
                min={0}
                step={500}
                value={monthlyInvestmentTarget}
                onChange={(e) => setMonthlyInvestmentTarget(e.target.value)}
                icon={<TrendingUp className="w-4 h-4 text-slate-400" />}
                helperText={`Formatted: ${formatCurrency(monthlyInvestmentTarget, userCurrency)}`}
              />

              {/* Summary Breakdown */}
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Monthly Income:</span>
                  <span className="font-bold text-semantic-success">
                    {formatCurrency(monthlyIncome, userCurrency)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Expense Budget:</span>
                  <span className="font-bold text-semantic-danger">
                    {formatCurrency(monthlyExpenseBudget, userCurrency)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Investment Target:</span>
                  <span className="font-bold text-semantic-investment">
                    {formatCurrency(monthlyInvestmentTarget, userCurrency)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Investment Parameters Card */}
            <Card className="p-5 space-y-4 shadow-card">
              <div className="flex items-center gap-3 pb-2 border-b border-borderDefault">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-semantic-investment shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-textDefault">Investor Parameters</h3>
                  <p className="text-xs text-textMuted">Preferences for recommendations and allocations</p>
                </div>
              </div>

              <Select
                label="Annual Income Range"
                value={incomeRange}
                onChange={(e) => setIncomeRange(e.target.value)}
                options={
                  userCurrency === 'INR'
                    ? [
                        { value: 'Below ₹3,00,000', label: 'Below ₹3,00,000' },
                        { value: '₹3,00,000 - ₹5,00,000', label: '₹3,00,000 - ₹5,00,000' },
                        { value: '₹5,00,000 - ₹10,00,000', label: '₹5,00,000 - ₹10,00,000' },
                        { value: '₹10,00,000 - ₹25,00,000', label: '₹10,00,000 - ₹25,00,000' },
                        { value: 'Above ₹25,00,000', label: 'Above ₹25,00,000' },
                      ]
                    : [
                        { value: `Below ${getCurrencySymbol(userCurrency)}30,000`, label: `Below ${getCurrencySymbol(userCurrency)}30,000` },
                        { value: `${getCurrencySymbol(userCurrency)}30,000 - ${getCurrencySymbol(userCurrency)}60,000`, label: `${getCurrencySymbol(userCurrency)}30,000 - ${getCurrencySymbol(userCurrency)}60,000` },
                        { value: `${getCurrencySymbol(userCurrency)}60,000 - ${getCurrencySymbol(userCurrency)}100,000`, label: `${getCurrencySymbol(userCurrency)}60,000 - ${getCurrencySymbol(userCurrency)}100,000` },
                        { value: `${getCurrencySymbol(userCurrency)}100,000 - ${getCurrencySymbol(userCurrency)}250,000`, label: `${getCurrencySymbol(userCurrency)}100,000 - ${getCurrencySymbol(userCurrency)}250,000` },
                        { value: `Above ${getCurrencySymbol(userCurrency)}250,000`, label: `Above ${getCurrencySymbol(userCurrency)}250,000` },
                      ]
                }
              />

              <Input
                label="Annual Savings Target"
                type="number"
                min={0}
                step={5000}
                value={savingsTarget}
                onChange={(e) => setSavingsTarget(e.target.value)}
                icon={<span className="text-xs font-bold text-slate-400">{getCurrencySymbol(userCurrency)}</span>}
                helperText={`Target: ${formatCurrency(savingsTarget, userCurrency)}`}
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

            {/* Save Finance Profile Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isLoading}
              icon={<Save className="w-4 h-4" />}
            >
              {isLoading ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfileSettingsPage;
