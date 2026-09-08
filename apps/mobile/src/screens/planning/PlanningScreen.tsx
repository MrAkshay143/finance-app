import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, CONFIRM_DIALOGS, toMobileAlertArgs } from '@finance/shared-ui-tokens';
import type { Category } from '@finance/shared-types';
import { apiClient } from '../../services/apiClient';
import { useUserCurrency } from '../../hooks/useUserCurrency';
import { formatDate as formatCentralDate } from '../../utils/date';
import { BrandedHeader } from '../../components/BrandedHeader';
import {
  PieChartIcon,
  TargetIcon,
  FlagIcon,
  PlusIcon,
  CalendarIcon,
  TrashIcon,
  CloseIcon,
  RefreshCwIcon,
  TagIcon,
} from '../../components/icons';
import type { RootStackParamList } from '../../navigation/types';

export interface BudgetItem {
  id: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    type: string;
    isSystem: boolean;
  } | null;
  name?: string;
  targetAmount: number;
  spent: number;
  remaining: number;
  progress: number;
  period?: string;
  periodStart?: string;
  status: string;
}

export interface GoalItem {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  progress: number;
  targetDate?: string | null;
  status: string;
}

import { formatCurrency } from '../../utils/currency';

export { formatCurrency };

export const formatDate = (dateVal?: string | null): string => {
  if (!dateVal) return 'No target date';
  return formatCentralDate(dateVal) || String(dateVal);
};

export const PlanningScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { symbol: userSymbol } = useUserCurrency();
  const [tab, setTab] = useState<'budgets' | 'goals'>('budgets');

  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal visibility
  const [showAddBudgetModal, setShowAddBudgetModal] = useState<boolean>(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState<boolean>(false);

  // Budget form state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [budgetName, setBudgetName] = useState<string>('');
  const [budgetLimit, setBudgetLimit] = useState<string>('');
  const [budgetSubmitting, setBudgetSubmitting] = useState<boolean>(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  // Goal form state
  const defaultGoalTargetDate = useMemo(() => `${new Date().getFullYear()}-12-31`, []);
  const [goalName, setGoalName] = useState<string>('');
  const [goalTargetAmount, setGoalTargetAmount] = useState<string>('');
  const [goalCurrentAmount, setGoalCurrentAmount] = useState<string>('');
  const [goalTargetDate, setGoalTargetDate] = useState<string>(defaultGoalTargetDate);
  const [goalSubmitting, setGoalSubmitting] = useState<boolean>(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [budgetsRes, goalsRes, categoriesRes] = await Promise.all([
        apiClient.budgets.list(),
        apiClient.goals.list(),
        apiClient.categories.list(),
      ]);
      setBudgets((budgetsRes || []) as BudgetItem[]);
      setGoals((goalsRes || []) as GoalItem[]);
      setCategories((categoriesRes || []) as Category[]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load planning data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadData();
  }, [loadData]);

  // Handle create budget
  const handleCreateBudget = async () => {
    if (!selectedCategoryId) {
      setBudgetError('Please select a category for this budget.');
      return;
    }
    const limit = parseFloat(budgetLimit);
    if (isNaN(limit) || limit <= 0) {
      setBudgetError('Budget limit must be a positive number.');
      return;
    }

    try {
      setBudgetSubmitting(true);
      setBudgetError(null);
      await apiClient.budgets.create({
        categoryId: selectedCategoryId,
        name: budgetName.trim() || undefined,
        targetAmount: limit,
      });
      setShowAddBudgetModal(false);
      setSelectedCategoryId('');
      setBudgetName('');
      setBudgetLimit('');
      await loadData();
    } catch (err: any) {
      setBudgetError(err?.message || 'Failed to create budget');
    } finally {
      setBudgetSubmitting(false);
    }
  };

  // Handle delete budget
  const handleDeleteBudget = (id: string, name?: string) => {
    const dialogDef = CONFIRM_DIALOGS.planning.deleteBudget(name || 'this budget');
    const [title, message, buttons] = toMobileAlertArgs(dialogDef, async () => {
      try {
        await apiClient.budgets.delete(id);
        setBudgets((prev) => prev.filter((b) => b.id !== id));
      } catch (err: any) {
        setError(err?.message || 'Failed to delete budget');
      }
    });
    Alert.alert(title, message, buttons);
  };

  // Handle create goal
  const handleCreateGoal = async () => {
    if (!goalName.trim()) {
      setGoalError('Goal name is required.');
      return;
    }
    const target = parseFloat(goalTargetAmount);
    if (isNaN(target) || target <= 0) {
      setGoalError('Target amount must be a positive number.');
      return;
    }
    const current = goalCurrentAmount ? parseFloat(goalCurrentAmount) : 0;
    if (isNaN(current) || current < 0) {
      setGoalError('Current amount cannot be negative.');
      return;
    }

    try {
      setGoalSubmitting(true);
      setGoalError(null);
      await apiClient.goals.create({
        name: goalName.trim(),
        targetAmount: target,
        currentAmount: current,
        targetDate: goalTargetDate || new Date().toISOString().split('T')[0],
      });
      setShowAddGoalModal(false);
      setGoalName('');
      setGoalTargetAmount('');
      setGoalCurrentAmount('');
      setGoalTargetDate(defaultGoalTargetDate);
      await loadData();
    } catch (err: any) {
      setGoalError(err?.message || 'Failed to create financial goal');
    } finally {
      setGoalSubmitting(false);
    }
  };

  // Handle delete goal
  const handleDeleteGoal = (id: string, name?: string) => {
    const dialogDef = CONFIRM_DIALOGS.planning.deleteGoal(name || 'this goal');
    const [title, message, buttons] = toMobileAlertArgs(dialogDef, async () => {
      try {
        await apiClient.goals.delete(id);
        setGoals((prev) => prev.filter((g) => g.id !== id));
      } catch (err: any) {
        setError(err?.message || 'Failed to delete goal');
      }
    });
    Alert.alert(title, message, buttons);
  };

  const expenseCategories = categories.filter(
    (c) => c.type === 'EXPENSE' || !c.type
  );

  return (
    <View style={styles.container}>
      <BrandedHeader
        variant="nested"
        title="Planning & Budgets"
        subtitle="Spending limits and financial goals"
        onBackPress={() => navigation.goBack()}
        rightAction={
          <Pressable
            onPress={() => {
              if (tab === 'budgets') {
                setShowAddBudgetModal(true);
              } else {
                setShowAddGoalModal(true);
              }
            }}
            style={styles.headerActionButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={tab === 'budgets' ? 'Add Budget' : 'Add Goal'}
          >
            <PlusIcon size={14} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.headerActionText}>
              {tab === 'budgets' ? 'Add Budget' : 'Add Goal'}
            </Text>
          </Pressable>
        }
      />

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <View style={styles.segmentedControl}>
          <Pressable
            onPress={() => setTab('budgets')}
            style={[styles.segmentTab, tab === 'budgets' && styles.segmentTabActive]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Monthly Budgets tab"
          >
            <PieChartIcon
              size={16}
              color={tab === 'budgets' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.segmentLabel,
                tab === 'budgets' && styles.segmentLabelActive,
              ]}
            >
              Monthly Budgets
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTab('goals')}
            style={[styles.segmentTab, tab === 'goals' && styles.segmentTabActive]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Financial Goals tab"
          >
            <TargetIcon
              size={16}
              color={tab === 'goals' ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.segmentLabel,
                tab === 'goals' && styles.segmentLabelActive,
              ]}
            >
              Financial Goals
            </Text>
          </Pressable>
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
              onPress={() => void loadData()}
              style={styles.retryButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Retry loading planning data"
            >
              <RefreshCwIcon size={14} color={colors.primary} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading planning configuration...</Text>
          </View>
        ) : tab === 'budgets' ? (
          /* Budgets Tab Content */
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>CATEGORY SPENDING BUDGETS</Text>
              <Text style={styles.sectionCountText}>
                {budgets.length} configured
              </Text>
            </View>

            {budgets.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <PieChartIcon size={28} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>No active budgets configured</Text>
                <Text style={styles.emptyDescription}>
                  Set monthly spending limits to keep your expenses on track.
                </Text>
                <Pressable
                  onPress={() => setShowAddBudgetModal(true)}
                  style={styles.emptyActionButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Add Monthly Budget"
                >
                  <PlusIcon size={14} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.emptyActionText}>Add Monthly Budget</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.itemsList}>
                {budgets.map((b) => {
                  const percent = Math.round(b.progress || 0);
                  const isOver = percent > 100;
                  const isWarning = percent >= 80 && percent <= 100;
                  const meterColor = isOver
                    ? colors.danger
                    : isWarning
                    ? colors.warning
                    : colors.success;

                  return (
                    <View key={b.id} style={styles.itemCard}>
                      <View style={styles.itemTopRow}>
                        <View style={styles.itemTitleGroup}>
                          <View style={styles.categoryIconSquare}>
                            <TagIcon size={16} color={colors.primary} />
                          </View>
                          <View style={styles.itemTextCol}>
                            <Text style={styles.itemName} numberOfLines={1}>
                              {b.name || b.category?.name || 'Category Budget'}
                            </Text>
                            {b.name && b.category?.name ? (
                              <Text style={styles.itemCategorySub}>
                                {b.category.name}
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        <Pressable
                          onPress={() => handleDeleteBudget(b.id, b.name || b.category?.name)}
                          style={styles.deleteButton}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`Delete budget ${b.name || b.category?.name || 'item'}`}
                        >
                          <TrashIcon size={16} color={colors.textMuted} />
                        </Pressable>
                      </View>

                      {/* Amounts Display */}
                      <View style={styles.amountsRow}>
                        <Text style={styles.spentAmountText}>
                          {formatCurrency(b.spent)}{' '}
                          <Text style={styles.targetLimitText}>
                            / {formatCurrency(b.targetAmount)}
                          </Text>
                        </Text>
                        <Text style={[styles.percentBadgeText, { color: meterColor }]}>
                          {percent}%
                        </Text>
                      </View>

                      {/* Progress Bar */}
                      <View style={styles.meterTrack}>
                        <View
                          style={[
                            styles.meterFill,
                            {
                              width: `${Math.min(100, Math.max(0, percent))}%`,
                              backgroundColor: meterColor,
                            },
                          ]}
                        />
                      </View>

                      {/* Footer Row */}
                      <View style={styles.itemFooterRow}>
                        <Text
                          style={[
                            styles.remainingText,
                            isOver && { color: colors.danger, fontWeight: '700' },
                          ]}
                        >
                          {isOver
                            ? `Exceeded by ${formatCurrency(Math.abs(b.remaining))}`
                            : `${formatCurrency(b.remaining)} remaining`}
                        </Text>
                        <Text style={styles.periodBadge}>Monthly</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          /* Goals Tab Content */
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>TARGET MILESTONES</Text>
              <Text style={styles.sectionCountText}>{goals.length} active</Text>
            </View>

            {goals.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <FlagIcon size={28} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>No financial goals set</Text>
                <Text style={styles.emptyDescription}>
                  Set target amounts and dates to track your savings milestones.
                </Text>
                <Pressable
                  onPress={() => setShowAddGoalModal(true)}
                  style={styles.emptyActionButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Create Financial Goal"
                >
                  <PlusIcon size={14} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.emptyActionText}>Create Financial Goal</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.itemsList}>
                {goals.map((g) => {
                  const percent = Math.min(100, Math.round(g.progress || 0));

                  return (
                    <View key={g.id} style={styles.itemCard}>
                      <View style={styles.itemTopRow}>
                        <View style={styles.itemTitleGroup}>
                          <View
                            style={[
                              styles.categoryIconSquare,
                              { backgroundColor: colors.investmentBg },
                            ]}
                          >
                            <TargetIcon size={16} color={colors.investment} />
                          </View>
                          <View style={styles.itemTextCol}>
                            <Text style={styles.itemName} numberOfLines={1}>
                              {g.name}
                            </Text>
                            <View style={styles.dateMetaRow}>
                              <CalendarIcon size={12} color={colors.textMuted} />
                              <Text style={styles.dateMetaText}>
                                {formatDate(g.targetDate)}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <Pressable
                          onPress={() => handleDeleteGoal(g.id, g.name)}
                          style={styles.deleteButton}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`Delete goal ${g.name}`}
                        >
                          <TrashIcon size={16} color={colors.textMuted} />
                        </Pressable>
                      </View>

                      {/* Amounts Display */}
                      <View style={styles.amountsRow}>
                        <Text style={styles.spentAmountText}>
                          {formatCurrency(g.currentAmount)}{' '}
                          <Text style={styles.targetLimitText}>
                            / {formatCurrency(g.targetAmount)}
                          </Text>
                        </Text>
                        <Text
                          style={[styles.percentBadgeText, { color: colors.investment }]}
                        >
                          {percent}%
                        </Text>
                      </View>

                      {/* Progress Bar */}
                      <View style={styles.meterTrack}>
                        <View
                          style={[
                            styles.meterFill,
                            {
                              width: `${Math.min(100, Math.max(0, percent))}%`,
                              backgroundColor: colors.investment,
                            },
                          ]}
                        />
                      </View>

                      {/* Footer Row */}
                      <View style={styles.itemFooterRow}>
                        <Text style={styles.remainingText}>
                          {formatCurrency(g.remainingAmount)} to target
                        </Text>
                        <Text style={styles.periodBadge}>
                          {percent >= 100 ? 'Achieved' : 'In Progress'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Budget Modal */}
      <Modal
        visible={showAddBudgetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddBudgetModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardAvoid}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleCol}>
                  <Text style={styles.modalTitle}>Add Monthly Budget</Text>
                  <Text style={styles.modalSubtitle}>
                    Set a monthly spending limit for a category
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowAddBudgetModal(false)}
                  style={styles.modalCloseButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Close add budget modal"
                >
                  <CloseIcon size={20} color={colors.textMuted} />
                </Pressable>
              </View>

              {budgetError && (
                <View style={styles.modalErrorBox}>
                  <Text style={styles.modalErrorText}>{budgetError}</Text>
                </View>
              )}

              <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
                {/* Category Picker */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Category *</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryChipsContainer}
                  >
                    {expenseCategories.map((c) => {
                      const isSelected = selectedCategoryId === c.id;
                      return (
                        <Pressable
                          key={c.id}
                          onPress={() => setSelectedCategoryId(c.id)}
                          style={[
                            styles.categorySelectChip,
                            isSelected && styles.categorySelectChipActive,
                          ]}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`Select category ${c.name}`}
                        >
                          <Text
                            style={[
                              styles.categorySelectChipText,
                              isSelected && styles.categorySelectChipTextActive,
                            ]}
                          >
                            {c.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Optional Custom Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Budget Name (Optional)</Text>
                  <TextInput
                    value={budgetName}
                    onChangeText={setBudgetName}
                    placeholder="e.g. Monthly Grocery Limit"
                    placeholderTextColor={colors.textMuted}
                    style={styles.textInput}
                  />
                </View>

                {/* Spending Limit */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Monthly Spending Limit ({userSymbol}) *</Text>
                  <TextInput
                    value={budgetLimit}
                    onChangeText={setBudgetLimit}
                    keyboardType="numeric"
                    placeholder="e.g. 15000"
                    placeholderTextColor={colors.textMuted}
                    style={styles.textInput}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable
                  onPress={() => setShowAddBudgetModal(false)}
                  style={styles.cancelButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel adding budget"
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleCreateBudget()}
                  disabled={budgetSubmitting}
                  style={[styles.submitButton, budgetSubmitting && styles.submitDisabled]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Save Budget"
                >
                  {budgetSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Save Budget</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Add Goal Modal */}
      <Modal
        visible={showAddGoalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddGoalModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardAvoid}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleCol}>
                  <Text style={styles.modalTitle}>Add Financial Goal</Text>
                  <Text style={styles.modalSubtitle}>
                    Set target savings milestone with scheduled date
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowAddGoalModal(false)}
                  style={styles.modalCloseButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Close add goal modal"
                >
                  <CloseIcon size={20} color={colors.textMuted} />
                </Pressable>
              </View>

              {goalError && (
                <View style={styles.modalErrorBox}>
                  <Text style={styles.modalErrorText}>{goalError}</Text>
                </View>
              )}

              <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
                {/* Goal Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Goal Name *</Text>
                  <TextInput
                    value={goalName}
                    onChangeText={setGoalName}
                    placeholder="e.g. Emergency Reserve Fund"
                    placeholderTextColor={colors.textMuted}
                    style={styles.textInput}
                  />
                </View>

                {/* Target Amount */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Target Amount ({userSymbol}) *</Text>
                  <TextInput
                    value={goalTargetAmount}
                    onChangeText={setGoalTargetAmount}
                    keyboardType="numeric"
                    placeholder="e.g. 100000"
                    placeholderTextColor={colors.textMuted}
                    style={styles.textInput}
                  />
                </View>

                {/* Current Amount */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Currently Saved Amount ({userSymbol})</Text>
                  <TextInput
                    value={goalCurrentAmount}
                    onChangeText={setGoalCurrentAmount}
                    keyboardType="numeric"
                    placeholder="e.g. 25000"
                    placeholderTextColor={colors.textMuted}
                    style={styles.textInput}
                  />
                </View>

                {/* Target Date */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Target Completion Date (YYYY-MM-DD)</Text>
                  <TextInput
                    value={goalTargetDate}
                    onChangeText={setGoalTargetDate}
                    placeholder={defaultGoalTargetDate}
                    placeholderTextColor={colors.textMuted}
                    style={styles.textInput}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable
                  onPress={() => setShowAddGoalModal(false)}
                  style={styles.cancelButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel adding goal"
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => void handleCreateGoal()}
                  disabled={goalSubmitting}
                  style={[styles.submitButton, goalSubmitting && styles.submitDisabled]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Save Goal"
                >
                  {goalSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Save Goal</Text>
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
  headerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    minHeight: 44,
    borderRadius: 8,
  },
  headerActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 3,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentTabActive: {
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  segmentLabelActive: {
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
  sectionContainer: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    marginTop: 4,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
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
    paddingHorizontal: 12,
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
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  categoryIconSquare: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextCol: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  itemCategorySub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  deleteButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  spentAmountText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  targetLimitText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  percentBadgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  meterTrack: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 3,
  },
  itemFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  remainingText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  periodBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dateMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  dateMetaText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    width: '100%',
    maxHeight: '85%',
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
  modalKeyboardAvoid: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
  modalFormScroll: {
    maxHeight: 340,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
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
  categoryChipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  categorySelectChip: {
    paddingHorizontal: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  categorySelectChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  categorySelectChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  categorySelectChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
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
