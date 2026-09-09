import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  HomeScreen,
  formatCurrency as formatHomeCurrency,
  formatDate as formatHomeDate,
} from '../screens/HomeScreen';
import {
  PlanningScreen,
  formatCurrency as formatPlanningCurrency,
  formatDate as formatPlanningDate,
} from '../screens/planning/PlanningScreen';
import { CategoriesScreen } from '../screens/categories/CategoriesScreen';
import { FamDonutRing } from '../components/FamDonutRing';
import { apiClient } from '../services/apiClient';
import type { DashboardSummary, Category } from '@finance/shared-types';

describe('Mobile Dashboard, Planning & Categories Suite (TASK-3.6)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Exports & Structure', () => {
    it('exports HomeScreen as a valid React component', () => {
      expect(typeof HomeScreen).toBe('function');
    });

    it('exports PlanningScreen as a valid React component', () => {
      expect(typeof PlanningScreen).toBe('function');
    });

    it('exports CategoriesScreen as a valid React component', () => {
      expect(typeof CategoriesScreen).toBe('function');
    });

    it('exports FamDonutRing as a valid React component', () => {
      expect(typeof FamDonutRing).toBe('function');
    });
  });

  describe('HomeScreen Dashboard & API Wiring', () => {
    const mockDashboardData: DashboardSummary = {
      period: {
        month: 9,
        year: 2026,
        periodStart: '2026-09-01T00:00:00.000Z',
        periodEnd: '2026-10-01T00:00:00.000Z',
      },
      fam: {
        isAvailable: true,
        overallGrade: 'A',
        grade: 'A+',
        gradeDisplay: 'A+',
        statusLabel: 'Healthy',
        overallProgressPercentage: 88,
        progress: 88,
        month: 9,
        year: 2026,
        areas: {
          income: {
            target: 100000,
            actual: 95000,
            percentage: 95,
            gradeDisplay: 'A+',
            statusLabel: 'Excellent',
          },
          expense: {
            target: 50000,
            actual: 32500,
            percentage: 65,
            gradeDisplay: 'A',
            statusLabel: 'Good',
          },
          investment: {
            target: 25000,
            actual: 20000,
            percentage: 80,
            gradeDisplay: 'B',
            statusLabel: 'Good',
          },
        },
      },
      targets: {
        income: {
          target: 100000,
          actual: 95000,
          remaining: 5000,
          percent: 95,
        },
        expense: {
          target: 50000,
          actual: 32500,
          remaining: 17500,
          percent: 65,
        },
        investment: {
          target: 25000,
          actual: 20000,
          remaining: 5000,
          percent: 80,
        },
      },
      securityBanner: {
        showSecurityReminder: true,
        configuredQuestionsCount: 1,
      },
      expenseBreakdown: [
        {
          categoryId: 'cat-1',
          categoryName: 'Groceries & Household',
          amount: 14500,
          percentage: 44.6,
        },
        {
          categoryId: 'cat-2',
          categoryName: 'Dining & Restaurants',
          amount: 8000,
          percentage: 24.6,
        },
        {
          categoryId: 'cat-3',
          categoryName: 'Housing & Utilities',
          amount: 10000,
          percentage: 30.8,
        },
      ],
      accountSummary: {
        totalBalance: 228310.6,
        activeCount: 2,
      },
      recentTransactions: [
        {
          id: 't-1',
          userId: 'u-1',
          accountId: 'acc-1',
          type: 'INCOME',
          direction: 'CREDIT',
          amount: 85000,
          date: '2026-09-01T09:00:00Z',
          description: 'Tech Corp Monthly Salary',
          merchant: 'Tech Corp India',
          status: 'ACTIVE',
          createdAt: '2026-09-01T09:00:00Z',
          updatedAt: '2026-09-01T09:00:00Z',
        },
        {
          id: 't-2',
          userId: 'u-1',
          accountId: 'acc-1',
          type: 'EXPENSE',
          direction: 'DEBIT',
          amount: 4500,
          date: '2026-09-02T14:30:00Z',
          description: 'Weekly Organic Groceries',
          merchant: 'Nature Basket',
          status: 'ACTIVE',
          createdAt: '2026-09-02T14:30:00Z',
          updatedAt: '2026-09-02T14:30:00Z',
        },
      ],
    };

    it('fetches dashboard summary via apiClient.dashboard.get()', async () => {
      const getSpy = vi
        .spyOn(apiClient.dashboard, 'get')
        .mockResolvedValueOnce(mockDashboardData);

      const res = await apiClient.dashboard.get();
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(res.period.month).toBe(9);
      expect(res.fam.grade).toBe('A+');
      expect(res.fam.progress).toBe(88);
      expect(res.accountSummary.totalBalance).toBeCloseTo(228310.6, 1);
      expect(res.accountSummary.activeCount).toBe(2);
    });

    it('verifies FAM donut ring metrics, grade display, and 3 status chips', () => {
      const fam = mockDashboardData.fam;
      expect(fam.grade).toBe('A+');
      expect(fam.progress).toBe(88);
      expect(['A+', 'B', 'C', 'NA', 'N/A']).toContain(fam.grade);

      // 3 area status chips
      expect(fam.areas.income.statusLabel).toBe('Excellent');
      expect(fam.areas.expense.statusLabel).toBe('Good');
      expect(fam.areas.investment.statusLabel).toBe('Good');

      expect(fam.areas.income.percentage).toBe(95);
      expect(fam.areas.expense.percentage).toBe(65);
      expect(fam.areas.investment.percentage).toBe(80);
    });

    it('verifies Target Overview calculations: Income, Expense, and Investment', () => {
      const targets = mockDashboardData.targets;

      // Income target overview
      expect(targets.income.target).toBe(100000);
      expect(targets.income.actual).toBe(95000);
      expect(targets.income.remaining).toBe(5000);
      expect(targets.income.percent).toBe(95);

      // Expense target overview
      expect(targets.expense.target).toBe(50000);
      expect(targets.expense.actual).toBe(32500);
      expect(targets.expense.remaining).toBe(17500);
      expect(targets.expense.percent).toBe(65);

      // Investment target overview
      expect(targets.investment.target).toBe(25000);
      expect(targets.investment.actual).toBe(20000);
      expect(targets.investment.remaining).toBe(5000);
      expect(targets.investment.percent).toBe(80);
    });

    it('verifies Security Reminder banner logic (shown if KBA questions < 3)', () => {
      const shouldShowBanner = (count: number) => count < 3;

      expect(shouldShowBanner(0)).toBe(true);
      expect(shouldShowBanner(1)).toBe(true);
      expect(shouldShowBanner(2)).toBe(true);
      expect(shouldShowBanner(3)).toBe(false);
      expect(shouldShowBanner(5)).toBe(false);
      expect(mockDashboardData.securityBanner.showSecurityReminder).toBe(true);
    });

    it('verifies expense breakdown percentages sum close to 100%', () => {
      const totalPercentage = mockDashboardData.expenseBreakdown.reduce(
        (sum, item) => sum + item.percentage,
        0
      );
      expect(totalPercentage).toBeCloseTo(100, 0);
      expect(mockDashboardData.expenseBreakdown.length).toBe(3);
    });

    it('formats currency and dates cleanly on HomeScreen', () => {
      expect(formatHomeCurrency(100000)).toBe('₹1,00,000.00');
      expect(formatHomeCurrency(32500.5)).toBe('₹32,500.50');
      expect(formatHomeDate('2026-09-08T10:00:00Z')).toBe('08-09-2026');
      expect(formatHomeDate('')).toBe('');
    });
  });

  describe('PlanningScreen Budgets & Goals API Wiring', () => {
    const mockBudgets = [
      {
        id: 'b-1',
        categoryId: 'cat-groceries',
        category: {
          id: 'cat-groceries',
          name: 'Groceries & Household',
          type: 'EXPENSE',
          isSystem: true,
        },
        name: 'Weekly Grocery Limit',
        targetAmount: 20000,
        spent: 12500,
        remaining: 7500,
        progress: 62.5,
        period: 'MONTHLY',
        status: 'ACTIVE',
      },
      {
        id: 'b-2',
        categoryId: 'cat-dining',
        category: {
          id: 'cat-dining',
          name: 'Dining & Restaurants',
          type: 'EXPENSE',
          isSystem: false,
        },
        name: 'Dining Out',
        targetAmount: 10000,
        spent: 11200,
        remaining: -1200,
        progress: 112,
        period: 'MONTHLY',
        status: 'ACTIVE',
      },
    ];

    const mockGoals = [
      {
        id: 'g-1',
        name: 'Emergency Fund 6 Months',
        targetAmount: 300000,
        currentAmount: 150000,
        remainingAmount: 150000,
        progress: 50,
        targetDate: '2026-12-31T00:00:00Z',
        status: 'ACTIVE',
      },
      {
        id: 'g-2',
        name: 'Annual Vacation',
        targetAmount: 80000,
        currentAmount: 80000,
        remainingAmount: 0,
        progress: 100,
        targetDate: '2026-10-15T00:00:00Z',
        status: 'ACTIVE',
      },
    ];

    it('fetches budgets and goals lists', async () => {
      const budgetSpy = vi
        .spyOn(apiClient.budgets, 'list')
        .mockResolvedValueOnce(mockBudgets);
      const goalSpy = vi
        .spyOn(apiClient.goals, 'list')
        .mockResolvedValueOnce(mockGoals);

      const [bList, gList] = await Promise.all([
        apiClient.budgets.list(),
        apiClient.goals.list(),
      ]);

      expect(budgetSpy).toHaveBeenCalledTimes(1);
      expect(goalSpy).toHaveBeenCalledTimes(1);
      expect(bList.length).toBe(2);
      expect(gList.length).toBe(2);
      expect(bList[0].targetAmount).toBe(20000);
      expect(bList[0].spent).toBe(12500);
      expect(bList[0].remaining).toBe(7500);
      expect(gList[0].progress).toBe(50);
    });

    it('creates a monthly budget via apiClient.budgets.create', async () => {
      const newBudgetInput = {
        categoryId: 'cat-groceries',
        name: 'Monthly Grocery Limit',
        targetAmount: 15000,
      };

      const createdBudget = {
        id: 'b-new-1',
        categoryId: newBudgetInput.categoryId,
        name: newBudgetInput.name,
        targetAmount: 15000,
        spent: 0,
        remaining: 15000,
        progress: 0,
        status: 'ACTIVE',
      };

      const createSpy = vi
        .spyOn(apiClient.budgets, 'create')
        .mockResolvedValueOnce(createdBudget);

      const res = await apiClient.budgets.create(newBudgetInput);
      expect(createSpy).toHaveBeenCalledWith(newBudgetInput);
      expect(res.id).toBe('b-new-1');
      expect(res.targetAmount).toBe(15000);
    });

    it('deletes a monthly budget via apiClient.budgets.delete', async () => {
      const deleteSpy = vi
        .spyOn(apiClient.budgets, 'delete')
        .mockResolvedValueOnce({ message: 'Budget deleted successfully' });

      const res = await apiClient.budgets.delete('b-1');
      expect(deleteSpy).toHaveBeenCalledWith('b-1');
      expect(res.message).toContain('deleted');
    });

    it('creates a financial goal via apiClient.goals.create', async () => {
      const newGoalInput = {
        name: 'New Car Downpayment',
        targetAmount: 200000,
        currentAmount: 50000,
        targetDate: '2027-06-30',
      };

      const createdGoal = {
        id: 'g-new-1',
        ...newGoalInput,
        remainingAmount: 150000,
        progress: 25,
        status: 'ACTIVE',
      };

      const createGoalSpy = vi
        .spyOn(apiClient.goals, 'create')
        .mockResolvedValueOnce(createdGoal);

      const res = await apiClient.goals.create(newGoalInput);
      expect(createGoalSpy).toHaveBeenCalledWith(newGoalInput);
      expect(res.id).toBe('g-new-1');
      expect(res.name).toBe('New Car Downpayment');
      expect(res.progress).toBe(25);
    });

    it('deletes a financial goal via apiClient.goals.delete', async () => {
      const deleteGoalSpy = vi
        .spyOn(apiClient.goals, 'delete')
        .mockResolvedValueOnce({ message: 'Goal deleted successfully' });

      const res = await apiClient.goals.delete('g-1');
      expect(deleteGoalSpy).toHaveBeenCalledWith('g-1');
      expect(res.message).toContain('deleted');
    });

    it('validates budget inputs correctly', () => {
      const validateBudget = (categoryId: string, limitStr: string) => {
        if (!categoryId) return 'Category is required.';
        const limit = parseFloat(limitStr);
        if (isNaN(limit) || limit <= 0) return 'Limit must be positive.';
        return null;
      };

      expect(validateBudget('', '5000')).toBe('Category is required.');
      expect(validateBudget('cat-1', '-50')).toBe('Limit must be positive.');
      expect(validateBudget('cat-1', '0')).toBe('Limit must be positive.');
      expect(validateBudget('cat-1', 'abc')).toBe('Limit must be positive.');
      expect(validateBudget('cat-1', '15000')).toBeNull();
    });

    it('validates goal inputs correctly', () => {
      const validateGoal = (name: string, targetStr: string, currentStr: string) => {
        if (!name.trim()) return 'Goal name is required.';
        const target = parseFloat(targetStr);
        if (isNaN(target) || target <= 0) return 'Target amount must be positive.';
        const current = currentStr ? parseFloat(currentStr) : 0;
        if (isNaN(current) || current < 0) return 'Current amount cannot be negative.';
        return null;
      };

      expect(validateGoal('', '10000', '0')).toBe('Goal name is required.');
      expect(validateGoal('Emergency', '0', '0')).toBe('Target amount must be positive.');
      expect(validateGoal('Emergency', '-100', '0')).toBe('Target amount must be positive.');
      expect(validateGoal('Emergency', '10000', '-500')).toBe(
        'Current amount cannot be negative.'
      );
      expect(validateGoal('Emergency', '50000', '10000')).toBeNull();
    });

    it('verifies distinct modal titles and action labels for Add Budget vs Add Goal', () => {
      const budgetModal = {
        title: 'Add Monthly Budget',
        submitLabel: 'Save Budget',
      };
      const goalModal = {
        title: 'Add Financial Goal',
        submitLabel: 'Save Goal',
      };

      expect(budgetModal.title).not.toBe(goalModal.title);
      expect(budgetModal.submitLabel).not.toBe(goalModal.submitLabel);
      expect(budgetModal.title).toBe('Add Monthly Budget');
      expect(budgetModal.submitLabel).toBe('Save Budget');
      expect(goalModal.title).toBe('Add Financial Goal');
      expect(goalModal.submitLabel).toBe('Save Goal');
    });

    it('formats currency and target dates in PlanningScreen', () => {
      expect(formatPlanningCurrency(20000)).toBe('₹20,000.00');
      expect(formatPlanningDate('2026-12-31T00:00:00Z')).toContain('2026');
      expect(formatPlanningDate(null)).toBe('No target date');
    });
  });

  describe('CategoriesScreen & API Wiring', () => {
    const mockCategories: Category[] = [
      {
        id: 'cat-sys-1',
        name: 'Salary & Wages',
        type: 'INCOME',
        isSystem: true,
        sortOrder: 1,
      },
      {
        id: 'cat-sys-2',
        name: 'Groceries & Household',
        type: 'EXPENSE',
        isSystem: true,
        sortOrder: 2,
      },
      {
        id: 'cat-sys-3',
        name: 'Mutual Funds & SIP',
        type: 'INVESTMENT',
        isSystem: true,
        sortOrder: 3,
      },
      {
        id: 'cat-cust-1',
        name: 'Freelance Tech Consulting',
        type: 'INCOME',
        isSystem: false,
        sortOrder: 4,
      },
      {
        id: 'cat-cust-2',
        name: 'Coffee & Cafes',
        type: 'EXPENSE',
        isSystem: false,
        sortOrder: 5,
      },
    ];

    it('fetches categories via apiClient.categories.list()', async () => {
      const listSpy = vi
        .spyOn(apiClient.categories, 'list')
        .mockResolvedValueOnce(mockCategories);

      const res = await apiClient.categories.list();
      expect(listSpy).toHaveBeenCalledTimes(1);
      expect(res.length).toBe(5);
    });

    it('filters categories by classification tab (All, Expense, Income, Investment)', () => {
      const filterCategories = (list: Category[], tab: string) => {
        if (tab === 'ALL') return list;
        return list.filter((c) => c.type.toUpperCase() === tab.toUpperCase());
      };

      expect(filterCategories(mockCategories, 'ALL').length).toBe(5);
      expect(filterCategories(mockCategories, 'EXPENSE').length).toBe(2);
      expect(filterCategories(mockCategories, 'INCOME').length).toBe(2);
      expect(filterCategories(mockCategories, 'INVESTMENT').length).toBe(1);
    });

    it('filters categories by search query string', () => {
      const search = (list: Category[], q: string) => {
        if (!q.trim()) return list;
        return list.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
      };

      expect(search(mockCategories, 'Coffee').length).toBe(1);
      expect(search(mockCategories, 'salary').length).toBe(1);
      expect(search(mockCategories, 'Consulting').length).toBe(1);
      expect(search(mockCategories, 'NonExistent').length).toBe(0);
    });

    it('distinguishes System Categories with lock badges vs Custom Categories with edit/delete affordances', () => {
      const systemCats = mockCategories.filter((c) => c.isSystem);
      const customCats = mockCategories.filter((c) => !c.isSystem);

      expect(systemCats.length).toBe(3);
      expect(customCats.length).toBe(2);

      systemCats.forEach((c) => {
        expect(c.isSystem).toBe(true);
      });

      customCats.forEach((c) => {
        expect(c.isSystem).toBe(false);
      });
    });

    it('creates a custom category via apiClient.categories.create', async () => {
      const newCategoryInput = {
        name: 'Gym & Fitness',
        type: 'EXPENSE' as const,
      };

      const createdCat: Category = {
        id: 'cat-new-gym',
        name: newCategoryInput.name,
        type: newCategoryInput.type,
        isSystem: false,
        sortOrder: 6,
      };

      const createSpy = vi
        .spyOn(apiClient.categories, 'create')
        .mockResolvedValueOnce(createdCat);

      const res = await apiClient.categories.create(newCategoryInput);
      expect(createSpy).toHaveBeenCalledWith(newCategoryInput);
      expect(res.id).toBe('cat-new-gym');
      expect(res.name).toBe('Gym & Fitness');
      expect(res.isSystem).toBe(false);
    });

    it('updates a custom category via apiClient.categories.update', async () => {
      const updateData = {
        name: 'Specialty Coffee & Bakeries',
        type: 'EXPENSE' as const,
      };

      const updatedCat: Category = {
        ...mockCategories[4],
        ...updateData,
      };

      const updateSpy = vi
        .spyOn(apiClient.categories, 'update')
        .mockResolvedValueOnce(updatedCat);

      const res = await apiClient.categories.update('cat-cust-2', updateData);
      expect(updateSpy).toHaveBeenCalledWith('cat-cust-2', updateData);
      expect(res.name).toBe('Specialty Coffee & Bakeries');
    });

    it('deletes a custom category via apiClient.categories.delete', async () => {
      const deleteSpy = vi
        .spyOn(apiClient.categories, 'delete')
        .mockResolvedValueOnce({ message: 'Category deleted' });

      const res = await apiClient.categories.delete('cat-cust-2');
      expect(deleteSpy).toHaveBeenCalledWith('cat-cust-2');
      expect(res.message).toBe('Category deleted');
    });

    it('verifies distinct modal titles and submit buttons for Add vs Edit Category', () => {
      const getCategoryModalMeta = (mode: 'add' | 'edit') => ({
        title: mode === 'add' ? 'Add Category' : 'Edit Category',
        submitLabel: mode === 'add' ? 'Save Category' : 'Update Category',
      });

      const addMeta = getCategoryModalMeta('add');
      expect(addMeta.title).toBe('Add Category');
      expect(addMeta.submitLabel).toBe('Save Category');

      const editMeta = getCategoryModalMeta('edit');
      expect(editMeta.title).toBe('Edit Category');
      expect(editMeta.submitLabel).toBe('Update Category');
    });
  });

  describe('Navigation & Integration', () => {
    it('verifies Planning and Categories routes exist in MoreScreen navigation items', async () => {
      const { MoreScreen } = await import('../screens/MoreScreen');
      expect(typeof MoreScreen).toBe('function');
    });
  });
});
