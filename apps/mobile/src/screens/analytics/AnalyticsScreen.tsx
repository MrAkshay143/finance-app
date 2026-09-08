import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import type { AnalyticsOverview } from '@finance/shared-types';
import { apiClient } from '../../services/apiClient';
import {
  ChevronLeftIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  PiggyBankIcon,
  ArrowRightIcon,
  ShieldIcon,
  PieChartIcon,
} from '../../components/icons';
import type { RootStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { formatDateRange } from '../../utils/date';

import { formatCurrency } from '../../utils/currency';
import { useUserCurrency } from '../../hooks/useUserCurrency';

export { formatCurrency };

export type PeriodOption = '1m' | '3m' | '6m' | '1y';

const PERIOD_TABS: Array<{ id: PeriodOption; label: string }> = [
  { id: '1m', label: '1M' },
  { id: '3m', label: '3M' },
  { id: '6m', label: '6M' },
  { id: '1y', label: '1Y' },
];

export const AnalyticsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { symbol: userSymbol } = useUserCurrency();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('6m');
  const [categoryType, setCategoryType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsOverview | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const data = await apiClient.analytics.get({ period: selectedPeriod });
      setAnalyticsData(data);
    } catch {
      // Retain previous or empty state gracefully
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    setIsLoading(true);
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    void fetchAnalytics();
  }, [fetchAnalytics]);

  const summary = analyticsData?.summary ?? {
    earned: 0,
    earnedPaise: 0,
    spent: 0,
    spentPaise: 0,
    invested: 0,
    investedPaise: 0,
    netSavings: 0,
    netSavingsPaise: 0,
    savingsRate: 0,
  };

  const defaultPeriodDates = useMemo(() => {
    const d = new Date();
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const lastDay = String(new Date(yr, d.getMonth() + 1, 0).getDate()).padStart(2, '0');
    return {
      start: `${yr}-${mo}-01`,
      end: `${yr}-${mo}-${lastDay}`,
    };
  }, []);

  const rawStart = analyticsData?.period?.startDate ?? defaultPeriodDates.start;
  const rawEnd = analyticsData?.period?.endDate ?? defaultPeriodDates.end;
  const dateRangeString = formatDateRange(rawStart, rawEnd);

  const savingsRate = Math.round(summary.savingsRate ?? 0);
  const spendingTrends = analyticsData?.spendingTrends ?? [];
  const activeCategoryBreakdown =
    categoryType === 'EXPENSE'
      ? (analyticsData?.expenseCategoryBreakdown || analyticsData?.categoryBreakdown || [])
      : (analyticsData?.incomeCategoryBreakdown || []);

  // Determine maximum spend in trends to normalize bar heights
  const maxTrendSpend = Math.max(...spendingTrends.map((t) => t.spent), 1);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 12 : 20 }]}>
        <View style={styles.headerRow}>
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
            <Text style={styles.headerTitle}>Analytics</Text>
            <Text style={styles.headerSubtitle}>Financial trends and spending metrics</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 40 },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Blue Vertical Bar Accent & Date Range Header */}
        <View style={styles.dateRangeCard}>
          <View style={styles.dateRangeLeft}>
            <View style={styles.blueBarAccent} />
            <View>
              <Text style={styles.dateRangeSub}>ANALYSIS TIMELINE</Text>
              <Text style={styles.dateRangeHeader}>{dateRangeString}</Text>
            </View>
          </View>

          {/* Period Selector */}
          <View style={styles.periodTabsContainer}>
            {PERIOD_TABS.map((tab) => {
              const isSelected = selectedPeriod === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setSelectedPeriod(tab.id)}
                  style={[styles.periodTab, isSelected && styles.periodTabActive]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Period ${tab.label}`}
                >
                  <Text
                    style={[
                      styles.periodTabText,
                      isSelected && styles.periodTabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Profile Completion Prompt Banner */}
        {!user?.onboardingCompleted && (
          <View style={styles.profileBanner}>
          <View style={styles.profileBannerContent}>
            <View style={styles.profileIconWrap}>
              <ShieldIcon size={20} color={colors.primary} />
            </View>
            <View style={styles.profileBannerTextWrap}>
              <Text style={styles.profileBannerTitle}>Calibrate Financial Targets</Text>
              <Text style={styles.profileBannerSubtitle}>
                Complete your profile to activate automated benchmarks.
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => navigation.navigate('FinanceProfile')}
            style={({ pressed }) => [
              styles.profileBannerButton,
              pressed && styles.profileBannerButtonPressed,
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Complete Finance Profile"
          >
            <Text style={styles.profileBannerButtonText}>Complete Finance Profile</Text>
            <ArrowRightIcon size={14} color="#FFFFFF" />
          </Pressable>
        </View>
        )}

        {isLoading && !analyticsData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Calculating spending metrics...</Text>
          </View>
        ) : (
          <>
            {/* 3 Stat Cards: Income, Expenses, Saved */}
            <View style={styles.statCardsRow}>
              {/* Income */}
              <View style={[styles.statCard, styles.statCardIncome]}>
                <View style={styles.statCardHeader}>
                  <Text style={styles.statCardLabel}>Income</Text>
                  <TrendingUpIcon size={16} color={colors.success} />
                </View>
                <Text style={styles.statCardValue} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(summary.earned)}
                </Text>
                <Text style={styles.statCardSub}>Monthly aggregate</Text>
              </View>

              {/* Expenses */}
              <View style={[styles.statCard, styles.statCardExpense]}>
                <View style={styles.statCardHeader}>
                  <Text style={styles.statCardLabel}>Expenses</Text>
                  <TrendingDownIcon size={16} color={colors.danger} />
                </View>
                <Text style={styles.statCardValue} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(summary.spent)}
                </Text>
                <Text style={styles.statCardSub}>Total outgoing</Text>
              </View>

              {/* Saved */}
              <View style={[styles.statCard, styles.statCardSaved]}>
                <View style={styles.statCardHeader}>
                  <Text style={styles.statCardLabel}>Saved</Text>
                  <PiggyBankIcon size={16} color={colors.investment} />
                </View>
                <Text style={styles.statCardValue} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(summary.netSavings)}
                </Text>
                <Text style={styles.statCardSub}>{savingsRate}% rate</Text>
              </View>
            </View>

            {/* Savings Rate Card */}
            <View style={styles.savingsRateCard}>
              <View style={styles.savingsRateHeader}>
                <View>
                  <Text style={styles.savingsRateTitle}>Savings & Investment Rate</Text>
                  <Text style={styles.savingsRateBenchmark}>Benchmark target: 20%</Text>
                </View>
                <View style={styles.savingsRateBadge}>
                  <Text style={styles.savingsRateBadgeText}>{savingsRate}%</Text>
                </View>
              </View>

              <View style={styles.savingsRateTrack}>
                <View
                  style={[
                    styles.savingsRateFill,
                    {
                      width: `${Math.min(100, Math.max(5, savingsRate))}%`,
                      backgroundColor: savingsRate >= 20 ? colors.success : colors.warning,
                    },
                  ]}
                />
              </View>

              <View style={styles.savingsRateFooter}>
                <Text style={styles.savingsRateCallout} numberOfLines={1}>
                  {savingsRate >= 20
                    ? `Exceeding target by ${savingsRate - 20}%`
                    : 'Target benchmark 20%'}
                </Text>
                <Text style={styles.savingsRateAllocated}>
                  Invested: {formatCurrency(summary.invested)}
                </Text>
              </View>
            </View>

            {/* 6-Month Spending Trend Bars */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>6-MONTH SPENDING TREND</Text>
                <Text style={styles.sectionSubHeading}>Historic Comparison</Text>
              </View>

              {spendingTrends.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No monthly spending trends found.</Text>
                </View>
              ) : (
                <View style={styles.chartContainer}>
                  <View style={styles.chartBarsRow}>
                    {spendingTrends.map((trend) => {
                      const barPercentage = Math.round((trend.spent / maxTrendSpend) * 100);
                      return (
                        <View key={trend.month} style={styles.chartBarCol}>
                          <Text style={styles.chartBarValue}>
                            {trend.spent >= 1000
                              ? `${userSymbol}${Math.round(trend.spent / 1000)}k`
                              : `${userSymbol}${Math.round(trend.spent)}`}
                          </Text>
                          <View style={styles.chartBarTrack}>
                            <View
                              style={[
                                styles.chartBarFill,
                                {
                                  height: `${Math.max(12, barPercentage)}%`,
                                  backgroundColor: colors.primary,
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.chartBarMonth}>{trend.monthLabel.split(' ')[0]}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Category Breakdown List */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionHeading}>CATEGORY BREAKDOWN</Text>
                  <Text style={styles.sectionSubHeading}>
                    {categoryType === 'EXPENSE' ? 'Expense Distribution' : 'Income Distribution'}
                  </Text>
                </View>
                {/* Segmented Expense / Income Toggle */}
                <View style={styles.catToggleContainer}>
                  <Pressable
                    onPress={() => setCategoryType('EXPENSE')}
                    style={[
                      styles.catTogglePill,
                      categoryType === 'EXPENSE' && styles.catTogglePillActiveExpense,
                    ]}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Filter expenses category breakdown"
                  >
                    <Text
                      style={[
                        styles.catToggleText,
                        categoryType === 'EXPENSE' && styles.catToggleTextActiveExpense,
                      ]}
                    >
                      Expenses
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setCategoryType('INCOME')}
                    style={[
                      styles.catTogglePill,
                      categoryType === 'INCOME' && styles.catTogglePillActiveIncome,
                    ]}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Filter income category breakdown"
                  >
                    <Text
                      style={[
                        styles.catToggleText,
                        categoryType === 'INCOME' && styles.catToggleTextActiveIncome,
                      ]}
                    >
                      Income
                    </Text>
                  </Pressable>
                </View>
              </View>

              {activeCategoryBreakdown.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {categoryType === 'EXPENSE'
                      ? 'No expense category records available.'
                      : 'No income category records available.'}
                  </Text>
                </View>
              ) : (
                <View style={styles.categoriesList}>
                  {activeCategoryBreakdown.map((cat, idx) => {
                    const catAmount = cat.totalAmount ?? (cat.amountPaise ? cat.amountPaise / 100 : 0);
                    const catPercentage = Math.round(cat.percentage ?? 0);
                    return (
                      <View key={cat.categoryId ?? `cat-${idx}`} style={styles.categoryItem}>
                        <View style={styles.categoryHeader}>
                          <View style={styles.categoryNameWrap}>
                            <View
                              style={[
                                styles.categoryDot,
                                categoryType === 'INCOME' && { backgroundColor: colors.success },
                              ]}
                            />
                            <Text style={styles.categoryName} numberOfLines={1}>
                              {cat.categoryName}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.categoryAmount,
                              categoryType === 'INCOME' && { color: colors.success },
                            ]}
                          >
                            {formatCurrency(catAmount)}
                          </Text>
                        </View>

                        <View style={styles.categoryTrack}>
                          <View
                            style={[
                              styles.categoryFill,
                              {
                                width: `${Math.min(100, Math.max(4, catPercentage))}%`,
                                backgroundColor: categoryType === 'INCOME' ? colors.success : colors.primary,
                              },
                            ]}
                          />
                        </View>

                        <View style={styles.categoryFooter}>
                          <Text style={styles.categoryTxnCount}>
                            {cat.transactionCount ?? 0} transaction{cat.transactionCount === 1 ? '' : 's'}
                          </Text>
                          <Text style={styles.categoryPercent}>{catPercentage}%</Text>
                        </View>
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
  headerRow: {
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
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  dateRangeCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  dateRangeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  blueBarAccent: {
    width: 4,
    height: 36,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  dateRangeSub: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  dateRangeHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  periodTabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 3,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  periodTabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  periodTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  periodTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  profileBanner: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  profileBannerContent: {
    flexDirection: 'row',
    gap: 10,
  },
  profileIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBannerTextWrap: {
    flex: 1,
    gap: 2,
  },
  profileBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  profileBannerSubtitle: {
    fontSize: 11,
    color: '#0369A1',
    lineHeight: 16,
  },
  profileBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    minHeight: 44,
    alignSelf: 'flex-start',
  },
  profileBannerButtonPressed: {
    opacity: 0.85,
  },
  profileBannerButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
  statCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  statCardIncome: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
  statCardExpense: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  statCardSaved: {
    backgroundColor: '#FAF5FF',
    borderColor: '#F3E8FF',
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  statCardValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  statCardSub: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  savingsRateCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  savingsRateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savingsRateTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  savingsRateBenchmark: {
    fontSize: 11,
    color: colors.textMuted,
  },
  savingsRateBadge: {
    backgroundColor: '#ECFDF3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsRateBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.success,
  },
  savingsRateTrack: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  savingsRateFill: {
    height: '100%',
    borderRadius: 4,
  },
  savingsRateFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  savingsRateCallout: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
    flex: 1,
  },
  savingsRateAllocated: {
    fontSize: 11,
    color: colors.textMuted,
    flexShrink: 0,
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
  catToggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catTogglePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  catTogglePillActiveExpense: {
    backgroundColor: '#FEE2E2',
  },
  catTogglePillActiveIncome: {
    backgroundColor: '#DCFCE7',
  },
  catToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  catToggleTextActiveExpense: {
    color: colors.danger,
  },
  catToggleTextActiveIncome: {
    color: colors.success,
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
  chartContainer: {
    paddingTop: 8,
  },
  chartBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingHorizontal: 4,
  },
  chartBarCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  chartBarValue: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
  },
  chartBarTrack: {
    width: 22,
    height: 100,
    backgroundColor: colors.background,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 6,
  },
  chartBarMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
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
    flex: 1,
    marginRight: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  categoryAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 0,
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
});
