import React, { useState } from 'react';
import {
  Shield,
  Lock,
  TrendingUp,
  FileText,
  Lightbulb,
  User,
  Target,
  FileSpreadsheet,
  ArrowLeftRight,
  Award,
  BarChart3,
  CheckCircle2,
  Sparkles,
  Wallet,
  PieChart,
  CloudUpload,
  CloudDownload,
  Bell,
  KeyRound,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';

export const AboutPage: React.FC = () => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const toggleStep = (stepIndex: number) => {
    setExpandedStep(expandedStep === stepIndex ? null : stepIndex);
  };

  const steps = [
    {
      num: 1,
      title: 'Set up your basic profile',
      summary: 'Basic info, KBA security questions, and features',
      desc: 'Fill in your personal details and set your 3 security questions (KBA) for account recovery.',
      icon: <User className="w-5 h-5 text-brand-primary" />,
      iconBg: 'bg-blue-50',
    },
    {
      num: 2,
      title: 'Set your monthly budget & targets',
      summary: 'Monthly Finance Budget goals',
      desc: 'In Finance Profile, set your monthly income expectation, expense budget ceiling, and investment target.',
      icon: <Target className="w-5 h-5 text-emerald-600" />,
      iconBg: 'bg-emerald-50',
    },
    {
      num: 3,
      title: 'Tell the app your regular money items',
      summary: 'Regular income, expenses, and investments',
      desc: 'Select and configure your regular recurring income, expense, and investment items.',
      icon: <FileSpreadsheet className="w-5 h-5 text-amber-600" />,
      iconBg: 'bg-amber-50',
    },
    {
      num: 4,
      title: 'Record your transactions',
      summary: 'Transactions tab, types, and actuals',
      desc: 'Add actual income, expense, investment, and transfer transactions as they occur.',
      icon: <ArrowLeftRight className="w-5 h-5 text-indigo-600" />,
      iconBg: 'bg-indigo-50',
    },
    {
      num: 5,
      title: 'Check your FAM score',
      summary: 'Comprehensive 3-segment discipline scoring',
      desc: 'Review your Financial Allocation Meter (FAM) on your dashboard to evaluate your financial performance against target benchmarks.',
      famRules: [
        {
          label: 'Expenses',
          condition: '<=80% = A+, 81-100% = B, >100% = C',
          detail: 'Measured against your monthly living expense budget ceiling.',
        },
        {
          label: 'Investments',
          condition: '>=100% = A+, 70-99% = B, <70% = C',
          detail: 'Measured against your monthly wealth building and SIP target.',
        },
        {
          label: 'Income',
          condition: '>=100% = A+, 70-99% = B, <70% = C',
          detail: 'Measured against your earned monthly target baseline.',
        },
        {
          label: 'Overall Grade',
          condition: 'Worst of three rules',
          detail: 'Your overall score is determined by the lowest grade among the three pillars.',
        },
      ],
      icon: <Award className="w-5 h-5 text-purple-600" />,
      iconBg: 'bg-purple-50',
    },
    {
      num: 6,
      title: 'Plan ahead & review reports',
      summary: 'Planning budgets, goals, reports, analytics',
      desc: 'Track spending caps in Planning, generate statements in Reports, and view AI wealth projections.',
      icon: <BarChart3 className="w-5 h-5 text-cyan-600" />,
      iconBg: 'bg-cyan-50',
    },
  ];

  const deliverables = [
    {
      title: 'AI Analysis & Forward Projections',
      desc: 'Real-time forward wealth projection models and category-level spending health suggestions.',
      icon: <Sparkles className="w-4 h-4 text-amber-600" />,
      iconBg: 'bg-amber-50',
    },
    {
      title: 'Multi-Account Balance Tracking',
      desc: 'Unified account balance tracking across bank accounts, credit cards, savings, and investments.',
      icon: <Wallet className="w-4 h-4 text-brand-primary" />,
      iconBg: 'bg-blue-50',
    },
    {
      title: 'Financial Allocation Meter (FAM)',
      desc: 'Proprietary 3-segment ring evaluating expense discipline, investment rate, and income stability.',
      icon: <PieChart className="w-4 h-4 text-purple-600" />,
      iconBg: 'bg-purple-50',
    },
    {
      title: 'CSV Transaction Import',
      desc: 'Bulk import transaction records from bank statements directly into designated accounts.',
      icon: <CloudUpload className="w-4 h-4 text-emerald-600" />,
      iconBg: 'bg-emerald-50',
    },
    {
      title: 'Universal Data Export',
      desc: 'Instant full financial records backup with support for CSV and structured JSON formats.',
      icon: <CloudDownload className="w-4 h-4 text-blue-600" />,
      iconBg: 'bg-blue-50',
    },
    {
      title: 'Realtime Notifications & Reminders',
      desc: 'Due-date alerts, month-end spending reminders, and transaction confirmation feeds.',
      icon: <Bell className="w-4 h-4 text-rose-600" />,
      iconBg: 'bg-rose-50',
    },
    {
      title: 'Knowledge-Based Authentication (KBA)',
      desc: 'Multi-question security challenge tier safeguarding sensitive financial actions and account recovery.',
      icon: <KeyRound className="w-4 h-4 text-indigo-600" />,
      iconBg: 'bg-indigo-50',
    },
  ];

  return (
    <div className="flex-1 flex flex-col pb-8">
      <AppHeader
        variant="nested"
        title="About"
        subtitle="Track Today. Build a Brighter Tomorrow."
        backTo="/menu"
      />

      <div className="p-4 space-y-4">
        {/* Hero Block */}
        <div className="bg-gradient-to-b from-slate-900 to-[#102347] rounded-2xl p-6 text-white text-center shadow-lg relative overflow-hidden">
          <div className="absolute right-2 top-2 opacity-10 pointer-events-none">
            <TrendingUp className="w-32 h-32" />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            {/* Logo Badge */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-md flex items-center justify-center mb-3">
              <div className="w-full h-full bg-[#0B1B3A] rounded-[14px] flex items-center justify-center">
                <Layers className="w-8 h-8 text-amber-400" />
              </div>
            </div>

            <h2 className="text-xl font-black tracking-tight text-white">Finance Tracker</h2>
            <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 text-slate-200">
              Version 1.0
            </div>
            <p className="text-xs text-slate-300 mt-2 max-w-[280px]">
              Track Today. Build a Brighter Tomorrow.
            </p>
          </div>
        </div>

        {/* 3 Trust Badges */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white border border-borderDefault rounded-xl p-2.5 flex flex-col items-center text-center shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-primary flex items-center justify-center mb-1.5">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-textDefault leading-tight">
              Your Data Your Control
            </span>
          </div>

          <div className="bg-white border border-borderDefault rounded-xl p-2.5 flex flex-col items-center text-center shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5">
              <Lock className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-textDefault leading-tight">
              Secure & Private
            </span>
          </div>

          <div className="bg-white border border-borderDefault rounded-xl p-2.5 flex flex-col items-center text-center shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-textDefault leading-tight">
              Plan a Better Financial Future
            </span>
          </div>
        </div>

        {/* Card: About the Application */}
        <Card className="p-4 space-y-2.5 bg-white border border-borderDefault shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-textDefault">About the application</h3>
              <p className="text-[11px] text-textMuted leading-tight">Personal finance companion</p>
            </div>
          </div>

          <p className="text-xs text-textMuted leading-relaxed pt-1">
            Track income, expenses, and investments in one place. Set targets and monitor health using the Financial Allocation Meter (FAM).
          </p>
        </Card>

        {/* Card: How to use Finance Tracker (6-Step Interactive Guide) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Lightbulb className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="text-xs font-bold text-textDefault">How to use Finance Tracker</h3>
              <p className="text-[11px] text-textMuted">New here? Follow these steps to get the most out of the app.</p>
            </div>
          </div>

          <div className="space-y-2">
            {steps.map((s) => {
              const isExpanded = expandedStep === s.num;
              return (
                <Card
                  key={s.num}
                  padding="none"
                  className="bg-white border border-borderDefault shadow-xs overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleStep(s.num)}
                    aria-expanded={isExpanded}
                    aria-controls={`step-content-${s.num}`}
                    className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-brand-primary text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs" aria-hidden="true">
                        {s.num}
                      </div>
                      <div className="min-w-0">
                        <h4 id={`step-header-${s.num}`} className="text-xs font-bold text-textDefault leading-tight">
                          {s.title}
                        </h4>
                        <p className="text-[11px] text-textMuted leading-tight truncate mt-0.5">
                          {s.summary}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`w-8 h-8 rounded-xl ${s.iconBg} flex items-center justify-center`} aria-hidden="true">
                        {s.icon}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" aria-hidden="true" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Guide Content */}
                  {isExpanded && (
                    <div id={`step-content-${s.num}`} role="region" aria-labelledby={`step-header-${s.num}`} className="px-4 pb-4 pt-1 border-t border-borderDefault/60 bg-slate-50/50 space-y-3">
                      <p className="text-xs text-textMuted leading-relaxed">{s.desc}</p>

                      {/* FAM Scoring Rules Table */}
                      {s.famRules && (
                        <div className="space-y-1.5 pt-1">
                          <h5 className="text-[11px] font-bold text-textDefault uppercase tracking-wider">
                            Complete FAM Scoring Rules
                          </h5>
                          <div className="bg-white rounded-xl border border-borderDefault divide-y divide-borderDefault text-xs overflow-hidden">
                            {s.famRules.map((r) => (
                              <div key={r.label} className="p-2.5 flex items-start justify-between gap-2">
                                <div>
                                  <span className="font-bold text-textDefault">{r.label}: </span>
                                  <span className="text-[11px] text-textMuted">{r.detail}</span>
                                </div>
                                <span className="font-mono font-bold text-xs text-brand-primary shrink-0 bg-blue-50 px-2 py-0.5 rounded-md">
                                  {r.condition}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Comprehensive V1 Deliverables List */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <CheckCircle2 className="w-4 h-4 text-brand-primary" />
            <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider">
              All Features Available in V1
            </h3>
          </div>

          <Card padding="none" className="bg-white border border-borderDefault shadow-xs divide-y divide-borderDefault overflow-hidden">
            {deliverables.map((item) => (
              <div key={item.title} className="p-3.5 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-textDefault leading-tight">
                      {item.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 shrink-0">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-textMuted leading-relaxed mt-1">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
};
