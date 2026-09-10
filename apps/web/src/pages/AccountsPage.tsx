import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import {
  Plus,
  Landmark,
  CreditCard,
  TrendingUp,
  Wallet,
  Settings,
  ArrowLeftRight,
  BarChart3,
  Building2,
  AlertCircle,
  PiggyBank,
  CheckCircle2,
  CircleOff,
} from 'lucide-react';
import { AppHeader } from '../components/layout/AppHeader.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Input } from '../components/ui/Input.js';
import { Select } from '../components/ui/Select.js';
import { Modal } from '../components/ui/Modal.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { CardSkeleton } from '../components/ui/Skeleton.js';
import { formatCurrency } from '../utils/currency.js';
import { syncOnAccountMutation } from '../services/dataSync.js';
import { apiClient, getFriendlyErrorMessage } from '../services/apiClient.js';
import { useSafeQueryClient } from '../hooks/useSafeQueryClient.js';
import { CONFIRM_DIALOGS } from '@finance/shared-ui-tokens';
import { AddAccountModal } from '../components/finance/AddAccountModal.js';
import { AccountIcon } from '../components/AccountIcon.js';
import type { Account, UpdateAccountInput } from '@finance/shared-types';
import { toast } from '../store/toastStore.js';

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'BANK', label: 'Savings & Checking' },
  { value: 'CURRENT', label: 'Current Account' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'INVESTMENT', label: 'Investment Portfolio' },
  { value: 'WALLET', label: 'Digital Wallet' },
  { value: 'CASH', label: 'Cash in Hand' },
];

function getAccountTypeLabel(type: string): string {
  switch (type?.toUpperCase()) {
    case 'BANK':
      return 'Savings';
    case 'CURRENT':
      return 'Current';
    case 'CREDIT_CARD':
      return 'Credit Card';
    case 'INVESTMENT':
      return 'Investment';
    case 'WALLET':
      return 'Wallet';
    case 'CASH':
      return 'Cash';
    case 'LOAN':
      return 'Loan';
    default:
      return type || 'Account';
  }
}

function getAccountIcon(type: string) {
  switch (type?.toUpperCase()) {
    case 'CREDIT_CARD':
      return <CreditCard className="w-5 h-5 stroke-[2]" />;
    case 'INVESTMENT':
      return <TrendingUp className="w-5 h-5 stroke-[2]" />;
    case 'WALLET':
    case 'CASH':
      return <Wallet className="w-5 h-5 stroke-[2]" />;
    default:
      return <Landmark className="w-5 h-5 stroke-[2]" />;
  }
}

function getAccountCardStyle(type: string, isActive: boolean): string {
  if (!isActive) {
    return 'bg-slate-50/80 border border-slate-200/60 opacity-70';
  }
  const t = (type || '').toUpperCase();
  switch (t) {
    case 'BANK':
    case 'SAVINGS':
    case 'CHECKING':
    case 'CURRENT':
      return 'bg-gradient-to-br from-white via-blue-50/20 to-slate-50 border border-blue-100/70 shadow-2xs hover:border-blue-200';
    case 'CREDIT_CARD':
      return 'bg-gradient-to-br from-white via-amber-50/20 to-slate-50 border border-amber-100/70 shadow-2xs hover:border-amber-200';
    case 'INVESTMENT':
      return 'bg-gradient-to-br from-white via-purple-50/20 to-slate-50 border border-purple-100/70 shadow-2xs hover:border-purple-200';
    case 'WALLET':
    case 'CASH':
      return 'bg-gradient-to-br from-white via-emerald-50/20 to-slate-50 border border-emerald-100/70 shadow-2xs hover:border-emerald-200';
    case 'LOAN':
      return 'bg-gradient-to-br from-white via-rose-50/20 to-slate-50 border border-rose-100/70 shadow-2xs hover:border-rose-200';
    default:
      return 'bg-gradient-to-br from-white via-blue-50/20 to-slate-50 border border-blue-100/70 shadow-2xs hover:border-blue-200';
  }
}

export const AccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useSafeQueryClient();

  // Modals state (strictly separate Add vs Edit)
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [statusConfirmAccount, setStatusConfirmAccount] = useState<Account | null>(null);


  // Edit Account form state
  const [editName, setEditName] = useState<string>('');
  const [editInstitution, setEditInstitution] = useState<string>('');
  const [editType, setEditType] = useState<string>('BANK');
  const [editIdentifier, setEditIdentifier] = useState<string>('');
  const [editError, setEditError] = useState<string>('');

  // TanStack Query: Fetch user settings
  const { data: userSettings } = useQuery(
    {
      queryKey: ['userSettings'],
      queryFn: async () => apiClient.settings.get(),
    },
    queryClient
  );
  const userCurrency = userSettings?.currency || 'INR';

  // TanStack Query: Fetch accounts list
  const { data, isLoading, isError, error } = useQuery(
    {
      queryKey: ['accounts'],
      queryFn: async () => {
        const res = await apiClient.accounts.list();
        return res;
      },
      placeholderData: keepPreviousData,
    },
    queryClient
  );

  const accounts: Account[] = data?.accounts || [];
  const summary = data?.summary || {
    totalBalance: accounts.reduce((sum, acc) => (acc.status === 'ACTIVE' ? sum + acc.currentBalance : sum), 0),
    activeCount: accounts.filter((acc) => acc.status === 'ACTIVE').length,
    totalCount: accounts.length,
  };

  // Mutations
  const updateAccountMutation = useMutation(
    {
      mutationFn: async ({ id, input }: { id: string; input: UpdateAccountInput }) => {
        return await apiClient.accounts.update(id, input);
      },
      onSuccess: () => {
        syncOnAccountMutation(queryClient);
        setEditingAccount(null);
        resetEditForm();
        toast.success('Account updated successfully');
      },
      onError: (err: any) => {
        const msg = getFriendlyErrorMessage(err, 'Failed to update account. Please try again.');
        setEditError(msg);
        toast.error(msg);
      },
    },
    queryClient
  );

  const toggleStatusMutation = useMutation(
    {
      mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) => {
        return await apiClient.accounts.toggleStatus(id, status);
      },
      onSuccess: () => {
        syncOnAccountMutation(queryClient);
        setStatusConfirmAccount(null);
        setEditingAccount(null);
        toast.success('Account status updated');
      },
      onError: (err: any) => {
        toast.error(getFriendlyErrorMessage(err, 'Failed to update account status'));
      },
    },
    queryClient
  );

  // Handlers for Add Form
  const handleOpenAdd = () => {
    setIsAddModalOpen(true);
  };

  // Handlers for Edit Form
  const resetEditForm = () => {
    setEditName('');
    setEditInstitution('');
    setEditType('BANK');
    setEditIdentifier('');
    setEditError('');
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setEditName(acc.name);
    setEditInstitution(acc.institutionName || (acc as any).institution || '');
    setEditType(acc.type || (acc as any).accountType || 'BANK');
    setEditIdentifier(acc.accountNumberMask || (acc as any).accountIdentifier || '');
    setEditError('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    if (!editName.trim()) {
      setEditError('Account name is required.');
      return;
    }

    updateAccountMutation.mutate({
      id: editingAccount.id,
      input: {
        name: editName.trim(),
        institution: editInstitution.trim() || null,
        accountType: editType,
        accountIdentifier: editIdentifier.trim() || null,
      },
    });
  };

  const handleConfirmToggleStatus = () => {
    if (!statusConfirmAccount) return;
    const nextStatus = statusConfirmAccount.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    toggleStatusMutation.mutate({
      id: statusConfirmAccount.id,
      status: nextStatus,
    });
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Branded Dark Navy Header */}
      <AppHeader
        variant="nested"
        title="Accounts"
        subtitle="Connected banks & portfolios"
        rightAction={
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
          >
            Add
          </Button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Total Balance Hero Card */}
        <Card className="bg-gradient-to-tr from-[#0B1B3A] via-[#0F224A] to-[#132A5C] text-white p-5 space-y-3 border-0 shadow-xl rounded-card relative overflow-hidden">
          {/* Subtle animated ambient floating light gradients */}
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-blue-500/20 blur-3xl pointer-events-none opacity-20 animate-ambient-glow" />
          <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none opacity-20 animate-ambient-glow" style={{ animationDelay: '-3s' }} />

          {/* Subtle background glow & icons */}
          <div className="absolute -right-4 -bottom-4 opacity-10 text-white pointer-events-none">
            <Landmark className="w-28 h-28" />
          </div>

          <div className="flex items-center justify-between text-slate-300 relative z-10">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-300" />
              <span className="text-xs font-semibold uppercase tracking-wider">Total Net Balance</span>
            </div>
            <Badge variant="primary" size="sm" className="bg-blue-500/20 text-blue-200 border border-blue-400/30">
              {`${summary.activeCount} Active Accounts`}
            </Badge>
          </div>

          <div className="text-3xl font-black tracking-tight text-white relative z-10">
            {formatCurrency(summary.totalBalance, userCurrency)}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-300/80 pt-1 border-t border-white/10 relative z-10">
            <span>Aggregated across all connected balances</span>
            <div className="flex items-center gap-1.5 text-blue-300">
              <Landmark className="w-3.5 h-3.5" />
              <CreditCard className="w-3.5 h-3.5" />
              <PiggyBank className="w-3.5 h-3.5" />
            </div>
          </div>
        </Card>

        {/* Add Account Launcher Banner */}
        <div className="flex items-center justify-between px-1 pt-1">
          <h2 className="text-xs font-bold text-textMuted uppercase tracking-wider">
            {`Connected Institutions (${accounts.length})`}
          </h2>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="text-xs font-semibold text-brand-primary hover:underline inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Account</span>
          </button>
        </div>

        {/* Error State Banner if Query Failed */}
        {isError && (
          <div className="p-3.5 bg-semantic-danger-bg text-semantic-danger text-xs rounded-xl border border-semantic-danger/30 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error instanceof Error ? error.message : 'Unable to load accounts. Please try refreshing.'}</span>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="space-y-3">
            <CardSkeleton rows={2} />
            <CardSkeleton rows={2} />
          </div>
        ) : accounts.length === 0 ? (
          /* Empty State when 0 accounts exist */
          <EmptyState
            icon={<Landmark className="w-7 h-7 stroke-[1.8]" />}
            title="No accounts yet"
            description="Add your first bank, card, or cash wallet to get started."
            actionLabel="Add Account"
            actionIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            onAction={handleOpenAdd}
          />
        ) : (
          /* Account Cards List */
          <div className="space-y-3">
            {accounts.map((acc) => {
              const isActive = acc.status === 'ACTIVE';
              const typeLabel = getAccountTypeLabel(acc.type || (acc as any).accountType);
              const mask = acc.accountNumberMask || (acc as any).accountIdentifier || '';
              const institution = acc.institutionName || (acc as any).institution || 'Self-Managed';

              return (
                <Card
                  key={acc.id}
                  className={`p-4 space-y-3 transition-all ${getAccountCardStyle(
                    acc.type || (acc as any).accountType,
                    isActive
                  )}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <AccountIcon
                        institution={acc.institutionName || (acc as any).institution}
                        accountType={acc.type || (acc as any).accountType}
                        cardNetworkPrefix={acc.accountNumberMask || (acc as any).accountIdentifier}
                        size="md"
                      />
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-textDefault leading-tight truncate">
                          {acc.name}
                        </h3>
                        <p className="text-xs text-textMuted leading-tight mt-0.5 truncate">
                          {institution}
                          {mask ? ` • ${mask}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        variant={acc.type === 'INVESTMENT' ? 'investment' : acc.type === 'CREDIT_CARD' ? 'warning' : 'primary'}
                        size="sm"
                      >
                        {typeLabel}
                      </Badge>
                      <Badge variant={isActive ? 'success' : 'neutral'} size="sm">
                        {isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs text-textMuted font-medium">Current Balance</span>
                    <span className="text-lg font-extrabold text-textDefault tracking-tight">
                      {formatCurrency(acc.currentBalance, (acc as any).currency || userCurrency)}
                    </span>
                  </div>

                  {/* Per-card Quick-Action Button Row */}
                  <div className="pt-2.5 border-t border-borderDefault flex items-center justify-between text-xs font-semibold text-brand-primary">
                    <button
                      type="button"
                      onClick={() => navigate(`/transactions?accountId=${acc.id}`)}
                      className="hover:underline flex items-center gap-1.5 py-1 px-1.5 -ml-1 rounded active:bg-blue-50"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>Transactions</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/analytics?accountId=${acc.id}`)}
                      className="hover:underline flex items-center gap-1.5 py-1 px-1.5 rounded active:bg-blue-50"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Analytics</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(acc)}
                      className="hover:underline text-textMuted hover:text-textDefault flex items-center gap-1.5 py-1 px-1.5 -mr-1 rounded active:bg-gray-100"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Settings</span>
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Edit Account Modal */}
      <Modal
        isOpen={editingAccount !== null}
        onClose={() => setEditingAccount(null)}
        title="Edit Account"
        subtitle="Update connected institution details and preferences"
        icon={<Settings className="w-5 h-5 stroke-[2.2]" />}
        footer={
          <div className="flex items-center gap-2 w-full justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingAccount(null)}
              className="px-3.5 py-1.5 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-account-form"
              variant="primary"
              size="sm"
              isLoading={updateAccountMutation.isPending}
              className="px-3.5 py-1.5 text-xs font-bold shadow-xs"
            >
              Update Account
            </Button>
          </div>
        }
      >
        <form id="edit-account-form" onSubmit={handleEditSubmit} className="space-y-4">
          {editError && (
            <div className="p-3 bg-semantic-danger-bg text-semantic-danger text-xs font-semibold rounded-xl border border-semantic-danger/30 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div>
            <Input
              label="Account Name"
              type="text"
              required
              placeholder="e.g. HDFC Salary Account"
              value={editName}
              onChange={(e) => {
                setEditName(e.target.value);
                if (editError) setEditError('');
              }}
              icon={<Building2 className="w-4 h-4" />}
            />
          </div>

          <div>
            <div className="flex items-end gap-2.5">
              <div className="flex-1">
                <Input
                  label="Institution / Bank"
                  type="text"
                  placeholder="e.g. HDFC Bank"
                  value={editInstitution}
                  onChange={(e) => setEditInstitution(e.target.value)}
                  icon={<Landmark className="w-4 h-4" />}
                />
              </div>
              <div className="shrink-0 pb-1" title="Live institution logo preview">
                <AccountIcon
                  institution={editInstitution}
                  accountType={editType}
                  cardNetworkPrefix={editIdentifier}
                  size="md"
                />
              </div>
            </div>
          </div>

          <div>
            <Select
              label="Account Type"
              value={editType}
              onChange={(e) => setEditType(e.target.value)}
              options={ACCOUNT_TYPE_OPTIONS}
            />
          </div>

          <div>
            <Input
              label="Account Mask / Identifier"
              type="text"
              placeholder="e.g. •••• 4291 or last 4 digits"
              value={editIdentifier}
              onChange={(e) => setEditIdentifier(e.target.value)}
              icon={<CreditCard className="w-4 h-4" />}
            />
          </div>

          {/* Account Status Toggle Section */}
          {editingAccount && (
            <div className="pt-3 border-t border-borderDefault">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-borderDefault">
                <div>
                  <div className="text-xs font-bold text-textDefault">Account Status</div>
                  <div className="text-[11px] text-textMuted">
                    Currently {editingAccount.status === 'ACTIVE' ? 'Active for recording transactions' : 'Inactive (disabled)'}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={editingAccount.status === 'ACTIVE' ? 'danger' : 'primary'}
                  onClick={() => {
                    setStatusConfirmAccount(editingAccount);
                  }}
                >
                  {editingAccount.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Delete Account Modal */}
      {(() => {
        const isCurrentlyActive = statusConfirmAccount?.status === 'ACTIVE';
        const dialogDef = CONFIRM_DIALOGS.accounts.toggleStatus(
          statusConfirmAccount?.name || 'Account',
          isCurrentlyActive
        );
        return (
          <Modal
            isOpen={statusConfirmAccount !== null}
            onClose={() => setStatusConfirmAccount(null)}
            compact
            title={dialogDef.title}
            icon={
              isCurrentlyActive ? (
                <CircleOff className="w-4 h-4 text-semantic-danger" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-semantic-success" />
              )
            }
            footer={
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusConfirmAccount(null)}
                >
                  {dialogDef.cancelLabel}
                </Button>
                <Button
                  type="button"
                  variant={isCurrentlyActive ? 'danger' : 'primary'}
                  size="sm"
                  isLoading={toggleStatusMutation.isPending}
                  onClick={handleConfirmToggleStatus}
                >
                  {dialogDef.confirmLabel}
                </Button>
              </>
            }
          >
            <div className="text-xs text-textMuted leading-relaxed">
              <p>{dialogDef.message}</p>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
};

export default AccountsPage;
