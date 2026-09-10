import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Tag,
  RefreshCw,
  FolderPlus,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { Pagination } from '../components/ui/Pagination.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { MetricCardSkeleton } from '../components/ui/Skeleton.js';
import { apiClient, getFriendlyErrorMessage } from '../services/apiClient.js';
import { toast } from '../store/toastStore.js';
import type { Category, TxnType } from '@finance/shared-types';

export const AdminCategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME' | 'INVESTMENT'>('ALL');

  // Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<TxnType>('EXPENSE');
  const [catSortOrder, setCatSortOrder] = useState<number>(0);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Query: System Categories
  const {
    data: systemCategories = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Category[]>({
    queryKey: ['admin-system-categories'],
    queryFn: async () => {
      const res = await apiClient.admin.getSystemCategories();
      const raw = (res as any)?.data || res;
      return Array.isArray(raw) ? raw : [];
    },
  });

  // Mutations
  const createCatMutation = useMutation({
    mutationFn: async (data: { name: string; type: string; sortOrder?: number }) => {
      return await apiClient.admin.createSystemCategory(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-system-categories'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['categories'], refetchType: 'active' });
      setIsCatModalOpen(false);
      resetCatForm();
      toast.success('Category created');
    },
    onError: (err: any) => {
      const msg = getFriendlyErrorMessage(err, 'Failed to create category');
      toast.error(msg);
    },
  });

  const updateCatMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{ name: string; type: string; sortOrder?: number }>;
    }) => {
      return await apiClient.admin.updateSystemCategory(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-system-categories'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['categories'], refetchType: 'active' });
      setIsCatModalOpen(false);
      resetCatForm();
      toast.success('Category updated');
    },
    onError: (err: any) => {
      const msg = getFriendlyErrorMessage(err, 'Failed to update category');
      toast.error(msg);
    },
  });

  const deleteCatMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.admin.deleteSystemCategory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-system-categories'], refetchType: 'active' });
      queryClient.invalidateQueries({ queryKey: ['categories'], refetchType: 'active' });
      setDeletingCategory(null);
      toast.success('Category deleted');
    },
    onError: (err: any) => {
      const msg = getFriendlyErrorMessage(err, 'Failed to delete category');
      toast.error(msg);
    },
  });

  const resetCatForm = () => {
    setEditingCategory(null);
    setCatName('');
    setCatType('EXPENSE');
    setCatSortOrder(0);
  };

  const handleOpenAddCat = () => {
    resetCatForm();
    if (typeFilter !== 'ALL') {
      setCatType(typeFilter as TxnType);
    }
    setCatSortOrder(systemCategories.length);
    setIsCatModalOpen(true);
  };

  const handleOpenEditCat = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatType(cat.type as TxnType);
    setCatSortOrder(cat.sortOrder ?? 0);
    setIsCatModalOpen(true);
  };

  const handleSaveCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error('Category name is required');
      return;
    }
    if (editingCategory) {
      updateCatMutation.mutate({
        id: editingCategory.id,
        data: { name: catName.trim(), type: catType, sortOrder: catSortOrder },
      });
    } else {
      createCatMutation.mutate({
        name: catName.trim(),
        type: catType,
        sortOrder: catSortOrder,
      });
    }
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const total = systemCategories.length;
    const expenses = systemCategories.filter((c) => c.type === 'EXPENSE').length;
    const income = systemCategories.filter((c) => c.type === 'INCOME').length;
    const investment = systemCategories.filter((c) => c.type === 'INVESTMENT').length;
    return { total, expenses, income, investment };
  }, [systemCategories]);

  // Filtered & Searched Categories
  const filteredCategories = useMemo(() => {
    return systemCategories.filter((cat) => {
      const matchesType = typeFilter === 'ALL' || cat.type === typeFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        cat.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [systemCategories, typeFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / PAGE_SIZE));
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCategories.slice(start, start + PAGE_SIZE);
  }, [filteredCategories, currentPage, PAGE_SIZE]);

  const handleTypeFilterChange = (filter: 'ALL' | 'EXPENSE' | 'INCOME' | 'INVESTMENT') => {
    setTypeFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  return (
    <div className="flex-1 flex flex-col pb-20">
      {/* AppHeader matching consumer Categories page */}
      <AppHeader
        variant="nested"
        title="System Categories"
        subtitle="Default platform taxonomy"
        backTo="/admin"
        rightAction={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddCat}
            icon={<Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
            className="whitespace-nowrap shrink-0"
          >
            Add Category
          </Button>
        }
      />

      <div className="p-4 space-y-4 max-w-4xl mx-auto w-full">
        {/* KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Total Categories */}
          <button
            type="button"
            onClick={() => handleTypeFilterChange('ALL')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-card ${
              typeFilter === 'ALL'
                ? 'bg-blue-50/40 border-brand-primary/60 ring-2 ring-brand-primary/20'
                : 'bg-white border-borderDefault/80 hover:border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">Total</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-black text-textDefault tracking-tight">{metrics.total}</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100/70 text-brand-primary">
                All Types
              </span>
            </div>
          </button>

          {/* Expense Categories */}
          <button
            type="button"
            onClick={() => handleTypeFilterChange('EXPENSE')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-card ${
              typeFilter === 'EXPENSE'
                ? 'bg-rose-50/40 border-rose-500/60 ring-2 ring-rose-500/20'
                : 'bg-white border-borderDefault/80 hover:border-rose-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">Expense</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-black text-textDefault tracking-tight">{metrics.expenses}</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100/70 text-rose-700">
                {metrics.total > 0 ? Math.round((metrics.expenses / metrics.total) * 100) : 0}%
              </span>
            </div>
          </button>

          {/* Income Categories */}
          <button
            type="button"
            onClick={() => handleTypeFilterChange('INCOME')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-card ${
              typeFilter === 'INCOME'
                ? 'bg-emerald-50/40 border-emerald-500/60 ring-2 ring-emerald-500/20'
                : 'bg-white border-borderDefault/80 hover:border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">Income</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-black text-textDefault tracking-tight">{metrics.income}</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100/70 text-emerald-700">
                {metrics.total > 0 ? Math.round((metrics.income / metrics.total) * 100) : 0}%
              </span>
            </div>
          </button>

          {/* Investment Categories */}
          <button
            type="button"
            onClick={() => handleTypeFilterChange('INVESTMENT')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-card ${
              typeFilter === 'INVESTMENT'
                ? 'bg-purple-50/40 border-purple-500/60 ring-2 ring-purple-500/20'
                : 'bg-white border-borderDefault/80 hover:border-purple-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-textMuted uppercase tracking-wider">Invest</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-black text-textDefault tracking-tight">{metrics.investment}</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100/70 text-purple-700">
                {metrics.total > 0 ? Math.round((metrics.investment / metrics.total) * 100) : 0}%
              </span>
            </div>
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="space-y-2.5">
          {/* Search Bar */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-textMuted absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search system categories..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-borderDefault rounded-xl text-xs text-textDefault placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="absolute right-2.5 text-textMuted hover:text-textDefault p-0.5"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pill Tabs */}
          <div
            role="tablist"
            aria-label="Category type filter"
            className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
          >
            {(
              [
                { id: 'ALL', label: 'All Types' },
                { id: 'EXPENSE', label: 'Expense' },
                { id: 'INCOME', label: 'Income' },
                { id: 'INVESTMENT', label: 'Investment' },
              ] as const
            ).map((tab) => {
              const isActive = typeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleTypeFilterChange(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 ${
                    isActive
                      ? 'bg-brand-primary text-white shadow-xs font-bold'
                      : 'bg-white text-textMuted border border-borderDefault hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* List & States */}
        {isLoading ? (
          <div className="space-y-2.5">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
        ) : isError ? (
          <Card className="p-6 text-center space-y-3">
            <p className="text-xs text-semantic-danger font-medium">Failed to load system categories.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              className="mx-auto whitespace-nowrap shrink-0"
            >
              Retry
            </Button>
          </Card>
        ) : filteredCategories.length === 0 ? (
          <EmptyState
            icon={<Tag className="w-7 h-7 stroke-[1.8]" />}
            title="No categories found"
            description={
              searchQuery
                ? `No categories match "${searchQuery}". Try adjusting your search or filter.`
                : 'Create platform-level default categories for all users.'
            }
            actionLabel="Add Category"
            actionIcon={<Plus className="w-4 h-4" />}
            onAction={handleOpenAddCat}
          />
        ) : (
          <div className="space-y-2">
            {paginatedCategories.map((cat) => {
              const isIncome = cat.type === 'INCOME';
              const isExpense = cat.type === 'EXPENSE';
              const isInvest = cat.type === 'INVESTMENT';

              const chipBg = isIncome
                ? 'bg-semantic-success-bg text-semantic-success'
                : isExpense
                ? 'bg-semantic-danger-bg text-semantic-danger'
                : 'bg-semantic-investment-bg text-semantic-investment';

              const badgeColor = isIncome
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isInvest
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-rose-50 text-rose-700 border-rose-200';

              return (
                <Card
                  key={cat.id}
                  padding="sm"
                  className="flex items-center justify-between gap-3 hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${chipBg}`}>
                      {isIncome && <ArrowDownLeft className="w-4 h-4" />}
                      {isExpense && <ArrowUpRight className="w-4 h-4" />}
                      {isInvest && <PiggyBank className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-textDefault truncate">
                          {cat.name}
                        </h4>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${badgeColor}`}
                        >
                          {cat.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-textMuted mt-0.5">
                        Sort order: {cat.sortOrder ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditCat(cat)}
                      aria-label={`Edit ${cat.name}`}
                      title="Edit Category"
                      className="w-7 h-7 rounded-lg text-textMuted hover:text-brand-primary hover:bg-brand-primary-soft/50 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCategory(cat)}
                      aria-label={`Delete ${cat.name}`}
                      title="Delete Category"
                      className="w-7 h-7 rounded-lg text-textMuted hover:text-semantic-danger hover:bg-semantic-danger-bg/50 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-danger"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </Card>
              );
            })}

            {/* Centralized Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCategories.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              itemLabel="categories"
            />
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={editingCategory ? 'Edit System Category' : 'Add System Category'}
        compact={true}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCatModalOpen(false)}
              className="whitespace-nowrap shrink-0"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={createCatMutation.isPending || updateCatMutation.isPending}
              onClick={handleSaveCat}
              className="whitespace-nowrap shrink-0"
            >
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveCat} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-textDefault">Category Name</label>
            <input
              type="text"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Groceries, Freelance, Stocks"
              className="w-full px-3 py-2 bg-slate-50 border border-borderDefault rounded-xl text-xs text-textDefault focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-textDefault">Type</label>
            <select
              value={catType}
              onChange={(e) => setCatType(e.target.value as TxnType)}
              className="w-full px-3 py-2 bg-slate-50 border border-borderDefault rounded-xl text-xs font-semibold text-textDefault focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            >
              <option value="EXPENSE">EXPENSE</option>
              <option value="INCOME">INCOME</option>
              <option value="INVESTMENT">INVESTMENT</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-textDefault">Sort Order</label>
            <input
              type="number"
              value={catSortOrder}
              onChange={(e) => setCatSortOrder(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 bg-slate-50 border border-borderDefault rounded-xl text-xs text-textDefault focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Category Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        title="Delete System Category"
        compact={true}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingCategory(null)}
              className="whitespace-nowrap shrink-0"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleteCatMutation.isPending}
              onClick={() => deletingCategory && deleteCatMutation.mutate(deletingCategory.id)}
              className="whitespace-nowrap shrink-0"
            >
              Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <p className="text-xs text-textDefault leading-relaxed">
            Are you sure you want to delete the default category{' '}
            <span className="font-bold text-rose-600">&quot;{deletingCategory?.name}&quot;</span>?
          </p>
          <p className="text-[11px] text-textMuted">
            Existing user transactions referencing this category will remain intact.
          </p>
        </div>
      </Modal>
    </div>
  );
};
export default AdminCategoriesPage;
