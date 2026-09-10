import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Plus,
  Repeat,
  Calendar,
  Play,
  Pause,
  Trash2,
  Edit2,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Modal } from '../components/ui/Modal.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { formatCurrency, getCurrencySymbol } from '../utils/currency.js';
import { formatDate } from '../utils/date.js';
import { apiClient } from '../services/apiClient.js';
import { useSafeQueryClient } from '../hooks/useSafeQueryClient.js';
import { CONFIRM_DIALOGS } from '@finance/shared-ui-tokens';
import { syncOnTransactionMutation } from '../services/dataSync.js';
import { AddAccountModal } from '../components/finance/AddAccountModal.js';
import { AddCategoryModal } from '../components/finance/AddCategoryModal.js';
import type { RecurringTransaction, Category, Account } from '@finance/shared-types';

export const RecurringTransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useSafeQueryClient();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [materializeResult, setMaterializeResult] = useState<string | null>(null);

  // Separate Add vs Edit Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState<boolean>(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState<boolean>(false);

  // Form states for Add / Edit
  const [formType, setFormType] = useState<'EXPENSE' | 'INCOME' | 'INVESTMENT'>('EXPENSE');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formAccountId, setFormAccountId] = useState<string>('');
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formFrequency, setFormFrequency] = useState<string>('MONTHLY');
  const [formNextDate, setFormNextDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  // Fetch User Settings for Currency
  const { data: userSettings } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => apiClient.settings.get(),
  }, queryClient);
  const userCurrency = userSettings?.currency || 'INR';
  const currencySymbol = getCurrencySymbol(userCurrency);

  // Fetch Recurring Transactions
  const { data: recurringList, isLoading } = useQuery<RecurringTransaction[]>({
    queryKey: ['recurring-transactions'],
    queryFn: async () => {
      return await apiClient.recurring.list();
    },
  }, queryClient);

  // Fetch Accounts for modal
  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      return await apiClient.accounts.list();
    },
  }, queryClient);

  // Fetch Categories for modal
  const { data: categoriesData } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      return await apiClient.categories.list();
    },
  }, queryClient);

  const accounts = accountsData?.accounts || [];
  const categories = categoriesData || [];

  // Toggle Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'PAUSED' }) => {
      return await apiClient.recurring.toggleStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
    },
  }, queryClient);

  const [deleteTarget, setDeleteTarget] = useState<RecurringTransaction | null>(null);

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiClient.recurring.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      setDeleteTarget(null);
    },
  }, queryClient);

  // Materialize Mutation
  const materializeMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.recurring.materialize();
    },
    onSuccess: (data) => {
      syncOnTransactionMutation(queryClient);
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      setMaterializeResult(`Processed ${data.materializedCount} due transactions.`);
      setTimeout(() => setMaterializeResult(null), 4000);
    },
  }, queryClient);

  // Create Recurring Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await apiClient.recurring.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      setIsAddModalOpen(false);
      resetForm();
    },
  }, queryClient);

  // Update Recurring Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return await apiClient.recurring.update(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      setIsEditModalOpen(false);
      setEditingItem(null);
      resetForm();
    },
  }, queryClient);

  const resetForm = () => {
    setFormType('EXPENSE');
    setFormAmount('');
    setFormDescription('');
    setFormAccountId(accounts[0]?.id || '');
    setFormCategoryId('');
    setFormFrequency('MONTHLY');
    setFormNextDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  };

  const handleOpenAddModal = () => {
    resetForm();
    if (accounts.length > 0 && !formAccountId) {
      setFormAccountId(accounts[0].id);
    }
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item: RecurringTransaction) => {
    setEditingItem(item);
    setFormType(item.type as any);
    setFormAmount(String(item.amount));
    setFormDescription(item.description || '');
    setFormAccountId(item.accountId);
    setFormCategoryId(item.categoryId || '');
    setFormFrequency(item.scheduleFreq);
    setFormNextDate(item.nextOccurrence ? item.nextOccurrence.slice(0, 10) : '');
    setIsEditModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || !formAccountId) return;
    createMutation.mutate({
      type: formType,
      amount: parseFloat(formAmount),
      description: formDescription.trim() || undefined,
      accountId: formAccountId,
      categoryId: formCategoryId || undefined,
      scheduleFreq: formFrequency as any,
      nextOccurrence: new Date(formNextDate).toISOString(),
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !formAmount) return;
    updateMutation.mutate({
      id: editingItem.id,
      payload: {
        type: formType,
        amount: parseFloat(formAmount),
        description: formDescription.trim() || undefined,
        accountId: formAccountId || undefined,
        categoryId: formCategoryId || null,
        scheduleFreq: formFrequency as any,
        nextOccurrence: new Date(formNextDate).toISOString(),
      },
    });
  };

  // Filter items
  const items = recurringList || [];
  const filteredItems = items.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return item.status === 'ACTIVE';
    if (activeFilter === 'paused') return item.status === 'PAUSED';
    if (activeFilter === 'expense') return item.type === 'EXPENSE';
    if (activeFilter === 'income') return item.type === 'INCOME';
    if (activeFilter === 'investment') return item.type === 'INVESTMENT';
    return true;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'INCOME':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 stroke-[2.2]" />
          </div>
        );
      case 'EXPENSE':
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5 stroke-[2.2]" />
          </div>
        );
      case 'INVESTMENT':
        return (
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-semantic-investment flex items-center justify-center shrink-0">
            <PiggyBank className="w-5 h-5 stroke-[2.2]" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center shrink-0">
            <Repeat className="w-5 h-5 stroke-[2.2]" />
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-20">
      {/* Branded Dark Navy Header */}
      <AppHeader
        variant="nested"
        title="Recurring Transactions"
        subtitle="Automated Bills, SIPs, and Salaries"
        rightAction={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
            icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
          >
            Add Recurring
          </Button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Materialize Due Shortcut Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                Scheduled Automation
              </h4>
              <p className="text-[11px] text-slate-600">
                Process recurring transactions due today
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => materializeMutation.mutate()}
            disabled={materializeMutation.isPending}
            className="px-3 py-1.5 rounded-xl bg-brand-primary text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm active:scale-95 shrink-0"
          >
            {materializeMutation.isPending ? 'Processing...' : 'Process Due Now'}
          </button>
        </div>

        {materializeResult && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{materializeResult}</span>
          </div>
        )}

        {/* Filter Pills */}
        <div
          role="tablist"
          aria-label="Filter recurring transactions"
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
          className="flex items-center gap-1.5 overflow-x-auto pt-0.5 pb-2.5 text-xs scrollbar-tab-thin"
        >
          {[
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'paused', label: 'Paused' },
            { id: 'expense', label: 'Expense' },
            { id: 'income', label: 'Income' },
            { id: 'investment', label: 'Investment' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              role="tab"
              aria-selected={activeFilter === pill.id}
              onClick={() => setActiveFilter(pill.id)}
              className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1 ${
                activeFilter === pill.id
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-brand-primary/60'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Recurring Items List */}
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-28 bg-slate-100 animate-pulse rounded-2xl" />
            <div className="h-28 bg-slate-100 animate-pulse rounded-2xl" />
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const isActive = item.status === 'ACTIVE';
              return (
                <Card
                  key={item.id}
                  padding="sm"
                  className={`bg-white border transition-all p-3.5 rounded-2xl space-y-3 shadow-sm ${
                    isActive ? 'border-slate-200' : 'border-slate-200 bg-slate-50/60 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {getTransactionIcon(item.type)}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {item.description || `${item.type} payment`}
                          </h4>
                          <Badge variant={isActive ? 'success' : 'neutral'} size="sm">
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {item.account?.name || 'Account'} • {item.category?.name || 'Uncategorized'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-slate-900 block">
                        {formatCurrency(item.amount, userCurrency)}
                      </span>
                      <span className="text-[10px] font-semibold text-brand-primary bg-blue-50 px-1.5 py-0.5 rounded-md mt-0.5 inline-block">
                        {item.scheduleFreq}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Next due: {item.nextOccurrence ? formatDate(item.nextOccurrence) : 'Pending'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Toggle status switch */}
                      <button
                        type="button"
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            id: item.id,
                            status: isActive ? 'PAUSED' : 'ACTIVE',
                          })
                        }
                        title={isActive ? 'Pause recurring' : 'Activate recurring'}
                        className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                          isActive
                            ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                            : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{isActive ? 'Pause' : 'Activate'}</span>
                      </button>

                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-brand-primary hover:border-brand-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
                        aria-label={`Edit ${item.description || `${item.type} recurring payment`}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-semantic-danger focus-visible:ring-offset-1"
                        aria-label={`Delete ${item.description || `${item.type} recurring payment`}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Repeat className="w-7 h-7 stroke-[1.8]" />}
            title="No recurring payments"
            description="Schedule recurring bills, salaries, and subscriptions."
            actionLabel="Add Schedule"
            actionIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            onAction={handleOpenAddModal}
          />
        )}
      </div>

      {/* 1. Add Recurring Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Recurring Transaction"
        subtitle="Set up automated periodic payments or income"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4">
          {/* Type Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Transaction Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['EXPENSE', 'INCOME', 'INVESTMENT'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormType(t)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    formType === t
                      ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Description
            </label>
            <Input
              placeholder="e.g. Monthly House Rent, Netflix, Mutual Fund SIP"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              required
            />
          </div>

          {/* Amount in Rupees */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Amount ({currencySymbol})
            </label>
            <Input
              type="number"
              min="1"
              step="any"
              placeholder="e.g. 15000"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              required
            />
          </div>

          {/* Account */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Account <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsAddAccountOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>Add Account</span>
              </button>
            </div>
            {accounts.length === 0 ? (
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-3">
                <span>No accounts found.</span>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddAccountOpen(true)}
                  iconLeft={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Account
                </Button>
              </div>
            ) : (
              <Select
                options={accounts.map((a) => ({ value: a.id, label: `${a.name} (${a.type})` }))}
                value={formAccountId}
                onChange={(e) => setFormAccountId(e.target.value)}
                required
              />
            )}
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Category
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
              options={[
                { value: '', label: 'Select Category (Optional)' },
                ...categories
                  .filter((c) => c.type === formType)
                  .map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
            />
          </div>

          {/* Frequency & Next Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Frequency
              </label>
              <Select
                options={[
                  { value: 'MONTHLY', label: 'Monthly' },
                  { value: 'WEEKLY', label: 'Weekly' },
                  { value: 'BI_WEEKLY', label: 'Bi-Weekly' },
                  { value: 'DAILY', label: 'Daily' },
                  { value: 'QUARTERLY', label: 'Quarterly' },
                  { value: 'ANNUALLY', label: 'Annually' },
                ]}
                value={formFrequency}
                onChange={(e) => setFormFrequency(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Next Occurrence
              </label>
              <Input
                type="date"
                value={formNextDate}
                onChange={(e) => setFormNextDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Save Recurring'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Edit Recurring Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Recurring Transaction"
        subtitle="Modify recurrence schedule, amount, or classification"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {/* Type Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Transaction Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['EXPENSE', 'INCOME', 'INVESTMENT'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormType(t)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    formType === t
                      ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Description
            </label>
            <Input
              placeholder="e.g. Monthly House Rent, Netflix, Mutual Fund SIP"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              required
            />
          </div>

          {/* Amount in Rupees */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Amount ({currencySymbol})
            </label>
            <Input
              type="number"
              min="1"
              step="any"
              placeholder="e.g. 15000"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              required
            />
          </div>

          {/* Account */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Account <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsAddAccountOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>Add Account</span>
              </button>
            </div>
            {accounts.length === 0 ? (
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-3">
                <span>No accounts found.</span>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddAccountOpen(true)}
                  iconLeft={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Account
                </Button>
              </div>
            ) : (
              <Select
                options={accounts.map((a) => ({ value: a.id, label: `${a.name} (${a.type})` }))}
                value={formAccountId}
                onChange={(e) => setFormAccountId(e.target.value)}
                required
              />
            )}
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Category
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
              options={[
                { value: '', label: 'Select Category (Optional)' },
                ...categories
                  .filter((c) => c.type === formType)
                  .map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
            />
          </div>

          {/* Frequency & Next Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Frequency
              </label>
              <Select
                options={[
                  { value: 'MONTHLY', label: 'Monthly' },
                  { value: 'WEEKLY', label: 'Weekly' },
                  { value: 'BI_WEEKLY', label: 'Bi-Weekly' },
                  { value: 'DAILY', label: 'Daily' },
                  { value: 'QUARTERLY', label: 'Quarterly' },
                  { value: 'ANNUALLY', label: 'Annually' },
                ]}
                value={formFrequency}
                onChange={(e) => setFormFrequency(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Next Occurrence
              </label>
              <Input
                type="date"
                value={formNextDate}
                onChange={(e) => setFormNextDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Updating...' : 'Update Recurring'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {(() => {
        const dialogDef = CONFIRM_DIALOGS.recurring.delete(
          deleteTarget?.description || deleteTarget?.type
        );
        return (
          <Modal
            isOpen={Boolean(deleteTarget)}
            onClose={() => setDeleteTarget(null)}
            compact
            title={dialogDef.title}
            icon={<Trash2 className="w-4 h-4 text-semantic-danger" />}
            footer={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleteMutation.isPending}
                >
                  {dialogDef.cancelLabel}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={deleteMutation.isPending}
                  onClick={() => {
                    if (deleteTarget) {
                      deleteMutation.mutate(deleteTarget.id);
                    }
                  }}
                >
                  {dialogDef.confirmLabel}
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

      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onAccountCreated={(newAcc) => {
          if (newAcc?.id) {
            setFormAccountId(newAcc.id);
          }
        }}
      />

      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        initialType={formType}
        onCategoryCreated={(newCat) => {
          if (newCat?.id) {
            setFormCategoryId(newCat.id);
          }
        }}
      />
    </div>
  );
};
