import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSafeQueryClient } from '../hooks/useSafeQueryClient.js';
import { syncOnProfileMutation } from '../services/dataSync.js';
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
import { CountrySelector } from '../components/ui/CountrySelector.js';
import { CurrencySelector } from '../components/ui/CurrencySelector.js';
import { DatePicker } from '../components/ui/DatePicker.js';
import { CustomDropdown } from '../components/ui/CustomDropdown.js';
import { useAuthStore } from '../store/authStore.js';
import { apiClient, getFriendlyErrorMessage } from '../services/apiClient.js';
import { formatCurrency, getCurrencySymbol, getIncomeBracketOptions, computeIncomeBracket } from '../utils/currency.js';
import { useUserCurrency } from '../hooks/useUserCurrency.js';
import {
  validateAndNormalizePhone,
  COUNTRY_REGISTRY,
  DATE_FORMAT_OPTIONS,
  TIME_FORMAT_OPTIONS,
  type DateFormatType,
  type TimeFormatType,
  type RiskAppetite,
  type InvestmentHorizon,
  type CountryCode,
  type CurrencyCode,
} from '@finance/shared-types';
import { toast } from '../store/toastStore.js';

export const deriveAnnualIncomeRange = computeIncomeBracket;

export const ProfileSettingsPage: React.FC = () => {
  const queryClient = useSafeQueryClient();
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

  // Country & Currency State
  const [country, setCountry] = useState<CountryCode>((user?.country as CountryCode) || 'IN');
  const [currency, setCurrency] = useState<CurrencyCode>((userCurrency as CurrencyCode) || 'INR');
  const [dateFormat, setDateFormat] = useState<DateFormatType>('DD-MM-YYYY');
  const [timeFormat, setTimeFormat] = useState<TimeFormatType>('12h');

  const handleCountryChange = (newCountry: CountryCode) => {
    setCountry(newCountry);
    const meta = COUNTRY_REGISTRY[newCountry];
    if (meta?.defaultCurrency) {
      setCurrency(meta.defaultCurrency as CurrencyCode);
    }
    if (meta?.defaultDateFormat) {
      setDateFormat(meta.defaultDateFormat);
    }
    if (meta?.defaultTimeFormat) {
      setTimeFormat(meta.defaultTimeFormat);
    }
  };

  // Finance Profile State: initialised empty; populated by useEffect from API
  const [monthlyIncome, setMonthlyIncome] = useState<number | string>('');
  const [monthlyExpenseBudget, setMonthlyExpenseBudget] = useState<number | string>('');
  const [monthlyInvestmentTarget, setMonthlyInvestmentTarget] = useState<number | string>('');
  const [incomeRange, setIncomeRange] = useState('');
  const [savingsTarget, setSavingsTarget] = useState<number | string>('');

  const [investmentExperience, setInvestmentExperience] = useState('Intermediate');
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetite>('MEDIUM');
  const [investmentHorizon, setInvestmentHorizon] = useState<InvestmentHorizon>('MEDIUM');

  const [isLoading, setIsLoading] = useState(false);

  // Sync tab change
  const handleTabChange = (tab: 'basic' | 'finance') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Expected Monthly Income change handler: updates monthlyIncome and auto-selects Annual Income Range bracket
  const handleMonthlyIncomeChange = (val: string) => {
    setMonthlyIncome(val);
    const derived = deriveAnnualIncomeRange(val, userCurrency);
    if (derived) {
      setIncomeRange(derived);
    }
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
          if (u.country) setCountry(u.country as CountryCode);
        }

        if (data.userSettings?.currency) {
          setCurrency(data.userSettings.currency as CurrencyCode);
        }
        if (data.userSettings?.dateFormat) {
          setDateFormat(data.userSettings.dateFormat as DateFormatType);
        }
        if (data.userSettings?.timeFormat) {
          setTimeFormat(data.userSettings.timeFormat as TimeFormatType);
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

          // Normalize Annual Income Range: if empty or legacy invalid string, auto-derive from monthlyIncome
          const validOptions = getIncomeBracketOptions(userCurrency).map((opt) => opt.value);
          const currIncomeRange = fp.incomeRange;
          const derived = deriveAnnualIncomeRange(fp.monthlyIncome, userCurrency);

          if (currIncomeRange && validOptions.includes(currIncomeRange)) {
            setIncomeRange(currIncomeRange);
          } else if (derived) {
            setIncomeRange(derived);
          } else if (currIncomeRange) {
            setIncomeRange(currIncomeRange);
          }

          if (fp.savingsTarget !== undefined && fp.savingsTarget !== null) {
            setSavingsTarget(fp.savingsTarget);
          }

          if (fp.investmentExperience) {
            const exp = String(fp.investmentExperience).toLowerCase().trim();
            if (exp === 'beginner') setInvestmentExperience('Beginner');
            else if (exp === 'intermediate') setInvestmentExperience('Intermediate');
            else if (exp === 'experienced') setInvestmentExperience('Experienced');
            else if (exp === 'advanced') setInvestmentExperience('Advanced');
            else setInvestmentExperience(fp.investmentExperience);
          }

          if (fp.riskAppetite) {
            const r = String(fp.riskAppetite).toUpperCase().trim();
            if (r === 'LOW' || r === 'CONSERVATIVE') setRiskAppetite('LOW');
            else if (r === 'HIGH' || r === 'AGGRESSIVE') setRiskAppetite('HIGH');
            else setRiskAppetite('MEDIUM');
          }

          if (fp.investmentHorizon) {
            const h = String(fp.investmentHorizon).toUpperCase().trim();
            if (h === 'SHORT' || h === 'SHORT_TERM') setInvestmentHorizon('SHORT');
            else if (h === 'LONG' || h === 'LONG_TERM') setInvestmentHorizon('LONG');
            else setInvestmentHorizon('MEDIUM');
          }
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [userCurrency]);

  // Save Basic Profile (PUT /api/v1/profile/basic)
  const handleSaveBasic = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (mobileNumber.trim()) {
      const phoneVal = validateAndNormalizePhone(mobileNumber.trim());
      if (!phoneVal.isValid) {
        setIsLoading(false);
        toast.error(phoneVal.error || 'Please enter a valid mobile number.');
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
        country,
        currency,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : undefined,
        address: address.trim() || undefined,
      });

      await apiClient.settings.update({
        dateFormat,
        timeFormat,
      });

      updateUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        mobileNumber: mobileNumber.trim() || null,
        country,
        currency,
      });

      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      await syncOnProfileMutation(queryClient);
      toast.success('Basic profile updated successfully');
    } catch (err: any) {
      toast.error(getFriendlyErrorMessage(err, 'Failed to update profile. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Save Finance Profile (PUT /api/v1/profile/finance)
  const handleSaveFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const inc = Number(monthlyIncome);
      const exp = Number(monthlyExpenseBudget);
      const inv = Number(monthlyInvestmentTarget);
      const sav = Number(savingsTarget);

      // Ensure riskAppetite and investmentHorizon are strictly valid enums
      const rawRisk = String(riskAppetite).toUpperCase().trim();
      const cleanRisk: RiskAppetite =
        rawRisk === 'LOW' || rawRisk === 'CONSERVATIVE'
          ? 'LOW'
          : rawRisk === 'HIGH' || rawRisk === 'AGGRESSIVE'
          ? 'HIGH'
          : 'MEDIUM';

      const rawHorizon = String(investmentHorizon).toUpperCase().trim();
      const cleanHorizon: InvestmentHorizon =
        rawHorizon === 'SHORT' || rawHorizon === 'SHORT_TERM'
          ? 'SHORT'
          : rawHorizon === 'LONG' || rawHorizon === 'LONG_TERM'
          ? 'LONG'
          : 'MEDIUM';

      await apiClient.profile.updateFinanceProfile({
        monthlyIncome: inc,
        monthlyIncomeTarget: inc,
        monthlyExpenseBudget: exp,
        monthlyInvestmentTarget: isNaN(inv) ? 0 : inv,
        incomeRange,
        savingsTarget: isNaN(sav) ? 0 : sav,
        investmentExperience,
        riskAppetite: cleanRisk,
        investmentHorizon: cleanHorizon,
      });

      await syncOnProfileMutation(queryClient);
      toast.success('Finance profile targets updated successfully');
    } catch (err: any) {
      toast.error(getFriendlyErrorMessage(err, 'Failed to save financial profile. Please try again.'));
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

        {/* Tab Toggle Navigation */}
        <div className="flex bg-slate-200/80 p-1 rounded-2xl">
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

              {/* Country & Currency (Placed ABOVE Mobile Number) */}
              <div className="grid grid-cols-2 gap-3">
                <CountrySelector
                  label="Country"
                  required
                  value={country}
                  onChange={(val) => handleCountryChange(val as CountryCode)}
                  disabled={isLoading}
                />
                <CurrencySelector
                  label="Currency"
                  required
                  value={currency}
                  onChange={(val) => setCurrency(val as CurrencyCode)}
                  disabled={isLoading}
                />
              </div>

              {/* Mobile Number */}
              <PhoneInputWithCountry
                label="Mobile Number"
                required
                defaultCountry={country}
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

              {/* Date of Birth with Year 2000 jump and 120-year validation */}
              {(() => {
                const maxDobDate = new Date();
                maxDobDate.setFullYear(maxDobDate.getFullYear() - 16);
                const maxDobStr = maxDobDate.toISOString().slice(0, 10);
                return (
                  <DatePicker
                    label="Date of Birth"
                    required
                    isDob
                    max={maxDobStr}
                    value={dateOfBirth}
                    onChange={(val) => setDateOfBirth(val)}
                    helperText="Must be at least 16 years old."
                    disabled={isLoading}
                  />
                );
              })()}

              {/* Date & Time Preferences */}
              <div className="grid grid-cols-2 gap-3">
                <CustomDropdown
                  label="Date Format"
                  value={dateFormat}
                  onChange={(val) => setDateFormat(val as DateFormatType)}
                  options={DATE_FORMAT_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                  disabled={isLoading}
                  searchable={false}
                />
                <CustomDropdown
                  label="Time Format"
                  value={timeFormat}
                  onChange={(val) => setTimeFormat(val as TimeFormatType)}
                  options={TIME_FORMAT_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                  disabled={isLoading}
                  searchable={false}
                />
              </div>


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
                      Security Questions
                    </h4>
                    <p className="text-[11px] text-textMuted mt-0.5">
                      {kbaConfigured
                        ? 'Active - 3 security questions configured'
                        : 'Not set - add questions to enable account recovery'}
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
                onChange={(e) => handleMonthlyIncomeChange(e.target.value)}
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
                options={getIncomeBracketOptions(userCurrency)}
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
