import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@finance/shared-ui-tokens';
import type { InvestmentsOverviewResponse } from '@finance/shared-types';
import { apiClient } from '../../services/apiClient';
import { formatDate as formatCentralDate } from '../../utils/date';
import {
  ChevronLeftIcon,
  PlusIcon,
  BriefcaseIcon,
  TrendingUpIcon,
  ChevronRightIcon,
  PieChartIcon,
} from '../../components/icons';
import type { RootStackParamList } from '../../navigation/types';

import { formatCurrency } from '../../utils/currency';

export { formatCurrency };

export const formatDate = (dateVal?: string): string => {
  return formatCentralDate(dateVal);
};

export const InvestmentsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [overview, setOverview] = useState<InvestmentsOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchInvestments = useCallback(async () => {
    try {
      const data = await apiClient.investments.getOverview();
      setOverview(data);
    } catch {
      // Retain previous or empty state gracefully
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    void fetchInvestments();
  }, [fetchInvestments]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    void fetchInvestments();
  }, [fetchInvestments]);

  const handleAddInvestment = () => {
    navigation.navigate('AddTransactionModal', {
      defaultType: 'investment',
    });
  };

  const totalInvested = overview?.totalInvested ?? (overview?.totalInvestedPaise ? overview.totalInvestedPaise / 100 : 0);
  const monthlyInvested = overview?.monthlyInvested ?? (overview?.monthlyInvestedPaise ? overview.monthlyInvestedPaise / 100 : 0);
  const targetComparison = overview?.targetComparison ?? {
    target: 0,
    targetPaise: 0,
    actual: 0,
    actualPaise: 0,
    diff: 0,
    diffPaise: 0,
    percentageAchieved: 0,
  };

  const targetPercentage = Math.round(targetComparison.percentageAchieved ?? 0);
  const categoryBreakdown = overview?.categoryBreakdown ?? [];
  const recentInvestments = overview?.recentInvestments ?? [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 12 : 20 }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            {navigation.canGoBack() && (
              <Pressable
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronLeftIcon size={24} color="#FFFFFF" />
              </Pressable>
            )}
            <View>
              <Text style={styles.headerTitle}>Investments</Text>
              <Text style={styles.headerSubtitle}>Portfolio & target progress</Text>
            </View>
          </View>

          <Pressable
            onPress={handleAddInvestment}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Add Investment"
          >
            <PlusIcon size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.addButtonText}>Add Investment</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 40 },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.investment} />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !overview ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.investment} />
            <Text style={styles.loadingText}>Fetching investment portfolio...</Text>
          </View>
        ) : (
          <>
            {/* Total Invested Card */}
            <View style={styles.totalInvestedCard}>
              <View style={styles.totalInvestedTop}>
                <View style={styles.briefcaseIconWrap}>
                  <BriefcaseIcon size={22} color={colors.investment} />
                </View>
                <View style={styles.portfolioBadge}>
                  <TrendingUpIcon size={12} color={colors.investment} />
                  <Text style={styles.portfolioBadgeText}>Active Assets</Text>
                </View>
              </View>

              <View style={styles.totalAmountWrap}>
                <Text style={styles.totalInvestedLabel}>TOTAL INVESTED VALUE</Text>
                <Text style={styles.totalInvestedValue}>{formatCurrency(totalInvested)}</Text>
              </View>

              <View style={styles.monthlySummaryRow}>
                <View style={styles.monthlySummaryCol}>
                  <Text style={styles.monthlySummaryLabel}>This Month</Text>
                  <Text style={styles.monthlySummaryValue}>{formatCurrency(monthlyInvested)}</Text>
                </View>
                <View style={styles.monthlySummaryDivider} />
                <View style={styles.monthlySummaryCol}>
                  <Text style={styles.monthlySummaryLabel}>Target Goal</Text>
                  <Text style={styles.monthlySummaryValue}>{formatCurrency(targetComparison.target)}</Text>
                </View>
              </View>

              {/* Monthly Target Progress Bar */}
              <View style={styles.targetProgressSection}>
                <View style={styles.targetProgressHeader}>
                  <Text style={styles.targetProgressLabel}>Monthly Target Progress</Text>
                  <Text style={styles.targetProgressPercent}>{targetPercentage}%</Text>
                </View>

                <View style={styles.targetProgressBarTrack}>
                  <View
                    style={[
                      styles.targetProgressBarFill,
                      {
                        width: `${Math.min(100, Math.max(5, targetPercentage))}%`,
                        backgroundColor: targetPercentage >= 100 ? colors.success : colors.investment,
                      },
                    ]}
                  />
                </View>

                <View style={styles.targetProgressFooter}>
                  <Text style={styles.targetProgressSub}>
                    {targetComparison.diff >= 0
                      ? `Achieved ${formatCurrency(targetComparison.actual)} target`
                      : `${formatCurrency(Math.abs(targetComparison.diff))} needed to reach target`}
                  </Text>
                </View>
              </View>
            </View>

            {/* Category Breakdown */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>ASSET ALLOCATION</Text>
                <View style={styles.categoryCountBadge}>
                  <PieChartIcon size={14} color={colors.investment} />
                  <Text style={styles.categoryCountText}>{categoryBreakdown.length} Categories</Text>
                </View>
              </View>

              {categoryBreakdown.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No investment allocations registered yet.</Text>
                </View>
              ) : (
                <View style={styles.categoriesList}>
                  {categoryBreakdown.map((cat, idx) => {
                    const catAmount = cat.totalAmount ?? (cat.amountPaise ? cat.amountPaise / 100 : 0);
                    const catPercentage = Math.round(cat.percentage ?? 0);
                    return (
                      <View key={cat.categoryId ?? `inv-cat-${idx}`} style={styles.categoryItem}>
                        <View style={styles.categoryHeader}>
                          <View style={styles.categoryNameWrap}>
                            <View style={styles.categoryDot} />
                            <Text style={styles.categoryName}>{cat.categoryName}</Text>
                          </View>
                          <Text style={styles.categoryAmount}>{formatCurrency(catAmount)}</Text>
                        </View>

                        <View style={styles.categoryTrack}>
                          <View
                            style={[
                              styles.categoryFill,
                              {
                                width: `${Math.min(100, Math.max(4, catPercentage))}%`,
                                backgroundColor: colors.investment,
                              },
                            ]}
                          />
                        </View>

                        <View style={styles.categoryFooter}>
                          <Text style={styles.categoryTxnCount}>{cat.transactionCount} transactions</Text>
                          <Text style={styles.categoryPercent}>{catPercentage}%</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Recent Investments List */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>RECENT INVESTMENTS</Text>
                <Text style={styles.sectionSubHeading}>Latest Deposits</Text>
              </View>

              {recentInvestments.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No investment transactions logged yet.</Text>
                </View>
              ) : (
                <View style={styles.recentList}>
                  {recentInvestments.map((txn: any, idx: number) => {
                    const amount = txn.amount ?? (txn.amountPaise ? txn.amountPaise / 100 : 0);
                    const title = txn.description || txn.merchant || txn.category?.name || 'Investment';
                    const subtitle = txn.account?.name || (txn.date ? formatDate(txn.date) : '');
                    return (
                      <View key={txn.id ?? `inv-txn-${idx}`} style={styles.recentItem}>
                        <View style={styles.recentIconWrap}>
                          <BriefcaseIcon size={16} color={colors.investment} />
                        </View>
                        <View style={styles.recentContent}>
                          <Text style={styles.recentTitle} numberOfLines={1}>
                            {title}
                          </Text>
                          <Text style={styles.recentSubtitle}>{subtitle}</Text>
                        </View>
                        <Text style={styles.recentAmount}>+{formatCurrency(amount)}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.investment,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 44,
  },
  addButtonPressed: {
    opacity: 0.85,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
  },
  totalInvestedCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 14,
  },
  totalInvestedTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  briefcaseIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portfolioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  portfolioBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.investment,
  },
  totalAmountWrap: {
    gap: 4,
  },
  totalInvestedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  totalInvestedValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  monthlySummaryRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
  },
  monthlySummaryCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  monthlySummaryDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  monthlySummaryLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  monthlySummaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  targetProgressSection: {
    gap: 6,
    paddingTop: 4,
  },
  targetProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetProgressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  targetProgressPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.investment,
  },
  targetProgressBarTrack: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  targetProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  targetProgressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  targetProgressSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  sectionSubHeading: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  categoryCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryCountText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  categoriesList: {
    gap: 12,
  },
  categoryItem: {
    gap: 6,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.investment,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  categoryAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  categoryTrack: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryTxnCount: {
    fontSize: 10,
    color: colors.textMuted,
  },
  categoryPercent: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  recentList: {
    gap: 10,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recentIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentContent: {
    flex: 1,
    gap: 2,
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  recentSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
  },
  recentAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.investment,
  },
});
