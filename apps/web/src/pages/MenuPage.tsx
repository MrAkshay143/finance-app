import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Settings,
  BarChart3,
  ShieldCheck,
  Sparkles,
  Lightbulb,
  CreditCard,
  Tag,
  Store,
  TrendingUp,
  Repeat,
  CloudUpload,
  CloudDownload,
  HelpCircle,
  Info,
  Shield,
  Users,
  Sliders,
  Activity,
  ChevronRight,
  Pencil,
  LifeBuoy,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Modal } from '../components/ui/Modal.js';
import { Button } from '../components/ui/Button.js';
import { useAuthStore } from '../store/authStore.js';

interface MenuItem {
  label: string;
  subtitle: string;
  path: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  onClick?: () => void;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const MenuPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const displayName = user?.fullName || user?.firstName || (user?.email ? user.email.split('@')[0] : 'User');
  const userEmail = user?.email || '—';
  const initial = (user?.firstName?.[0] || user?.fullName?.[0] || user?.email?.[0] || 'U').toUpperCase();

  const sections: MenuSection[] = [
    {
      title: 'ACCOUNT',
      items: [
        {
          label: 'Profile',
          subtitle: 'View and update your personal information',
          path: '/profile',
          icon: <User className="w-5 h-5" />,
          iconBg: 'bg-blue-50',
          iconColor: 'text-brand-primary',
        },
        {
          label: 'Settings',
          subtitle: 'App preferences, notifications and security',
          path: '/settings',
          icon: <Settings className="w-5 h-5" />,
          iconBg: 'bg-purple-50',
          iconColor: 'text-indigo-600',
        },
      ],
    },
    {
      title: 'INSIGHTS & ANALYTICS',
      items: [
        {
          label: 'Reports',
          subtitle: 'View detailed financial reports',
          path: '/reports',
          icon: <BarChart3 className="w-5 h-5" />,
          iconBg: 'bg-emerald-50',
          iconColor: 'text-emerald-600',
        },
        {
          label: 'Audit Log',
          subtitle: 'Track account activity and changes',
          path: '/audit',
          icon: <ShieldCheck className="w-5 h-5" />,
          iconBg: 'bg-indigo-50',
          iconColor: 'text-indigo-600',
        },
        {
          label: 'AI Analysis',
          subtitle: 'Get smart insights about your finances',
          path: '/ai-analysis',
          icon: <Sparkles className="w-5 h-5" />,
          iconBg: 'bg-amber-50',
          iconColor: 'text-amber-600',
        },
        {
          label: 'Insights',
          subtitle: 'Discover trends and personalized tips',
          path: '/analytics',
          icon: <Lightbulb className="w-5 h-5" />,
          iconBg: 'bg-rose-50',
          iconColor: 'text-rose-500',
        },
      ],
    },
    {
      title: 'FINANCE',
      items: [
        {
          label: 'Accounts',
          subtitle: 'Manage bank and financial accounts',
          path: '/accounts',
          icon: <CreditCard className="w-5 h-5" />,
          iconBg: 'bg-blue-50',
          iconColor: 'text-brand-primary',
        },
        {
          label: 'Categories',
          subtitle: 'Organize transaction categories',
          path: '/categories',
          icon: <Tag className="w-5 h-5" />,
          iconBg: 'bg-violet-50',
          iconColor: 'text-violet-600',
        },
        {
          label: 'Merchants',
          subtitle: 'Track payee merchants and vendors',
          path: '/merchants',
          icon: <Store className="w-5 h-5" />,
          iconBg: 'bg-amber-50',
          iconColor: 'text-amber-600',
        },
        {
          label: 'Investments',
          subtitle: 'Track portfolio and asset growth',
          path: '/investments',
          icon: <TrendingUp className="w-5 h-5" />,
          iconBg: 'bg-emerald-50',
          iconColor: 'text-emerald-600',
        },
        {
          label: 'Recurring',
          subtitle: 'Manage recurring bills and income',
          path: '/recurring',
          icon: <Repeat className="w-5 h-5" />,
          iconBg: 'bg-cyan-50',
          iconColor: 'text-cyan-600',
        },
      ],
    },
    {
      title: 'DATA & IMPORT',
      items: [
        {
          label: 'Import CSV',
          subtitle: 'Import your transaction data',
          path: '/import',
          icon: <CloudUpload className="w-5 h-5" />,
          iconBg: 'bg-blue-50',
          iconColor: 'text-brand-primary',
        },
        {
          label: 'Export Data',
          subtitle: 'Download your data',
          path: '/export',
          icon: <CloudDownload className="w-5 h-5" />,
          iconBg: 'bg-emerald-50',
          iconColor: 'text-emerald-600',
        },
      ],
    },
    {
      title: 'SUPPORT',
      items: [
        {
          label: 'Help & Support',
          subtitle: 'Get help and find answers',
          path: '/about',
          icon: <HelpCircle className="w-5 h-5" />,
          iconBg: 'bg-purple-50',
          iconColor: 'text-purple-600',
          onClick: () => setIsHelpModalOpen(true),
        },
        {
          label: 'About',
          subtitle: 'Application overview, FAM scoring & methodology',
          path: '/about',
          icon: <Info className="w-5 h-5" />,
          iconBg: 'bg-blue-50',
          iconColor: 'text-brand-primary',
        },
      ],
    },
  ];

  const adminSection: MenuSection = {
    title: 'ADMINISTRATION',
    items: [
      {
        label: 'Admin Dashboard',
        subtitle: 'Overview of users, system status, and metrics',
        path: '/admin',
        icon: <Shield className="w-5 h-5" />,
        iconBg: 'bg-rose-50',
        iconColor: 'text-rose-600',
      },
      {
        label: 'Manage Users',
        subtitle: 'View and manage user accounts and roles',
        path: '/admin/users',
        icon: <Users className="w-5 h-5" />,
        iconBg: 'bg-purple-50',
        iconColor: 'text-purple-600',
      },
      {
        label: 'App Settings',
        subtitle: 'Platform policies, timeouts, and thresholds',
        path: '/admin/settings',
        icon: <Sliders className="w-5 h-5" />,
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-600',
      },
      {
        label: 'System Audit',
        subtitle: 'Platform-wide security audit and logs',
        path: '/admin/audit',
        icon: <Activity className="w-5 h-5" />,
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-600',
      },
    ],
  };

  const renderedSections = user?.role === 'ADMIN' ? [...sections, adminSection] : sections;

  return (
    <div className="flex-1 flex flex-col pb-6">
      <AppHeader
        variant="root"
        title="Finance Tracker"
        subtitle={`Welcome back, ${displayName}`}
        avatarInitials={initial}
      />

      <div className="p-4 space-y-4">
        {/* Subheader */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 bg-brand-primary rounded-full" />
            <h2 className="text-xl font-bold text-textDefault">Menu</h2>
          </div>
          <p className="text-xs text-textMuted">Manage your account, data and preferences</p>
        </div>

        {/* User Profile Card */}
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-blue-50/70 border border-blue-100 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-full bg-brand-primary text-white text-xl font-bold flex items-center justify-center shrink-0 shadow-sm">
              {initial}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-textDefault leading-tight truncate">
                {displayName}
              </h3>
              <p className="text-xs text-textMuted mt-0.5 leading-tight truncate">{userEmail}</p>
              <div className="mt-1.5">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100/90 text-brand-primary">
                  Free Plan
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-borderDefault shadow-xs rounded-full text-xs font-semibold text-brand-primary hover:bg-blue-50 active:scale-95 transition shrink-0"
          >
            <Pencil className="w-3.5 h-3.5 text-brand-primary" />
            <span>Edit Profile</span>
            <ChevronRight className="w-3.5 h-3.5 text-brand-primary" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-4">
          {renderedSections.map((sec) => (
            <div key={sec.title} className="space-y-1.5">
              <h3 className="text-[11px] font-bold text-textMuted uppercase tracking-wider px-1">
                {sec.title}
              </h3>
              <Card padding="none" className="divide-y divide-borderDefault overflow-hidden bg-white shadow-xs">
                {sec.items.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => (item.onClick ? item.onClick() : navigate(item.path))}
                    className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0`}
                      >
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-textDefault leading-tight">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-textMuted mt-0.5 leading-tight truncate">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  </button>
                ))}
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Help & Support Modal */}
      <Modal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        title="Help & Support"
        subtitle="Assistance and resources"
        icon={<LifeBuoy className="w-5 h-5 text-brand-primary" />}
        footer={
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => setIsHelpModalOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => {
                setIsHelpModalOpen(false);
                navigate('/about');
              }}
            >
              View Full Guide
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs text-textMuted leading-relaxed">
          <p>
            Track finances, budgets, and allocation health with ease.
          </p>
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-textDefault space-y-1">
            <p className="font-bold text-brand-primary">Frequently Asked Questions</p>
            <p className="text-[11px] text-textMuted">
              View the About page for full details on FAM scoring.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-borderDefault text-textDefault space-y-1">
            <p className="font-bold">Need Personal Assistance?</p>
            <p className="text-[11px] text-textMuted">
              Contact support at support@financetracker.local.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
