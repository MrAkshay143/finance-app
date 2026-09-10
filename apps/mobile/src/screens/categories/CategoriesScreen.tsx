import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, CONFIRM_DIALOGS, toMobileAlertArgs } from '@finance/shared-ui-tokens';
import type { Category, TxnType } from '@finance/shared-types';
import { apiClient } from '../../services/apiClient';
import { BrandedHeader } from '../../components/BrandedHeader';
import {
  TagIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  LockIcon,
  CloseIcon,
  GripVerticalIcon,
  SearchIcon,
  RefreshCwIcon,
} from '../../components/icons';
import type { RootStackParamList } from '../../navigation/types';

export type CategoryFilterType = 'ALL' | 'EXPENSE' | 'INCOME' | 'INVESTMENT';

export const CategoriesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<CategoryFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string>('');
  const [categoryType, setCategoryType] = useState<TxnType>('EXPENSE');
  const [modalSubmitting, setModalSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setError(null);
      const res = await apiClient.categories.list();
      setCategories(res || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchCategories();
  }, [fetchCategories]);

  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryType('EXPENSE');
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    if (cat.isSystem) return;
    setModalMode('edit');
    setEditingCategoryId(cat.id);
    setCategoryName(cat.name);
    setCategoryType(cat.type);
    setModalError(null);
    setShowModal(true);
  };

  const handleSubmitModal = async () => {
    const trimmed = categoryName.trim();
    if (!trimmed) {
      setModalError('Category name is required.');
      return;
    }

    try {
      setModalSubmitting(true);
      setModalError(null);

      if (modalMode === 'add') {
        await apiClient.categories.create({
          name: trimmed,
          type: categoryType,
        });
      } else if (modalMode === 'edit' && editingCategoryId) {
        await apiClient.categories.update(editingCategoryId, {
          name: trimmed,
          type: categoryType,
        });
      }

      setShowModal(false);
      await fetchCategories();
    } catch (err: any) {
      setModalError(err?.message || `Failed to ${modalMode} category`);
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (cat.isSystem) return;

    const performDelete = async () => {
      try {
        await apiClient.categories.delete(cat.id);
        setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      } catch (err: any) {
        setError(err?.message || 'Failed to delete category');
      }
    };

    if (typeof Alert !== 'undefined' && Alert.alert) {
      const dialogDef = CONFIRM_DIALOGS.categories.delete(cat.name);
      const [title, message, buttons] = toMobileAlertArgs(dialogDef, () => void performDelete());
      Alert.alert(title, message, buttons);
    } else {
      void performDelete();
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const matchesFilter =
      filter === 'ALL' || cat.type.toUpperCase() === filter.toUpperCase();
    const matchesSearch =
      !searchQuery.trim() ||
      cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <BrandedHeader
        variant="nested"
        title="Categories"
        subtitle="Manage classification labels"
        onBackPress={() => navigation.goBack()}
        rightAction={
          <Pressable
            onPress={handleOpenAddModal}
            style={styles.headerAddButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Add category"
          >
            <PlusIcon size={14} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.headerAddButtonText}>Add</Text>
          </Pressable>
        }
      />

      {/* Filter Tabs & Search Header */}
      <View style={styles.topControlContainer}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={16} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search categories..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillsRow}>
          {(['ALL', 'EXPENSE', 'INCOME', 'INVESTMENT'] as CategoryFilterType[]).map((tab) => {
            const isSelected = filter === tab;
            const label =
              tab === 'ALL'
                ? 'All'
                : tab.charAt(0) + tab.slice(1).toLowerCase();

            return (
              <Pressable
                key={tab}
                onPress={() => setFilter(tab)}
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillActive,
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${label}`}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 32 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Error Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              onPress={() => void fetchCategories()}
              style={styles.retryButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Retry loading categories"
            >
              <RefreshCwIcon size={14} color={colors.primary} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading categories...</Text>
          </View>
        ) : filteredCategories.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <TagIcon size={24} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No categories found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery.trim()
                ? `No categories matching "${searchQuery}".`
                : 'No categories available in this filter.'}
            </Text>
            <Pressable
              onPress={handleOpenAddModal}
              style={styles.emptyActionButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Add New Category"
            >
              <PlusIcon size={14} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.emptyActionText}>Add Category</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.categoryList}>
            {filteredCategories.map((cat) => {
              const isExpense = cat.type === 'EXPENSE';
              const isIncome = cat.type === 'INCOME';
              const isInvestment = cat.type === 'INVESTMENT';

              const tagBg = isIncome
                ? colors.successBg
                : isInvestment
                ? colors.investmentBg
                : colors.dangerBg;

              const tagColor = isIncome
                ? colors.success
                : isInvestment
                ? colors.investment
                : colors.danger;

              return (
                <View key={cat.id} style={styles.categoryCard}>
                  <View style={styles.cardLeft}>
                    {/* Drag Reorder Affordance */}
                    <View style={styles.dragHandle}>
                      <GripVerticalIcon size={16} color="#98A2B3" />
                    </View>

                    {/* Tag Icon Box */}
                    <View style={[styles.tagIconBox, { backgroundColor: tagBg }]}>
                      <TagIcon size={16} color={tagColor} />
                    </View>

                    {/* Name & Type */}
                    <View style={styles.catInfoCol}>
                      <Text style={styles.catName} numberOfLines={1}>
                        {cat.name}
                      </Text>
                      <Text style={styles.catTypeSub}>{cat.type}</Text>
                    </View>
                  </View>

                  {/* Right Actions / System Badge */}
                  <View style={styles.cardRight}>
                    {cat.isSystem ? (
                      <View style={styles.systemBadge}>
                        <LockIcon size={12} color={colors.textMuted} />
                        <Text style={styles.systemBadgeText}>System</Text>
                      </View>
                    ) : (
                      <View style={styles.customActionRow}>
                        <View style={styles.customBadge}>
                          <Text style={styles.customBadgeText}>Custom</Text>
                        </View>
                        <Pressable
                          onPress={() => handleOpenEditModal(cat)}
                          style={styles.actionIconButton}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`Edit category ${cat.name}`}
                        >
                          <PencilIcon size={15} color={colors.primary} />
                        </Pressable>
                        <Pressable
                          onPress={() => void handleDeleteCategory(cat)}
                          style={styles.actionIconButton}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`Delete category ${cat.name}`}
                        >
                          <TrashIcon size={15} color={colors.danger} />
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add / Edit Category Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardAvoid}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleCol}>
                  <Text style={styles.modalTitle}>
                    {modalMode === 'add' ? 'Add Category' : 'Edit Category'}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {modalMode === 'add'
                      ? 'Create a new custom classification tag'
                      : 'Update custom category name and type'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowModal(false)}
                  style={styles.modalCloseButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Close category modal"
                >
                  <CloseIcon size={20} color={colors.textMuted} />
                </Pressable>
              </View>

              {modalError && (
                <View style={styles.modalErrorBox}>
                  <Text style={styles.modalErrorText}>{modalError}</Text>
                </View>
              )}

              <View style={styles.modalForm}>
                {/* Category Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Category Name *</Text>
                  <TextInput
                    value={categoryName}
                    onChangeText={setCategoryName}
                    placeholder="e.g. Freelance Consulting"
                    placeholderTextColor={colors.textMuted}
                    style={styles.textInput}
                  />
                </View>

                {/* Category Type */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Transaction Classification Type *</Text>
                  <View style={styles.typeSelectorRow}>
                    {(['EXPENSE', 'INCOME', 'INVESTMENT'] as TxnType[]).map((t) => {
                      const isSelected = categoryType === t;
                      const label =
                        t === 'EXPENSE'
                          ? 'Expense'
                          : t === 'INCOME'
                          ? 'Income'
                          : 'Investment';

                      return (
                        <Pressable
                          key={t}
                          onPress={() => setCategoryType(t)}
                          style={[
                            styles.typeChoiceChip,
                            isSelected && styles.typeChoiceChipActive,
                          ]}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`Select classification ${label}`}
                        >
                          <Text
                            style={[
                              styles.typeChoiceText,
                              isSelected && styles.typeChoiceTextActive,
                            ]}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <Pressable
                  onPress={() => setShowModal(false)}
                  style={styles.cancelButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel category modification"
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleSubmitModal()}
                  disabled={modalSubmitting}
                  style={[styles.submitButton, modalSubmitting && styles.submitDisabled]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={
                    modalMode === 'add' ? 'Save Category' : 'Update Category'
                  }
                >
                  {modalSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {modalMode === 'add' ? 'Save Category' : 'Update Category'}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: 8,
  },
  headerAddButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topControlContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    padding: 0,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  filterPillTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 10,
  },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    flex: 1,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 44,
    minWidth: 44,
    padding: 4,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  emptyDescription: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    minHeight: 44,
    borderRadius: 10,
    marginTop: 6,
  },
  emptyActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoryList: {
    gap: 8,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dragHandle: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  tagIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catInfoCol: {
    flex: 1,
  },
  catName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  catTypeSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  systemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  systemBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  customActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  actionIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalKeyboardAvoid: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    width: '100%',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitleCol: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalErrorBox: {
    backgroundColor: colors.dangerBg,
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  modalErrorText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '500',
  },
  modalForm: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: colors.text,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChoiceChip: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChoiceChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  typeChoiceText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  typeChoiceTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  submitButton: {
    flex: 1.5,
    minHeight: 44,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
