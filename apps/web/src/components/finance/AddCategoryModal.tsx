import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Tag, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { Input } from '../ui/Input.js';
import { apiClient, getFriendlyErrorMessage } from '../../services/apiClient.js';
import { syncOnCategoryMutation } from '../../services/dataSync.js';
import { useSafeQueryClient } from '../../hooks/useSafeQueryClient.js';
import { toast } from '../../store/toastStore.js';
import type { TxnType } from '@finance/shared-types';

export interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TxnType;
  onCategoryCreated?: (category: any) => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  initialType = 'EXPENSE',
  onCategoryCreated,
}) => {
  const queryClient = useSafeQueryClient();
  const [name, setName] = useState('');
  const [type, setType] = useState<TxnType>(initialType);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setType(initialType || 'EXPENSE');
      setError('');
    }
  }, [isOpen, initialType]);

  const createMutation = useMutation(
    {
      mutationFn: async (payload: { name: string; type: TxnType }) => {
        return await apiClient.categories.create(payload);
      },
      onSuccess: (res: any) => {
        syncOnCategoryMutation(queryClient);
        toast.success('Category created successfully');
        const createdCat = res?.category || res?.data || res;
        onCategoryCreated?.(createdCat);
        onClose();
      },
      onError: (err: any) => {
        const msg = getFriendlyErrorMessage(err, 'Failed to create category.');
        setError(msg);
        toast.error(msg);
      },
    },
    queryClient
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }
    setError('');
    createMutation.mutate({
      name: name.trim(),
      type,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Category"
      subtitle="Create a custom category for classifying transactions"
      icon={<Tag className="w-5 h-5 stroke-[2.2] text-brand-primary" />}
      footer={
        <div className="flex items-center gap-2.5 w-full justify-end">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-category-form"
            variant="primary"
            size="md"
            isLoading={createMutation.isPending}
          >
            Create Category
          </Button>
        </div>
      }
    >
      <form id="add-category-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-semantic-danger-bg text-semantic-danger text-xs font-semibold rounded-xl border border-semantic-danger/30 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Classification Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-textDefault">Category Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(['EXPENSE', 'INCOME', 'INVESTMENT'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  type === t
                    ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Category Name */}
        <Input
          label="Category Name"
          required
          placeholder="e.g. Groceries, Gym, Side Hustle"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          icon={<Tag className="w-4 h-4 text-slate-400" />}
        />
      </form>
    </Modal>
  );
};

export default AddCategoryModal;
