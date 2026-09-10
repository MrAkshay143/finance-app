import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PieChart as PieChartIcon,
  Target,
  Plus,
  Calendar,
  AlertCircle,
  Pencil,
  Trash2,
  TrendingUp,
  Tag,
  CheckCircle2,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Modal } from '../components/ui/Modal.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { SegmentedControl } from '../components/ui/SegmentedControl.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { MetricCardSkeleton } from '../components/ui/Skeleton.js';
import { apiClient, getFriendlyErrorMessage } from '../services/apiClient.js';
import { formatCurrency, getCurrencySymbol } from '../utils/currency.js';
import { formatDate } from '../utils/date.js';
import { CONFIRM_DIALOGS } from '@finance/shared-ui-tokens';
import type { Category } from '@finance/shared-types';
import { toast } from '../store/toastStore.js';
import { syncOnBudgetMutation, syncOnGoalMutation } from '../services/dataSync.js';
import { AddCategoryModal } from '../components/finance/AddCategoryModal.js';

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    type: string;
    isSystem: boolean;
  } | null;
  name?: string | null;
  targetAmount: number;
  spent: number;
  remaining: number;
  progress: number;
  percentage: number;
  period?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount?: number;
  progress: number;
  percentage: number;
  targetDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export const PlanningPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'budgets' | 'goals'>('budgets');

  // Budget Modal State
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [budgetCategoryId, setBudgetCategoryId] = useState('');
  const [budgetTargetAmount, setBudgetTargetAmount] = useState('');
  const [budgetName, setBudgetName] = useState('');
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  // Goal Modal State
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalName, setGoalName] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalCurrentAmount, setGoalCurrentAmount] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalError, setGoalError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'budget' | 'goal';
    id: string;
    name: string;
  } | null>(null);

  // Queries
  const {
    data: budgets = [],
    isLoading: isBudgetsLoading,
    isError: isBudgetsError,
    refetch: refetchBudgets,
  } = useQuery<Budget[]>({
    queryKey: ['budgets'],
    queryFn: async () => {
      const res = await apiClient.rawAxios.get('/budgets');
      return res.data?.data || [];
    },
  });

  const {
    data: goals = [],
    isLoading: isGoalsLoading,
    isError: isGoalsError,
    refetch: refetchGoals,
  } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const res = await apiClient.rawAxios.get('/goals');
      return res.data?.data || [];
    },
  });

  const { data: userSettings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => apiClient.settings.get(),
  });
  const userCurrency = userSettings?.currency || 'INR';
  const currencySymbol = getCurrencySymbol(userCurrency);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories', 'EXPENSE'],
    queryFn: async () => {
      const res = await apiClient.categories.list('EXPENSE');
      return res || [];
    },
  });

  // Mutations for Budgets
  const createBudgetMutation = useMutation({
    mutationFn: async (payload: { categoryId: string; targetAmount: number; name?: string }) => {
      const res = await apiClient.rawAxios.post('/budgets', payload);
      return res.data?.data;
    },
    onSuccess: () => {
      syncOnBudgetMutation(queryClient);
      setIsAddBudgetOpen(false);
      resetBudgetForm();
      toast.success('Budget created successfully');
    },
    onError: (err: any) => {
      const msg = getFriendlyErrorMessage(err, 'Failed to create budget');
      setBudgetError(msg);
      toast.error(msg);
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { categoryId: string; targetAmount: number; name?: string } }) => {
      const res = await apiClient.rawAxios.put(`/budgets/${id}`, payload);
      return res.data?.data;
    },
    onSuccess: () => {
      syncOnBudgetMutation(queryClient);
      setIsEditBudgetOpen(false);
      resetBudgetForm();
      toast.success('Budget updated successfully');
    },
    onError: (err: any) => {
      const msg = getFriendlyErrorMessage(err, 'Failed to update budget');
      setBudgetError(msg);
      toast.error(msg);
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.rawAxios.delete(`/budgets/${id}`);
      return res.data?.data;
    },
    onSuccess: () => {
      syncOnBudgetMutation(queryClient);
      setDeleteConfirm(null);
      toast.success('Budget deleted successfully');
    },
    onError: (err: any) => {
      toast.error(getFriendlyErrorMessage(err, 'Failed to delete budget'));
    },
  });

  // Mutations for Goals
  const createGoalMutation = useMutation({
    mutationFn: async (payload: { name: string; targetAmount: number; currentAmount: number; targetDate: string }) => {
      const res = await apiClient.rawAxios.post('/goals', payload);
      return res.data?.data;
    },
    onSuccess: () => {
      syncOnGoalMutation(queryClient);
      setIsAddGoalOpen(false);
      resetGoalForm();
      toast.success('Goal created successfully');
    },
    onError: (err: any) => {
      const msg = getFriendlyErrorMessage(err, 'Failed to create goal');
      setGoalError(msg);
      toast.error(msg);
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { name: string; targetAmount: number; currentAmount: number; targetDate: string } }) => {
      const res = await apiClient.rawAxios.put(`/goals/${id}`, payload);
      return res.data?.data;
    },
    onSuccess: () => {
      syncOnGoalMutation(queryClient);
      setIsEditGoalOpen(false);
      resetGoalForm();
      toast.success('Goal updated successfully');
    },
    onError: (err: any) => {
      const msg = getFriendlyErrorMessage(err, 'Failed to update goal');
      setGoalError(msg);
      toast.error(msg);
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.rawAxios.delete(`/goals/${id}`);
      return res.data?.data;
    },
    onSuccess: () => {
      syncOnGoalMutation(queryClient);
      setDeleteConfirm(null);
      toast.success('Goal deleted successfully');
    },
    onError: (err: any) => {
      toast.error(getFriendlyErrorMessage(err, 'Failed to delete goal'));
    },
  });

  // Form helpers
  const resetBudgetForm = () => {
    setBudgetCategoryId(categories[0]?.id || '');
    setBudgetTargetAmount('');
    setBudgetName('');
    setSelectedBudget(null);
    setBudgetError(null);
  };

  const openAddBudgetModal = () => {
    resetBudgetForm();
    if (categories.length > 0) {
      setBudgetCategoryId(categories[0].id);
    }
    setIsAddBudgetOpen(true);
  };

  const openEditBudgetModal = (budget: Budget) => {
    setSelectedBudget(budget);
    setBudgetCategoryId(budget.categoryId);
    setBudgetTargetAmount(budget.targetAmount.toString());
    setBudgetName(budget.name || '');
    setBudgetError(null);
    setIsEditBudgetOpen(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(budgetTargetAmount);
    if (!budgetCategoryId) {
      setBudgetError('Please select a category');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setBudgetError('Please enter a positive budget amount');
      return;
    }
    setBudgetError(null);

    createBudgetMutation.mutate({
      categoryId: budgetCategoryId,
      targetAmount: amountNum,
      name: budgetName.trim() || undefined,
    });
  };

  const handleUpdateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudget) return;
    const amountNum = parseFloat(budgetTargetAmount);
    if (!budgetCategoryId) {
      setBudgetError('Please select a category');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setBudgetError('Please enter a positive budget amount');
      return;
    }
    setBudgetError(null);

    updateBudgetMutation.mutate({
      id: selectedBudget.id,
      payload: {
        categoryId: budgetCategoryId,
        targetAmount: amountNum,
        name: budgetName.trim() || undefined,
      },
    });
  };

  const resetGoalForm = () => {
    setGoalName('');
    setGoalTargetAmount('');
    setGoalCurrentAmount('0');
    // Default target date 1 year in future
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setGoalTargetDate(nextYear.toISOString().split('T')[0]);
    setSelectedGoal(null);
    setGoalError(null);
  };

  const openAddGoalModal = () => {
    resetGoalForm();
    setIsAddGoalOpen(true);
  };

  const openEditGoalModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setGoalName(goal.name);
    setGoalTargetAmount(goal.targetAmount.toString());
    setGoalCurrentAmount(goal.currentAmount.toString());
    const dateFormatted = goal.targetDate ? goal.targetDate.split('T')[0] : '';
    setGoalTargetDate(dateFormatted);
    setGoalError(null);
    setIsEditGoalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = Math.round(parseFloat(goalTargetAmount));
    const currentNum = Math.round(parseFloat(goalCurrentAmount || '0'));
    if (!goalName.trim()) {
      setGoalError('Please enter a goal name');
      return;
    }
    if (isNaN(targetNum) || targetNum <= 0) {
      setGoalError('Please enter a positive target amount');
      return;
    }
    if (isNaN(currentNum) || currentNum < 0) {
      setGoalError('Current amount cannot be negative');
      return;
    }
    if (!goalTargetDate) {
      setGoalError('Please specify a target date');
      return;
    }
    setGoalError(null);

    createGoalMutation.mutate({
      name: goalName.trim(),
      targetAmount: targetNum,
      currentAmount: currentNum,
      targetDate: new Date(goalTargetDate).toISOString(),
    });
  };

  const handleUpdateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    const targetNum = Math.round(parseFloat(goalTargetAmount));
    const currentNum = Math.round(parseFloat(goalCurrentAmount || '0'));
    if (!goalName.trim()) {
      setGoalError('Please enter a goal name');
      return;
    }
    if (isNaN(targetNum) || targetNum <= 0) {
      setGoalError('Please enter a positive target amount');
      return;
    }
    if (isNaN(currentNum) || currentNum < 0) {
      setGoalError('Current amount cannot be negative');
      return;
    }
    if (!goalTargetDate) {
      setGoalError('Please specify a target date');
      return;
    }
    setGoalError(null);

    updateGoalMutation.mutate({
      id: selectedGoal.id,
      payload: {
        name: goalName.trim(),
        targetAmount: targetNum,
        currentAmount: currentNum,
        targetDate: new Date(goalTargetDate).toISOString(),
      },
    });
  };

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <div className="flex-1 flex flex-col">
      {/* 1. Branded Navy Header with title "Planning" and subtitle "Budgets & Goals" */}
      <AppHeader
        variant="nested"
        title="Planning"
        subtitle="Budgets & Goals"
        rightAction={
          <Button
            variant="primary"
            size="sm"
            onClick={activeTab === 'budgets' ? openAddBudgetModal : openAddGoalModal}
            icon={<Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
          >
            {activeTab === 'budgets' ? 'Add Budget' : 'Add Goal'}
          </Button>
        }
      />

      <div className="p-4 space-y-4">
        {/* 2. Segmented Control */}
        <div>
          <SegmentedControl
            options={[
              {
                value: 'budgets',
                label: 'Monthly Budgets',
                icon: <PieChartIcon className="w-4 h-4" />,
              },
              {
                value: 'goals',
                label: 'Financial Goals',
                icon: <Target className="w-4 h-4" />,
              },
            ]}
            value={activeTab}
            onChange={(val) => setActiveTab(val as 'budgets' | 'goals')}
          />
        </div>

        {/* 3. Monthly Budgets Section */}
        {activeTab === 'budgets' && (
          <div className="space-y-3" data-testid="monthly-budgets-section">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider">
                  Active Spending Limits
                </h3>
                <Badge variant="neutral" size="sm">
                  {budgets.length}
                </Badge>
              </div>
            </div>

            {isBudgetsLoading ? (
              <div className="space-y-3">
                <MetricCardSkeleton />
                <MetricCardSkeleton />
              </div>
            ) : isBudgetsError ? (
              <Card className="p-4 text-center space-y-2">
                <p className="text-xs text-semantic-danger font-medium">Failed to load budgets.</p>
                <Button variant="outline" size="sm" onClick={() => refetchBudgets()}>
                  Retry
                </Button>
              </Card>
            ) : budgets.length === 0 ? (
              <EmptyState
                icon={<PieChartIcon className="w-7 h-7 stroke-[1.8]" />}
                title="No budgets set"
                description="Set category limits to track monthly spending."
                actionLabel="Add Budget"
                actionIcon={<Plus className="w-4 h-4" />}
                onAction={openAddBudgetModal}
              />
            ) : (
              <div className="space-y-3">
                {budgets.map((budget) => {
                  const percent = budget.progress ?? budget.percentage ?? 0;
                  const isOverBudget = percent > 100 || budget.spent > budget.targetAmount;
                  const isWarning = percent > 80 && !isOverBudget;

                  // Color-coded progress bar: green <=80%, amber 81-100%, red >100%
                  const progressBarColor = isOverBudget
                    ? 'bg-semantic-danger'
                    : isWarning
                    ? 'bg-semantic-warning'
                    : 'bg-semantic-success';

                  const categoryName = budget.category?.name || budget.name || 'Expense Category';

                  return (
                    <Card
                      key={budget.id}
                      padding="sm"
                      className="space-y-3 hover:border-blue-200 transition-colors"
                      data-testid={`budget-card-${budget.id}`}
                    >
                      {/* Card Header: Category name & icon, Edit & Delete buttons */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isOverBudget
                                ? 'bg-semantic-danger-bg text-semantic-danger'
                                : 'bg-brand-primary-soft text-brand-primary'
                            }`}
                          >
                            <Tag className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-textDefault truncate">
                                {categoryName}
                              </h4>
                              {isOverBudget && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-semantic-danger-bg text-semantic-danger border border-semantic-danger/20 shrink-0">
                                  Over Budget
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-textMuted mt-0.5 block">
                              Monthly Limit
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditBudgetModal(budget)}
                            aria-label={`Edit ${categoryName} budget`}
                            className="w-7 h-7 rounded-lg text-textMuted hover:text-brand-primary hover:bg-brand-primary-soft/50 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                          >
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirm({
                                type: 'budget',
                                id: budget.id,
                                name: categoryName,
                              })
                            }
                            aria-label={`Delete ${categoryName} budget`}
                            className="w-7 h-7 rounded-lg text-textMuted hover:text-semantic-danger hover:bg-semantic-danger-bg/50 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-danger focus-visible:ring-offset-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {/* Amounts Row */}
                      <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50 rounded-xl text-center">
                        <div>
                          <div className="text-[10px] font-medium text-textMuted uppercase">
                            Limit
                          </div>
                          <div className="text-xs font-bold text-textDefault mt-0.5 truncate">
                            {formatCurrency(budget.targetAmount, userCurrency)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-medium text-textMuted uppercase">
                            Spent
                          </div>
                          <div
                            className={`text-xs font-bold mt-0.5 truncate ${
                              isOverBudget ? 'text-semantic-danger' : 'text-textDefault'
                            }`}
                          >
                            {formatCurrency(budget.spent, userCurrency)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-medium text-textMuted uppercase">
                            Remaining
                          </div>
                          <div
                            className={`text-xs font-bold mt-0.5 truncate ${
                              isOverBudget ? 'text-semantic-danger' : 'text-semantic-success'
                            }`}
                          >
                            {formatCurrency(budget.remaining, userCurrency)}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar & Percentage */}
                      <div className="space-y-1">
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`}
                            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span
                            className={
                              isOverBudget
                                ? 'text-semantic-danger'
                                : isWarning
                                ? 'text-semantic-warning'
                                : 'text-semantic-success'
                            }
                          >
                            {`${percent}% of budget spent`}
                          </span>
                          <span className="text-textMuted">
                            {isOverBudget
                              ? `Exceeded by ${formatCurrency(budget.spent - budget.targetAmount, userCurrency)}`
                              : `${formatCurrency(budget.remaining, userCurrency)} left`}
                          </span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4. Financial Goals Section */}
        {activeTab === 'goals' && (
          <div className="space-y-3" data-testid="financial-goals-section">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider">
                  Target Milestones
                </h3>
                <Badge variant="neutral" size="sm">
                  {goals.length}
                </Badge>
              </div>
            </div>

            {isGoalsLoading ? (
              <div className="space-y-3">
                <MetricCardSkeleton />
                <MetricCardSkeleton />
              </div>
            ) : isGoalsError ? (
              <Card className="p-4 text-center space-y-2">
                <p className="text-xs text-semantic-danger font-medium">Failed to load goals.</p>
                <Button variant="outline" size="sm" onClick={() => refetchGoals()}>
                  Retry
                </Button>
              </Card>
            ) : goals.length === 0 ? (
              <EmptyState
                icon={<Target className="w-7 h-7 stroke-[1.8]" />}
                title="No goals yet"
                description="Set savings targets and dates to track milestones."
                actionLabel="Add Goal"
                actionIcon={<Plus className="w-4 h-4" />}
                onAction={openAddGoalModal}
              />
            ) : (
              <div className="space-y-3">
                {goals.map((goal) => {
                  const percent = goal.progress ?? goal.percentage ?? 0;
                  const isCompleted = percent >= 100;

                  const dateFormatted = goal.targetDate ? formatDate(goal.targetDate) : 'Target Date';

                  return (
                    <Card
                      key={goal.id}
                      padding="sm"
                      className="space-y-3 hover:border-blue-200 transition-colors"
                      data-testid={`goal-card-${goal.id}`}
                    >
                      {/* Goal Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isCompleted
                                ? 'bg-semantic-success-bg text-semantic-success'
                                : 'bg-semantic-investment-bg text-semantic-investment'
                            }`}
                          >
                            <Target className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-textDefault truncate">
                                {goal.name}
                              </h4>
                              {isCompleted && (
                                <Badge variant="success" size="sm">
                                  Achieved
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-textMuted mt-0.5">
                              <Calendar className="w-3 h-3" />
                              <span>Target: {dateFormatted}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditGoalModal(goal)}
                            aria-label={`Edit ${goal.name} goal`}
                            className="w-7 h-7 rounded-lg text-textMuted hover:text-brand-primary hover:bg-brand-primary-soft/50 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                          >
                            <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirm({
                                type: 'goal',
                                id: goal.id,
                                name: goal.name,
                              })
                            }
                            aria-label={`Delete ${goal.name} goal`}
                            className="w-7 h-7 rounded-lg text-textMuted hover:text-semantic-danger hover:bg-semantic-danger-bg/50 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-danger focus-visible:ring-offset-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      {/* Amounts Row */}
                      <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50 rounded-xl text-center">
                        <div>
                          <div className="text-[10px] font-medium text-textMuted uppercase">
                            Saved
                          </div>
                          <div className="text-xs font-bold text-semantic-investment mt-0.5 truncate">
                            {formatCurrency(goal.currentAmount, userCurrency)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-medium text-textMuted uppercase">
                            Target
                          </div>
                          <div className="text-xs font-bold text-textDefault mt-0.5 truncate">
                            {formatCurrency(goal.targetAmount, userCurrency)}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar & Percentage */}
                      <div className="space-y-1">
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-semantic-investment transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-semantic-investment">{`${percent}% achieved`}</span>
                          <span className="text-textMuted">
                            {isCompleted
                              ? 'Goal reached'
                              : `${formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount), userCurrency)} to go`}
                          </span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Separate Modal: Add Budget ("Add Budget" / "Save Budget") */}
      <Modal
        isOpen={isAddBudgetOpen}
        onClose={() => setIsAddBudgetOpen(false)}
        title="Add Budget"
        subtitle="Establish monthly limit for an expense category"
        icon={<PieChartIcon className="w-5 h-5 text-brand-primary" />}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddBudgetOpen(false)}
              disabled={createBudgetMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveBudget}
              disabled={createBudgetMutation.isPending}
            >
              {createBudgetMutation.isPending ? 'Saving...' : 'Save Budget'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          {budgetError && (
            <div className="p-2.5 rounded-xl bg-semantic-danger-bg text-semantic-danger text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{budgetError}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-textDefault">
                Expense Category <span className="text-semantic-danger">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>Add Category</span>
              </button>
            </div>
            <Select
              value={budgetCategoryId}
              onChange={(e) => setBudgetCategoryId(e.target.value)}
              options={categoryOptions}
              required
            />
          </div>

          <div>
            <Input
              label={`Monthly Limit Amount (${currencySymbol})`}
              type="number"
              step="1"
              min="1"
              placeholder="e.g. 15000"
              value={budgetTargetAmount}
              onChange={(e) => setBudgetTargetAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              label="Custom Name (Optional)"
              type="text"
              placeholder="e.g. Monthly Grocery Limit"
              value={budgetName}
              onChange={(e) => setBudgetName(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* 6. Separate Modal: Edit Budget ("Edit Budget" / "Update Budget") */}
      <Modal
        isOpen={isEditBudgetOpen}
        onClose={() => setIsEditBudgetOpen(false)}
        title="Edit Budget"
        subtitle="Update monthly spending limit for this category"
        icon={<Pencil className="w-5 h-5 text-brand-primary" />}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditBudgetOpen(false)}
              disabled={updateBudgetMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpdateBudget}
              disabled={updateBudgetMutation.isPending}
            >
              {updateBudgetMutation.isPending ? 'Updating...' : 'Update Budget'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateBudget} className="space-y-4">
          {budgetError && (
            <div className="p-2.5 rounded-xl bg-semantic-danger-bg text-semantic-danger text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{budgetError}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-textDefault">
                Expense Category <span className="text-semantic-danger">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>Add Category</span>
              </button>
            </div>
            <Select
              value={budgetCategoryId}
              onChange={(e) => setBudgetCategoryId(e.target.value)}
              options={categoryOptions}
              required
            />
          </div>

          <div>
            <Input
              label={`Monthly Limit Amount (${currencySymbol})`}
              type="number"
              step="1"
              min="1"
              placeholder="e.g. 15000"
              value={budgetTargetAmount}
              onChange={(e) => setBudgetTargetAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              label="Custom Name (Optional)"
              type="text"
              placeholder="e.g. Monthly Grocery Limit"
              value={budgetName}
              onChange={(e) => setBudgetName(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* 7. Separate Modal: Add Goal ("Add Goal" / "Save Goal") */}
      <Modal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        title="Add Goal"
        subtitle="Define a target financial milestone and scheduled date"
        icon={<Target className="w-5 h-5 text-brand-primary" />}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddGoalOpen(false)}
              disabled={createGoalMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveGoal}
              disabled={createGoalMutation.isPending}
            >
              {createGoalMutation.isPending ? 'Saving...' : 'Save Goal'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveGoal} className="space-y-4">
          {goalError && (
            <div className="p-2.5 rounded-xl bg-semantic-danger-bg text-semantic-danger text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{goalError}</span>
            </div>
          )}

          <div>
            <Input
              label="Goal Title"
              type="text"
              placeholder="e.g. Emergency Fund"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              label={`Target Amount (${currencySymbol})`}
              type="number"
              step="1"
              min="1"
              placeholder="e.g. 500000"
              value={goalTargetAmount}
              onChange={(e) => setGoalTargetAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              label={`Current Amount Saved (${currencySymbol})`}
              type="number"
              step="1"
              min="0"
              placeholder="e.g. 150000"
              value={goalCurrentAmount}
              onChange={(e) => setGoalCurrentAmount(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Target Date"
              type="date"
              value={goalTargetDate}
              onChange={(e) => setGoalTargetDate(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>

      {/* 8. Separate Modal: Edit Goal ("Edit Goal" / "Update Goal") */}
      <Modal
        isOpen={isEditGoalOpen}
        onClose={() => setIsEditGoalOpen(false)}
        title="Edit Goal"
        subtitle="Update milestone target amount, progress, and scheduled date"
        icon={<Pencil className="w-5 h-5 text-brand-primary" />}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditGoalOpen(false)}
              disabled={updateGoalMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpdateGoal}
              disabled={updateGoalMutation.isPending}
            >
              {updateGoalMutation.isPending ? 'Updating...' : 'Update Goal'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateGoal} className="space-y-4">
          {goalError && (
            <div className="p-2.5 rounded-xl bg-semantic-danger-bg text-semantic-danger text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{goalError}</span>
            </div>
          )}

          <div>
            <Input
              label="Goal Title"
              type="text"
              placeholder="e.g. Emergency Fund"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              label={`Target Amount (${currencySymbol})`}
              type="number"
              step="1"
              min="1"
              placeholder="e.g. 500000"
              value={goalTargetAmount}
              onChange={(e) => setGoalTargetAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              label={`Current Amount Saved (${currencySymbol})`}
              type="number"
              step="1"
              min="0"
              placeholder="e.g. 150000"
              value={goalCurrentAmount}
              onChange={(e) => setGoalCurrentAmount(e.target.value)}
            />
          </div>

          <div>
            <Input
              label="Target Date"
              type="date"
              value={goalTargetDate}
              onChange={(e) => setGoalTargetDate(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>

      {/* 9. Delete Confirmation Modal */}
      {(() => {
        const dialogDef = deleteConfirm?.type === 'budget'
          ? CONFIRM_DIALOGS.planning.deleteBudget(deleteConfirm?.name)
          : CONFIRM_DIALOGS.planning.deleteGoal(deleteConfirm?.name);
        return (
          <Modal
            isOpen={Boolean(deleteConfirm)}
            onClose={() => setDeleteConfirm(null)}
            compact
            title={dialogDef.title}
            icon={<Trash2 className="w-4 h-4 text-semantic-danger" />}
            footer={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleteBudgetMutation.isPending || deleteGoalMutation.isPending}
                >
                  {dialogDef.cancelLabel}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (deleteConfirm?.type === 'budget') {
                      deleteBudgetMutation.mutate(deleteConfirm.id);
                    } else if (deleteConfirm?.type === 'goal') {
                      deleteGoalMutation.mutate(deleteConfirm.id);
                    }
                  }}
                  disabled={deleteBudgetMutation.isPending || deleteGoalMutation.isPending}
                >
                  {deleteBudgetMutation.isPending || deleteGoalMutation.isPending
                    ? 'Deleting...'
                    : dialogDef.confirmLabel}
                </Button>
              </>
            }
          >
            <p className="text-xs text-textMuted leading-relaxed">
              {dialogDef.message}
            </p>
          </Modal>
        );
      })()}

      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        initialType="EXPENSE"
        onCategoryCreated={(newCat) => {
          if (newCat?.id) {
            setBudgetCategoryId(newCat.id);
          }
        }}
      />
    </div>
  );
};
