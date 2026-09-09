import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Tag,
  GripVertical,
  Lock,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Store,
  Receipt,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  CheckCircle2,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Modal } from '../components/ui/Modal.js';
import { Pagination } from '../components/ui/Pagination.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { SegmentedControl } from '../components/ui/SegmentedControl.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { MetricCardSkeleton } from '../components/ui/Skeleton.js';
import { apiClient } from '../services/apiClient.js';
import { formatCurrency } from '../utils/currency.js';
import { useUserCurrency } from '../hooks/useUserCurrency.js';
import { CONFIRM_DIALOGS } from '@finance/shared-ui-tokens';
import type { Category, Merchant, TxnType } from '@finance/shared-types';
import { toast } from '../store/toastStore.js';

export const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const { currency: userCurrency } = useUserCurrency();

  const isMerchantsRoute = location.pathname.startsWith('/merchants');

  // Primary view: Categories or Merchants (synced with route)
  const [mainView, setMainView] = useState<'categories' | 'merchants'>(
    isMerchantsRoute ? 'merchants' : 'categories'
  );

  useEffect(() => {
    if (location.pathname.startsWith('/merchants')) {
      setMainView('merchants');
    } else if (location.pathname.startsWith('/categories')) {
      setMainView('categories');
    }
  }, [location.pathname]);

  const handleMainViewChange = (val: 'categories' | 'merchants') => {
    setMainView(val);
    navigate(val === 'merchants' ? '/merchants' : '/categories', { replace: true });
  };

  // Categories filter pill tabs: All, Expense, Income, Investment
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'EXPENSE' | 'INCOME' | 'INVESTMENT'>('all');

  // Category Modals State
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState<TxnType>('EXPENSE');
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Merchant Modals State
  const [isAddMerchantOpen, setIsAddMerchantOpen] = useState(false);
  const [isEditMerchantOpen, setIsEditMerchantOpen] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [merchantName, setMerchantName] = useState('');
  const [merchantError, setMerchantError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteMerchantConfirm, setDeleteMerchantConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Queries
  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
    refetch: refetchCategories,
  } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.categories.list();
      return res || [];
    },
  });

  const {
    data: merchants = [],
    isLoading: isMerchantsLoading,
    isError: isMerchantsError,
    refetch: refetchMerchants,
  } = useQuery<Merchant[]>({
    queryKey: ['merchants'],
    queryFn: async () => {
      const res = await apiClient.merchants.list();
      return res || [];
    },
  });

  // Category Mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (payload: { name: string; type: TxnType }) => {
      return await apiClient.categories.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsAddCategoryOpen(false);
      resetCategoryForm();
      toast.success('Category created successfully');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to create category';
      setCategoryError(msg);
      toast.error(msg);
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { name: string; type: TxnType } }) => {
      return await apiClient.categories.update(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsEditCategoryOpen(false);
      resetCategoryForm();
      toast.success('Category updated successfully');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update category';
      setCategoryError(msg);
      toast.error(msg);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.categories.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteConfirm(null);
      toast.success('Category deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || err.message || 'Failed to delete category');
    },
  });

  const reorderCategoriesMutation = useMutation({
    mutationFn: async (categoryIds: string[]) => {
      return await apiClient.categories.reorder(categoryIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categories reordered');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || err.message || 'Failed to reorder categories');
    },
  });

  // Merchant Mutations
  const createMerchantMutation = useMutation({
    mutationFn: async (payload: { name: string }) => {
      return await apiClient.merchants.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
      setIsAddMerchantOpen(false);
      resetMerchantForm();
      toast.success('Merchant created successfully');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to create merchant';
      setMerchantError(msg);
      toast.error(msg);
    },
  });

  const updateMerchantMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { name: string } }) => {
      return await apiClient.merchants.update(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
      setIsEditMerchantOpen(false);
      resetMerchantForm();
      toast.success('Merchant updated successfully');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update merchant';
      setMerchantError(msg);
      toast.error(msg);
    },
  });

  const deleteMerchantMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.merchants.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
      setDeleteMerchantConfirm(null);
      toast.success('Merchant deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || err.message || 'Failed to delete merchant');
    },
  });

  // Form helpers - Category
  const resetCategoryForm = () => {
    setCategoryName('');
    setCategoryType('EXPENSE');
    setSelectedCategory(null);
    setCategoryError(null);
  };

  const openAddCategoryModal = () => {
    resetCategoryForm();
    if (categoryFilter !== 'all') {
      setCategoryType(categoryFilter);
    }
    setIsAddCategoryOpen(true);
  };

  const openEditCategoryModal = (cat: Category) => {
    if (cat.isSystem) return; // Protected!
    setSelectedCategory(cat);
    setCategoryName(cat.name);
    setCategoryType(cat.type);
    setCategoryError(null);
    setIsEditCategoryOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setCategoryError('Category name is required');
      return;
    }
    setCategoryError(null);
    createCategoryMutation.mutate({
      name: categoryName.trim(),
      type: categoryType,
    });
  };

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    if (!categoryName.trim()) {
      setCategoryError('Category name is required');
      return;
    }
    setCategoryError(null);
    updateCategoryMutation.mutate({
      id: selectedCategory.id,
      payload: {
        name: categoryName.trim(),
        type: categoryType,
      },
    });
  };

  // Reordering categories
  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    const targetList = [...filteredCategories];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= targetList.length) return;

    // Swap elements
    const temp = targetList[index];
    targetList[index] = targetList[newIndex];
    targetList[newIndex] = temp;

    // Extract updated IDs for reorder endpoint
    const categoryIds = targetList.map((c) => c.id);
    reorderCategoriesMutation.mutate(categoryIds);
  };

  // Form helpers - Merchant
  const resetMerchantForm = () => {
    setMerchantName('');
    setSelectedMerchant(null);
    setMerchantError(null);
  };

  const openAddMerchantModal = () => {
    resetMerchantForm();
    setIsAddMerchantOpen(true);
  };

  const openEditMerchantModal = (m: Merchant) => {
    setSelectedMerchant(m);
    setMerchantName(m.name);
    setMerchantError(null);
    setIsEditMerchantOpen(true);
  };

  const handleSaveMerchant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantName.trim()) {
      setMerchantError('Merchant name is required');
      return;
    }
    setMerchantError(null);
    createMerchantMutation.mutate({
      name: merchantName.trim(),
    });
  };

  const handleUpdateMerchant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMerchant) return;
    if (!merchantName.trim()) {
      setMerchantError('Merchant name is required');
      return;
    }
    setMerchantError(null);
    updateMerchantMutation.mutate({
      id: selectedMerchant.id,
      payload: {
        name: merchantName.trim(),
      },
    });
  };

  // Filter categories
  const filteredCategories = categories.filter((c) => {
    if (categoryFilter === 'all') return true;
    return c.type === categoryFilter;
  });

  // Category Pagination
  const [categoryPage, setCategoryPage] = useState<number>(1);
  const CATEGORIES_PER_PAGE = 12;

  useEffect(() => {
    setCategoryPage(1);
  }, [categoryFilter]);

  const totalCategoryPages = Math.max(1, Math.ceil(filteredCategories.length / CATEGORIES_PER_PAGE));

  useEffect(() => {
    if (categoryPage > totalCategoryPages) {
      setCategoryPage(totalCategoryPages);
    }
  }, [categoryPage, totalCategoryPages]);

  const paginatedCategories = filteredCategories.slice(
    (categoryPage - 1) * CATEGORIES_PER_PAGE,
    categoryPage * CATEGORIES_PER_PAGE
  );

  // Merchant Pagination
  const [merchantPage, setMerchantPage] = useState<number>(1);
  const MERCHANTS_PER_PAGE = 12;
  const filteredMerchants = merchants;

  const totalMerchantPages = Math.max(1, Math.ceil(filteredMerchants.length / MERCHANTS_PER_PAGE));

  useEffect(() => {
    if (merchantPage > totalMerchantPages) {
      setMerchantPage(totalMerchantPages);
    }
  }, [merchantPage, totalMerchantPages]);

  const paginatedMerchants = filteredMerchants.slice(
    (merchantPage - 1) * MERCHANTS_PER_PAGE,
    merchantPage * MERCHANTS_PER_PAGE
  );

  return (
    <div className="flex-1 flex flex-col">
      {/* 1. Branded Navy Header with title "Categories" */}
      <AppHeader
        variant="nested"
        title={mainView === 'categories' ? 'Categories' : 'Merchants'}
        subtitle={
          mainView === 'categories'
            ? 'Manage classification labels'
            : 'Vendor and merchant directory'
        }
        rightAction={
          mainView === 'categories' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={openAddCategoryModal}
              icon={<Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
            >
              Add Category
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={openAddMerchantModal}
              icon={<Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
            >
              Add Merchant
            </Button>
          )
        }
      />

      <div className="p-4 space-y-4">
        {/* View Switcher: Categories vs Merchants */}
        <SegmentedControl
          options={[
            {
              value: 'categories',
              label: 'Categories',
              icon: <Tag className="w-4 h-4" />,
            },
            {
              value: 'merchants',
              label: 'Merchants',
              icon: <Store className="w-4 h-4" />,
            },
          ]}
          value={mainView}
          onChange={(val) => handleMainViewChange(val as 'categories' | 'merchants')}
        />

        {/* Categories View */}
        {mainView === 'categories' && (
          <div className="space-y-4" data-testid="categories-container">
            {/* Filter Pill Tabs: All, Expense, Income, Investment */}
            <div role="tablist" aria-label="Category type filter" className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'EXPENSE', label: 'Expense' },
                  { id: 'INCOME', label: 'Income' },
                  { id: 'INVESTMENT', label: 'Investment' },
                ] as const
              ).map((tab) => {
                const isActive = categoryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setCategoryFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 ${
                      isActive
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'bg-white text-textMuted border border-borderDefault hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Category List */}
            {isCategoriesLoading ? (
              <div className="space-y-2.5">
                <MetricCardSkeleton />
                <MetricCardSkeleton />
              </div>
            ) : isCategoriesError ? (
              <Card className="p-4 text-center space-y-2">
                <p className="text-xs text-semantic-danger font-medium">Failed to load categories.</p>
                <Button variant="outline" size="sm" onClick={() => refetchCategories()}>
                  Retry
                </Button>
              </Card>
            ) : filteredCategories.length === 0 ? (
              <EmptyState
                icon={<Tag className="w-7 h-7 stroke-[1.8]" />}
                title="No categories found"
                description="Create custom categories to organize your financial records."
                actionLabel="Add Category"
                actionIcon={<Plus className="w-4 h-4" />}
                onAction={openAddCategoryModal}
              />
            ) : (
              <div className="space-y-2" data-testid="categories-list">
                {paginatedCategories.map((cat, pageIndex) => {
                  const index = (categoryPage - 1) * CATEGORIES_PER_PAGE + pageIndex;
                  const isIncome = cat.type === 'INCOME';
                  const isExpense = cat.type === 'EXPENSE';
                  const isInvest = cat.type === 'INVESTMENT';

                  const chipBg = isIncome
                    ? 'bg-semantic-success-bg text-semantic-success'
                    : isExpense
                    ? 'bg-semantic-danger-bg text-semantic-danger'
                    : 'bg-semantic-investment-bg text-semantic-investment';

                  return (
                    <Card
                      key={cat.id}
                      padding="sm"
                      className="flex items-center justify-between gap-2.5 hover:border-blue-200 transition-colors"
                      data-testid={`category-item-${cat.id}`}
                    >
                      {/* Left: Reorder affordance, icon chip, category name, type */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Reorder Affordance (Up/Down buttons + Grip handle) */}
                        <div className="flex flex-col items-center -space-y-1">
                          <button
                            type="button"
                            onClick={() => handleMoveCategory(index, 'up')}
                            disabled={index === 0 || reorderCategoriesMutation.isPending}
                            aria-label={`Move ${cat.name} up`}
                            className="p-0.5 text-textMuted hover:text-brand-primary disabled:opacity-30 disabled:pointer-events-none rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                          >
                            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <GripVertical className="w-3.5 h-3.5 text-slate-300 pointer-events-none" aria-hidden="true" />
                          <button
                            type="button"
                            onClick={() => handleMoveCategory(index, 'down')}
                            disabled={
                              index === filteredCategories.length - 1 ||
                              reorderCategoriesMutation.isPending
                            }
                            aria-label={`Move ${cat.name} down`}
                            className="p-0.5 text-textMuted hover:text-brand-primary disabled:opacity-30 disabled:pointer-events-none rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                          >
                            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>

                        {/* Icon Chip */}
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${chipBg}`}
                        >
                          {isIncome && <ArrowDownLeft className="w-4 h-4" />}
                          {isExpense && <ArrowUpRight className="w-4 h-4" />}
                          {isInvest && <PiggyBank className="w-4 h-4" />}
                        </div>

                        {/* Name & Type */}
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-textDefault truncate">
                            {cat.name}
                          </h4>
                          <span className="text-[10px] text-textMuted uppercase font-semibold">
                            {cat.type}
                          </span>
                        </div>
                      </div>

                      {/* Right: System Lock Badge or Custom Badge with Edit/Delete Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {cat.isSystem ? (
                          /* System category lock badge (cannot be edited or deleted) */
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-textMuted border border-gray-200"
                            data-testid={`system-badge-${cat.id}`}
                          >
                            <Lock className="w-3 h-3" aria-hidden="true" />
                            <span>System</span>
                          </span>
                        ) : (
                          /* Custom category badge and Edit & Delete action buttons */
                          <>
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-primary-soft text-brand-primary border border-blue-200"
                              data-testid={`custom-badge-${cat.id}`}
                            >
                              Custom
                            </span>
                            <button
                              type="button"
                              onClick={() => openEditCategoryModal(cat)}
                              aria-label={`Edit ${cat.name}`}
                              className="w-7 h-7 rounded-lg text-textMuted hover:text-brand-primary hover:bg-brand-primary-soft/50 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                            >
                              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteConfirm({
                                  id: cat.id,
                                  name: cat.name,
                                }
                              )}
                              aria-label={`Delete ${cat.name}`}
                              className="w-7 h-7 rounded-lg text-textMuted hover:text-semantic-danger hover:bg-semantic-danger-bg/50 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-danger focus-visible:ring-offset-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </>
                        )}
                      </div>
                    </Card>
                  );
                })}

                {/* Categories Pagination */}
                <Pagination
                  currentPage={categoryPage}
                  totalPages={totalCategoryPages}
                  totalItems={filteredCategories.length}
                  pageSize={CATEGORIES_PER_PAGE}
                  onPageChange={setCategoryPage}
                  itemLabel="categories"
                />
              </div>
            )}
          </div>
        )}

        {/* Merchants View */}
        {mainView === 'merchants' && (
          <div className="space-y-3" data-testid="merchants-container">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider">
                  Registered Merchants
                </h3>
                <Badge variant="neutral" size="sm">
                  {merchants.length}
                </Badge>
              </div>
            </div>

            {isMerchantsLoading ? (
              <div className="space-y-2.5">
                <MetricCardSkeleton />
                <MetricCardSkeleton />
              </div>
            ) : isMerchantsError ? (
              <Card className="p-4 text-center space-y-2">
                <p className="text-xs text-semantic-danger font-medium">Failed to load merchants.</p>
                <Button variant="outline" size="sm" onClick={() => refetchMerchants()}>
                  Retry
                </Button>
              </Card>
            ) : merchants.length === 0 ? (
              <EmptyState
                icon={<Store className="w-7 h-7 stroke-[1.8]" />}
                title="No merchants recorded"
                description="Merchants appear as you add transactions, or add one manually."
                actionLabel="Add Merchant"
                actionIcon={<Plus className="w-4 h-4" />}
                onAction={openAddMerchantModal}
              />
            ) : (
              <div className="space-y-2" data-testid="merchants-list">
                {paginatedMerchants.map((m) => (
                  <Card
                    key={m.id}
                    padding="sm"
                    className="flex items-center justify-between gap-3 hover:border-blue-200 transition-colors"
                    data-testid={`merchant-item-${m.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-brand-primary flex items-center justify-center shrink-0">
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-textDefault truncate">
                          {m.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-textMuted mt-0.5">
                          <span>
                            {m.transactionCount ?? 0}{' '}
                            {(m.transactionCount ?? 0) === 1 ? 'transaction' : 'transactions'}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-textDefault">
                            Total: {formatCurrency(m.totalSpent ?? 0, userCurrency)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditMerchantModal(m)}
                        aria-label={`Edit ${m.name}`}
                        className="w-7 h-7 rounded-lg text-textMuted hover:text-brand-primary hover:bg-brand-primary-soft/50 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                      >
                        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                      {(m.transactionCount ?? 0) === 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteMerchantConfirm({
                              id: m.id,
                              name: m.name,
                            })
                          }
                          aria-label={`Delete ${m.name}`}
                          className="w-7 h-7 rounded-lg text-textMuted hover:text-semantic-danger hover:bg-semantic-danger-bg/50 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-danger focus-visible:ring-offset-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </Card>
                ))}

                {/* Merchants Pagination */}
                <Pagination
                  currentPage={merchantPage}
                  totalPages={totalMerchantPages}
                  totalItems={filteredMerchants.length}
                  pageSize={MERCHANTS_PER_PAGE}
                  onPageChange={setMerchantPage}
                  itemLabel="merchants"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Separate Modal: Add Category ("Add Category" / "Save Category") */}
      <Modal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        title="Add Category"
        subtitle="Create a new classification category"
        icon={<Tag className="w-5 h-5 text-brand-primary" />}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddCategoryOpen(false)}
              disabled={createCategoryMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveCategory}
              disabled={createCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending ? 'Saving...' : 'Save Category'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          {categoryError && (
            <div className="p-2.5 rounded-xl bg-semantic-danger-bg text-semantic-danger text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{categoryError}</span>
            </div>
          )}

          <div>
            <Input
              label="Category Name"
              type="text"
              placeholder="e.g. Freelance Consulting"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
          </div>

          <div>
            <Select
              label="Transaction Type"
              value={categoryType}
              onChange={(e) => setCategoryType(e.target.value as TxnType)}
              options={[
                { value: 'EXPENSE', label: 'Expense' },
                { value: 'INCOME', label: 'Income' },
                { value: 'INVESTMENT', label: 'Investment' },
              ]}
              required
            />
          </div>
        </form>
      </Modal>

      {/* 3. Separate Modal: Edit Category ("Edit Category" / "Update Category") */}
      <Modal
        isOpen={isEditCategoryOpen}
        onClose={() => setIsEditCategoryOpen(false)}
        title="Edit Category"
        subtitle="Update custom category classification"
        icon={<Pencil className="w-5 h-5 text-brand-primary" />}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditCategoryOpen(false)}
              disabled={updateCategoryMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpdateCategory}
              disabled={updateCategoryMutation.isPending}
            >
              {updateCategoryMutation.isPending ? 'Updating...' : 'Update Category'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateCategory} className="space-y-4">
          {categoryError && (
            <div className="p-2.5 rounded-xl bg-semantic-danger-bg text-semantic-danger text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{categoryError}</span>
            </div>
          )}

          <div>
            <Input
              label="Category Name"
              type="text"
              placeholder="e.g. Freelance Consulting"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
          </div>

          <div>
            <Select
              label="Transaction Type"
              value={categoryType}
              onChange={(e) => setCategoryType(e.target.value as TxnType)}
              options={[
                { value: 'EXPENSE', label: 'Expense' },
                { value: 'INCOME', label: 'Income' },
                { value: 'INVESTMENT', label: 'Investment' },
              ]}
              required
            />
          </div>
        </form>
      </Modal>

      {/* 4. Delete Category Confirmation Modal */}
      {(() => {
        const dialogDef = CONFIRM_DIALOGS.categories.delete(deleteConfirm?.name);
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
                  disabled={deleteCategoryMutation.isPending}
                >
                  {dialogDef.cancelLabel}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (deleteConfirm) {
                      deleteCategoryMutation.mutate(deleteConfirm.id);
                    }
                  }}
                  disabled={deleteCategoryMutation.isPending}
                >
                  {deleteCategoryMutation.isPending ? 'Deleting...' : dialogDef.confirmLabel}
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

      {/* 4b. Delete Merchant Confirmation Modal */}
      {(() => {
        const dialogDef = CONFIRM_DIALOGS.merchants.delete(deleteMerchantConfirm?.name);
        return (
          <Modal
            isOpen={Boolean(deleteMerchantConfirm)}
            onClose={() => setDeleteMerchantConfirm(null)}
            compact
            title={dialogDef.title}
            icon={<Trash2 className="w-4 h-4 text-semantic-danger" />}
            footer={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteMerchantConfirm(null)}
                  disabled={deleteMerchantMutation.isPending}
                >
                  {dialogDef.cancelLabel}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (deleteMerchantConfirm) {
                      deleteMerchantMutation.mutate(deleteMerchantConfirm.id);
                    }
                  }}
                  disabled={deleteMerchantMutation.isPending}
                >
                  {deleteMerchantMutation.isPending ? 'Deleting...' : dialogDef.confirmLabel}
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

      {/* 5. Separate Modal: Add Merchant ("Add Merchant" / "Save Merchant") */}
      <Modal
        isOpen={isAddMerchantOpen}
        onClose={() => setIsAddMerchantOpen(false)}
        title="Add Merchant"
        subtitle="Register a new vendor or payee"
        icon={<Store className="w-5 h-5 text-brand-primary" />}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddMerchantOpen(false)}
              disabled={createMerchantMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveMerchant}
              disabled={createMerchantMutation.isPending}
            >
              {createMerchantMutation.isPending ? 'Saving...' : 'Save Merchant'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveMerchant} className="space-y-4">
          {merchantError && (
            <div className="p-2.5 rounded-xl bg-semantic-danger-bg text-semantic-danger text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{merchantError}</span>
            </div>
          )}

          <div>
            <Input
              label="Merchant / Vendor Name"
              type="text"
              placeholder="e.g. Reliance Fresh"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>

      {/* 6. Separate Modal: Edit Merchant ("Edit Merchant" / "Update Merchant") */}
      <Modal
        isOpen={isEditMerchantOpen}
        onClose={() => setIsEditMerchantOpen(false)}
        title="Edit Merchant"
        subtitle="Update vendor or payee details"
        icon={<Pencil className="w-5 h-5 text-brand-primary" />}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMerchantOpen(false)}
              disabled={updateMerchantMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpdateMerchant}
              disabled={updateMerchantMutation.isPending}
            >
              {updateMerchantMutation.isPending ? 'Updating...' : 'Update Merchant'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateMerchant} className="space-y-4">
          {merchantError && (
            <div className="p-2.5 rounded-xl bg-semantic-danger-bg text-semantic-danger text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{merchantError}</span>
            </div>
          )}

          <div>
            <Input
              label="Merchant / Vendor Name"
              type="text"
              placeholder="e.g. Reliance Fresh"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
