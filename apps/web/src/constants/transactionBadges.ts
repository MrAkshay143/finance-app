import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowLeftRight,
} from 'lucide-react';
import type { TransactionType } from '../store/uiStore.js';
import type { BadgeVariant } from '../components/ui/Badge.js';

export interface TransactionBadgeConfig {
  variant: BadgeVariant;
  formatText: (formattedAmount: string) => string;
}

export const TRANSACTION_BADGE_CONFIGS: Record<TransactionType, TransactionBadgeConfig> = {
  income: {
    variant: 'success',
    formatText: (formattedAmount: string) => `+${formattedAmount}`,
  },
  expense: {
    variant: 'danger',
    formatText: (formattedAmount: string) => `-${formattedAmount}`,
  },
  investment: {
    variant: 'investment',
    formatText: (formattedAmount: string) => formattedAmount,
  },
  transfer: {
    variant: 'transfer',
    formatText: (formattedAmount: string) => `⇄ ${formattedAmount}`,
  },
};

export interface TransactionIconConfig {
  containerClassName: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const TRANSACTION_ICON_CONFIGS: Record<TransactionType, TransactionIconConfig> = {
  income: {
    containerClassName: 'w-10 h-10 rounded-xl bg-semantic-success-bg text-semantic-success flex items-center justify-center shrink-0 border border-emerald-100',
    icon: TrendingUp,
  },
  expense: {
    containerClassName: 'w-10 h-10 rounded-xl bg-semantic-danger-bg text-semantic-danger flex items-center justify-center shrink-0 border border-rose-100',
    icon: TrendingDown,
  },
  investment: {
    containerClassName: 'w-10 h-10 rounded-xl bg-semantic-investment-bg text-semantic-investment flex items-center justify-center shrink-0 border border-purple-100',
    icon: PiggyBank,
  },
  transfer: {
    containerClassName: 'w-10 h-10 rounded-xl bg-semantic-transfer-bg text-semantic-transfer flex items-center justify-center shrink-0 border border-blue-100',
    icon: ArrowLeftRight,
  },
};
