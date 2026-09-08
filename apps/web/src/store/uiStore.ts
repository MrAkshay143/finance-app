import { create } from 'zustand';

export type TransactionType = 'income' | 'expense' | 'investment' | 'transfer';
export type TransactionModalMode = 'add' | 'edit';

export interface TransactionFormData {
  id?: string;
  amount: number | string;
  type: TransactionType;
  categoryId?: string;
  accountId: string;
  toAccountId?: string;
  merchant?: string;
  description: string;
  date: string;
}

export interface TransactionModalState {
  isOpen: boolean;
  mode: TransactionModalMode;
  type: TransactionType;
  initialData?: Partial<TransactionFormData>;
}

interface UiState {
  // Picker Modal
  isPickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;

  // Transaction Form Modal (Add vs Edit)
  transactionModal: TransactionModalState;
  openAddModal: (type: TransactionType) => void;
  openEditModal: (type: TransactionType, initialData: Partial<TransactionFormData>) => void;
  closeTransactionModal: () => void;

  // Notifications
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isPickerOpen: false,
  openPicker: () => set({ isPickerOpen: true }),
  closePicker: () => set({ isPickerOpen: false }),

  transactionModal: {
    isOpen: false,
    mode: 'add',
    type: 'expense',
  },
  openAddModal: (type: TransactionType) =>
    set({
      isPickerOpen: false,
      transactionModal: {
        isOpen: true,
        mode: 'add',
        type,
        initialData: {
          amount: '',
          type,
          categoryId: '',
          accountId: '',
          description: '',
          date: new Date().toISOString().slice(0, 10),
        },
      },
    }),
  openEditModal: (type: TransactionType, initialData: Partial<TransactionFormData>) =>
    set({
      isPickerOpen: false,
      transactionModal: {
        isOpen: true,
        mode: 'edit',
        type,
        initialData,
      },
    }),
  closeTransactionModal: () =>
    set((state) => ({
      transactionModal: {
        ...state.transactionModal,
        isOpen: false,
      },
    })),

  unreadCount: 0,
  setUnreadCount: (count: number) => set({ unreadCount: count }),
}));
