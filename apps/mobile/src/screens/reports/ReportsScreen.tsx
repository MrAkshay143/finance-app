import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@finance/shared-ui-tokens';
import type { MonthlyReportResponse } from '@finance/shared-types';
import { apiClient } from '../../services/apiClient';
import {
  ChevronLeftIcon,
  DownloadIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CheckIcon,
  AlertCircleIcon,
  CalendarIcon,
  ChevronDownIcon,
} from '../../components/icons';
import { FamDonutRing } from '../../components/FamDonutRing';

import { formatCurrency } from '../../utils/currency';

export { formatCurrency };

export type ReportSegment = 'Monthly' | 'Year in Review' | 'Custom Range';

// Generate last 6 months dynamically from current date
const generateMonthOptions = (): Array<{ value: string; label: string }> => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    options.push({ value, label: i === 0 ? `${label} (current)` : label });
  }
  return options;
};

const MONTH_OPTIONS = generateMonthOptions();

const getCurrentMonth = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const getCurrentYear = (): string => {
  return String(new Date().getFullYear());
};

export const ReportsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedSegment, setSelectedSegment] = useState<ReportSegment>('Monthly');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth);
  const [selectedYear, setSelectedYear] = useState<string>(getCurrentYear);
  const [customRange, setCustomRange] = useState<{ startDate: string; endDate: string; label: string }>(() => {
    const now = new Date();
    const startDate = `${now.getFullYear()}-01-01`;
    const endDate = now.toISOString().slice(0, 10);
    return { startDate, endDate, label: 'Year to Date' };
  });

  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [reportData, setReportData] = useState<MonthlyReportResponse | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const fetchReport = useCallback(async () => {
    try {
      let data: any;
      if (selectedSegment === 'Year in Review') {
        data = await apiClient.reports.getAnnual(selectedYear);
      } else if (selectedSegment === 'Custom Range') {
        data = await apiClient.reports.getCustom(customRange.startDate, customRange.endDate);
      } else {
        data = await apiClient.reports.getMonthly(selectedMonth);
      }
      setReportData(data);
    } catch {
      // Preserve existing report data if network fetch fails
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedSegment, selectedMonth, selectedYear, customRange]);

  useEffect(() => {
    setIsLoading(true);
    void fetchReport();
  }, [fetchReport]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    void fetchReport();
  }, [fetchReport]);

  const handleExportJson = async () => {
    try {
      setIsExporting(true);
      const res = await apiClient.reports.export({
        month: selectedMonth,
        format: 'json',
      });
      const content = typeof res === 'string' ? res : JSON.stringify(res, null, 2);
      await Share.share({
        title: `Financial Statement ${selectedMonth}`,
        message: content,
      });
    } catch (err: any) {
      Alert.alert('Export Failed', err?.message || 'Could not export financial report.');
    } finally {
      setIsExporting(false);
    }
  };

  const currentMonthLabel =
    MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label ?? selectedMonth;

  // Calculate variance between actual finances and target goals
  const incomeActual = reportData?.targetVsActual?.income?.actual ?? (reportData?.totals?.earnedPaise ? reportData.totals.earnedPaise / 100 : 0);
  const incomeTarget = reportData?.targetVsActual?.income?.target ?? 0;
  const incomeDiff = reportData?.targetVsActual?.income?.diff ?? (incomeActual - incomeTarget);

  const expenseActual = reportData?.targetVsActual?.expense?.actual ?? (reportData?.totals?.spentPaise ? reportData.totals.spentPaise / 100 : 0);
  const expenseTarget = reportData?.targetVsActual?.expense?.target ?? 0;
  const expenseDiff = reportData?.targetVsActual?.expense?.diff ?? (expenseActual - expenseTarget);

  const investmentActual = reportData?.targetVsActual?.investment?.actual ?? (reportData?.totals?.investedPaise ? reportData.totals.investedPaise / 100 : 0);
  const investmentTarget = reportData?.targetVsActual?.investment?.target ?? 0;
  const investmentDiff = reportData?.targetVsActual?.investment?.diff ?? (investmentActual - investmentTarget);

  const famScoreVal: number | null = typeof reportData?.famScore === 'number'
    ? reportData.famScore
    : reportData?.famScore?.overallProgressPercentage ?? reportData?.famScore?.progress ?? reportData?.famScore?.score ?? null;
  const famGradeVal: string | null =
    reportData?.famScore?.gradeDisplay ??
    (reportData?.famScore?.overallGrade === 'A_PLUS' ? 'A+' : reportData?.famScore?.overallGrade) ??
    reportData?.famScore?.grade ??
    null;


  const categoryBreakdown = reportData?.categorySummary ?? [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 8 : 48 }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            {navigation.canGoBack() && (
              <Pressable
                onPress={() => navigation.goBack()}
                style={styles.backButton}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <ChevronLeftIcon size={24} color="#FFFFFF" />
              </Pressable>
            )}
            <View>
              <Text style={styles.headerTitle}>Reports</Text>
              <Text style={styles.headerSubtitle}>FAM score & projected vs actual</Text>
            </View>
          </View>

          <Pressable
            onPress={handleExportJson}
            disabled={isExporting}
            style={({ pressed }) => [
              styles.exportButton,
              pressed && styles.exportButtonPressed,
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Export report as JSON"
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <DownloadIcon size={16} color="#FFFFFF" />
                <Text style={styles.exportButtonText}>Export JSON</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Segmented Pills */}
        <View style={styles.segmentedContainer}>
          {(['Monthly', 'Year in Review', 'Custom Range'] as ReportSegment[]).map((seg) => {
            const isSelected = selectedSegment === seg;
            return (
              <Pressable
                key={seg}
                onPress={() => setSelectedSegment(seg)}
                style={[styles.segmentTab, isSelected && styles.segmentTabActive]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={seg}
              >
                <Text
                  style={[
                    styles.segmentText,
                    isSelected && styles.segmentTextActive,
                  ]}
                >
                  {seg}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 40,
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector Card */}
        {selectedSegment === 'Monthly' && (
          <View style={styles.monthSelectorCard}>
            <Pressable
              onPress={() => setIsMonthPickerOpen((prev) => !prev)}
              style={styles.monthSelectorButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Select reporting month"
            >
              <View style={styles.monthSelectorLeft}>
                <CalendarIcon size={18} color={colors.primary} />
                <View>
                  <Text style={styles.monthSelectorSub}>REPORTING PERIOD</Text>
                  <Text style={styles.monthSelectorTitle}>{currentMonthLabel}</Text>
                </View>
              </View>
              <ChevronDownIcon size={18} color={colors.textMuted} />
            </Pressable>

            {isMonthPickerOpen && (
              <View style={styles.monthDropdown}>
                {MONTH_OPTIONS.map((opt) => {
                  const isCurrent = opt.value === selectedMonth;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => {
                        setSelectedMonth(opt.value);
                        setIsMonthPickerOpen(false);
                      }}
                      style={[styles.monthOption, isCurrent && styles.monthOptionActive]}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={opt.label}
                    >
                      <Text
                        style={[
                          styles.monthOptionText,
                          isCurrent && styles.monthOptionTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {isCurrent && <CheckIcon size={16} color={colors.primary} />}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {selectedSegment === 'Year in Review' && (
          <View style={styles.monthSelectorCard}>
            <View style={styles.monthSelectorButton}>
              <View style={styles.monthSelectorLeft}>
                <CalendarIcon size={18} color={colors.primary} />
                <View>
                  <Text style={styles.monthSelectorSub}>ANNUAL REVIEW</Text>
                  <Text style={styles.monthSelectorTitle}>Financial Year {selectedYear}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[String(new Date().getFullYear()), String(new Date().getFullYear() - 1)].map((yr) => (
                  <Pressable
                    key={yr}
                    onPress={() => setSelectedYear(yr)}
                    style={[
                      styles.yearPill,
                      selectedYear === yr && styles.yearPillActive,
                    ]}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Select financial year ${yr}`}
                  >
                    <Text
                      style={[
                        styles.yearPillText,
                        selectedYear === yr && styles.yearPillTextActive,
                      ]}
                    >
                      {yr}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}

        {selectedSegment === 'Custom Range' && (
          <View style={styles.monthSelectorCard}>
            <View style={{ padding: 14, gap: 10 }}>
              <View style={styles.monthSelectorLeft}>
                <CalendarIcon size={18} color={colors.primary} />
                <View>
                  <Text style={styles.monthSelectorSub}>CUSTOM RANGE ({customRange.label})</Text>
                  <Text style={styles.monthSelectorTitle}>
                    {customRange.startDate} to {customRange.endDate}
                  </Text>
                </View>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                {(() => {
                  const currentYear = new Date().getFullYear();
                  return [
                    { label: 'Year to Date', start: `${currentYear}-01-01`, end: new Date().toISOString().slice(0, 10) },
                    { label: `Q4 ${currentYear}`, start: `${currentYear}-10-01`, end: `${currentYear}-12-31` },
                    { label: `Q3 ${currentYear}`, start: `${currentYear}-07-01`, end: `${currentYear}-09-30` },
                    { label: `Q2 ${currentYear}`, start: `${currentYear}-04-01`, end: `${currentYear}-06-30` },
                    { label: `Q1 ${currentYear}`, start: `${currentYear}-01-01`, end: `${currentYear}-03-31` },
                  ];
                })().map((item) => {
                  const isActive = customRange.label === item.label;
                  return (
                    <Pressable
                      key={item.label}
                      onPress={() =>
                        setCustomRange({
                          startDate: item.start,
                          endDate: item.end,
                          label: item.label,
                        })
                      }
                      style={[
                        styles.rangePill,
                        isActive && styles.rangePillActive,
                      ]}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${item.label} range`}
                    >
                      <Text
                        style={[
                          styles.rangePillText,
                          isActive && styles.rangePillTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        )}

        {isLoading && !reportData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Generating financial report...</Text>
          </View>
        ) : (
          <>
            {/* 3 Summary Cards: FAM Score, Total Income, Total Expenses */}
            <View style={styles.summaryCardsRow}>
              {/* FAM Score Card */}
              <View style={[styles.summaryCard, styles.summaryCardFam]}>
                <Text style={styles.summaryCardLabel}>FAM SCORE</Text>
                <View style={styles.famScoreCenter}>
                  <FamDonutRing score={famScoreVal ?? 0} grade={famGradeVal ?? 'N/A'} size={64} strokeWidth={6} />
                </View>
                {famGradeVal ? (
                  <View style={styles.trendChipPositive}>
                    <TrendingUpIcon size={12} color={colors.success} />
                    <Text style={styles.trendChipPositiveText}>Grade {famGradeVal}</Text>
                  </View>
                ) : (
                  <View style={styles.trendChipPositive}>
                    <Text style={styles.trendChipPositiveText}>No data yet</Text>
                  </View>
                )}
              </View>


              {/* Total Income Card */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardLabel}>TOTAL INCOME</Text>
                <Text style={styles.summaryCardValue} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(incomeActual)}
                </Text>
                <View style={styles.trendChipPositive}>
                  <TrendingUpIcon size={12} color={colors.success} />
                  <Text style={styles.trendChipPositiveText}>
                    {incomeDiff >= 0 ? `+${formatCurrency(incomeDiff)}` : `-${formatCurrency(Math.abs(incomeDiff))}`}
                  </Text>
                </View>
              </View>

              {/* Total Expenses Card */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardLabel}>TOTAL EXPENSES</Text>
                <Text style={styles.summaryCardValue} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(expenseActual)}
                </Text>
                <View style={styles.trendChipWarning}>
                  <TrendingDownIcon size={12} color={colors.danger} />
                  <Text style={styles.trendChipWarningText}>
                    {expenseDiff <= 0 ? 'Under budget' : `+${formatCurrency(expenseDiff)}`}
                  </Text>
                </View>
              </View>
            </View>

            {/* Dynamic Callout Cards */}
            {reportData?.callouts && reportData.callouts.length > 0 ? (
              reportData.callouts.map((c) => (
                <View key={c.id} style={styles.calloutCard}>
                  <View style={styles.calloutHeader}>
                    <View style={styles.calloutBadge}>
                      <CheckIcon size={14} color="#FFFFFF" />
                    </View>
                    <Text style={styles.calloutTitle}>{c.title}</Text>
                  </View>
                  <Text style={styles.calloutDescription}>{c.message}</Text>
                </View>
              ))
            ) : (
              <View style={styles.calloutCard}>
                <View style={styles.calloutHeader}>
                  <View
                    style={[
                      styles.calloutBadge,
                      {
                        backgroundColor:
                          (reportData?.targetVsActual?.netSavings?.actual ?? (incomeActual - expenseActual - investmentActual)) >= 0
                            ? colors.primary
                            : colors.warning,
                      },
                    ]}
                  >
                    <CheckIcon size={14} color="#FFFFFF" />
                  </View>
                  <Text style={styles.calloutTitle}>
                    {(reportData?.targetVsActual?.netSavings?.actual ?? (incomeActual - expenseActual - investmentActual)) >= 0
                      ? 'You are on track!'
                      : 'Budget Attention Required'}
                  </Text>
                </View>
                <Text style={styles.calloutDescription}>
                  {(reportData?.targetVsActual?.netSavings?.actual ?? (incomeActual - expenseActual - investmentActual)) >= 0
                    ? `Net savings of ${formatCurrency(reportData?.targetVsActual?.netSavings?.actual ?? (incomeActual - expenseActual - investmentActual))} recorded this cycle. Your living expenses are well constrained within target budget guidelines.`
                    : `Net deficit of ${formatCurrency(Math.abs(reportData?.targetVsActual?.netSavings?.actual ?? (incomeActual - expenseActual - investmentActual)))} recorded this cycle. Your expenses exceeded target budget guidelines.`}
                </Text>
              </View>
            )}

            {/* Actual vs Projected Comparison Bars */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>ACTUAL VS PROJECTED</Text>
                <Text style={styles.sectionSubHeading}>Target Performance</Text>
              </View>

              <View style={styles.metricRow}>
                <View style={styles.metricLabelRow}>
                  <Text style={styles.metricTitle}>Income</Text>
                  <Text style={styles.metricValues}>
                    {formatCurrency(incomeActual)} / {formatCurrency(incomeTarget || incomeActual)}
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: colors.success,
                        width: `${Math.min(100, incomeTarget > 0 ? (incomeActual / incomeTarget) * 100 : (incomeActual > 0 ? 100 : 0))}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.metricRow}>
                <View style={styles.metricLabelRow}>
                  <Text style={styles.metricTitle}>Living Expenses</Text>
                  <Text style={styles.metricValues}>
                    {formatCurrency(expenseActual)} / {formatCurrency(expenseTarget || expenseActual)}
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: colors.danger,
                        width: `${Math.min(100, expenseTarget > 0 ? (expenseActual / expenseTarget) * 100 : (expenseActual > 0 ? 100 : 0))}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.metricRow}>
                <View style={styles.metricLabelRow}>
                  <Text style={styles.metricTitle}>Investments</Text>
                  <Text style={styles.metricValues}>
                    {formatCurrency(investmentActual)} / {formatCurrency(investmentTarget || investmentActual)}
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: colors.investment,
                        width: `${Math.min(100, investmentTarget > 0 ? (investmentActual / investmentTarget) * 100 : (investmentActual > 0 ? 100 : 0))}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Expense Breakdown Category List */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>EXPENSE BREAKDOWN</Text>
                <Text style={styles.sectionSubHeading}>By Category</Text>
              </View>

              {categoryBreakdown.length === 0 ? (
                <View style={styles.emptyCategories}>
                  <Text style={styles.emptyCategoriesText}>
                    No category expenses logged for this reporting period.
                  </Text>
                </View>
              ) : (
                categoryBreakdown.map((cat, idx) => {
                  const catAmount = cat.totalAmount ?? (cat.amountPaise ? cat.amountPaise / 100 : 0);
                  const catPercent = Math.round(cat.percentage ?? 0);
                  return (
                    <View key={cat.categoryId ?? `cat-${idx}`} style={styles.catBreakdownItem}>
                      <View style={styles.catBreakdownTop}>
                        <Text style={styles.catBreakdownName}>{cat.categoryName}</Text>
                        <Text style={styles.catBreakdownAmount}>{formatCurrency(catAmount)}</Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              backgroundColor: colors.primary,
                              width: `${Math.min(100, Math.max(5, catPercent))}%`,
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.catBreakdownBottom}>
                        <Text style={styles.catBreakdownCount}>{cat.transactionCount} transactions</Text>
                        <Text style={styles.catBreakdownPercent}>{catPercent}%</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Category Summary Table */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>CATEGORY SUMMARY</Text>

              <View style={styles.tableHeader}>
                <Text style={[styles.tableCol, styles.tableColName]}>Category</Text>
                <Text style={[styles.tableCol, styles.tableColNumber]}>Actual</Text>
                <Text style={[styles.tableCol, styles.tableColNumber]}>Projected</Text>
                <Text style={[styles.tableCol, styles.tableColNumber]}>Diff</Text>
              </View>

              {/* Income Row */}
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.tableColName, { fontWeight: '600' }]}>
                  Income
                </Text>
                <Text style={[styles.tableCell, styles.tableColNumber, { color: colors.success }]}>
                  {formatCurrency(incomeActual)}
                </Text>
                <Text style={[styles.tableCell, styles.tableColNumber]}>
                  {formatCurrency(incomeTarget)}
                </Text>
                <Text style={[styles.tableCell, styles.tableColNumber, { color: incomeDiff >= 0 ? colors.success : colors.danger }]}>
                  {incomeDiff >= 0 ? `+${formatCurrency(incomeDiff)}` : `-${formatCurrency(Math.abs(incomeDiff))}`}
                </Text>
              </View>

              {/* Expense Row */}
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.tableColName, { fontWeight: '600' }]}>
                  Expenses
                </Text>
                <Text style={[styles.tableCell, styles.tableColNumber, { color: colors.danger }]}>
                  {formatCurrency(expenseActual)}
                </Text>
                <Text style={[styles.tableCell, styles.tableColNumber]}>
                  {formatCurrency(expenseTarget)}
                </Text>
                <Text style={[styles.tableCell, styles.tableColNumber, { color: expenseDiff <= 0 ? colors.success : colors.danger }]}>
                  {expenseDiff <= 0 ? `-${formatCurrency(Math.abs(expenseDiff))}` : `+${formatCurrency(expenseDiff)}`}
                </Text>
              </View>

              {/* Investment Row */}
              <View style={[styles.tableRow, styles.tableRowLast]}>
                <Text style={[styles.tableCell, styles.tableColName, { fontWeight: '600' }]}>
                  Investments
                </Text>
                <Text style={[styles.tableCell, styles.tableColNumber, { color: colors.investment }]}>
                  {formatCurrency(investmentActual)}
                </Text>
                <Text style={[styles.tableCell, styles.tableColNumber]}>
                  {formatCurrency(investmentTarget)}
                </Text>
                <Text style={[styles.tableCell, styles.tableColNumber, { color: investmentDiff >= 0 ? colors.investment : colors.textMuted }]}>
                  {investmentDiff >= 0 ? `+${formatCurrency(investmentDiff)}` : `-${formatCurrency(Math.abs(investmentDiff))}`}
                </Text>
              </View>
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
    marginBottom: 16,
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
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
    borderRadius: 10,
  },
  exportButtonPressed: {
    opacity: 0.85,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 3,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: 8,
  },
  segmentTabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.primary,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  monthSelectorCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  monthSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    minHeight: 44,
  },
  monthSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  monthSelectorSub: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  monthSelectorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  monthDropdown: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: 4,
  },
  monthOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  monthOptionActive: {
    backgroundColor: colors.background,
  },
  monthOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  monthOptionTextActive: {
    fontWeight: '700',
    color: colors.primary,
  },
  yearPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  yearPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  yearPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  yearPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rangePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  rangePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rangePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  rangePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  summaryCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'space-between',
  },
  summaryCardFam: {
    alignItems: 'center',
  },
  summaryCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  summaryCardValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  famScoreCenter: {
    marginVertical: 4,
  },
  trendChipPositive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  trendChipPositiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  trendChipWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  trendChipWarningText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.danger,
  },
  calloutCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calloutBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  calloutDescription: {
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 18,
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
  metricRow: {
    gap: 6,
  },
  metricLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  metricValues: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  barTrack: {
    height: 7,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyCategories: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyCategoriesText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  catBreakdownItem: {
    gap: 4,
  },
  catBreakdownTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catBreakdownName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  catBreakdownAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  catBreakdownBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catBreakdownCount: {
    fontSize: 10,
    color: colors.textMuted,
  },
  catBreakdownPercent: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  tableCol: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tableColName: {
    flex: 1.4,
  },
  tableColNumber: {
    flex: 1,
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCell: {
    fontSize: 12,
    color: colors.text,
  },
});
