import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@finance/shared-ui-tokens';
import type { DashboardSummary } from '@finance/shared-types';
import { apiClient } from '../services/apiClient';
import { formatDate as formatCentralDate } from '../utils/date';
import { BrandedHeader } from '../components/BrandedHeader';
import { FamDonutRing } from '../components/FamDonutRing';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  PiggyBankIcon,
  ShieldAlertIcon,
  ChevronRightIcon,
  CreditCardIcon,
  ReceiptIcon,
  PlusIcon,
  ArrowRightIcon,
  RefreshCwIcon,
} from '../components/icons';
import type { RootStackParamList } from '../navigation/types';
import { formatCurrency } from '../utils/currency';

export { formatCurrency };

export const formatDate = (dateVal?: string | Date): string => {
  return formatCentralDate(dateVal);
};

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const res = await apiClient.dashboard.get();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Unable to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading && !data) {
    return (
      <View style={styles.container}>
        <BrandedHeader
          variant="root"
          title="Finance Tracker"
          subtitle="Financial Assessment & Wealth Hub"
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading Dashboard Summary...</Text>
        </View>
      </View>
    );
  }

  const fam = data?.fam;
  const targets = data?.targets;
  const security = data?.securityBanner;
  const expenseBreakdown = data?.expenseBreakdown || [];
  const incomeBreakdown = (data as any)?.incomeBreakdown || [];
  const [breakdownView, setBreakdownView] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const activeBreakdown = breakdownView === 'EXPENSE' ? expenseBreakdown : incomeBreakdown;
  const accountSummary = data?.accountSummary;
  const recentTransactions = data?.recentTransactions || [];

  return (
    <View style={styles.container}>
      <BrandedHeader
        variant="root"
        title="Finance Tracker"
        subtitle="Financial Assessment & Wealth Hub"
        onAvatarPress={() => navigation.navigate('Profile')}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom + 24 : 32,
          },
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
        {/* Error State Banner */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              onPress={() => void fetchDashboardData()}
              style={styles.retryButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Retry loading dashboard"
            >
              <RefreshCwIcon size={14} color={colors.primary} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* 1. Security Reminder Banner (if KBA questions < 3) */}
        {security?.showSecurityReminder && (
          <View style={styles.securityBanner}>
            <View style={styles.securityBannerHeader}>
              <View style={styles.securityIconBox}>
                <ShieldAlertIcon size={18} color={colors.warning} />
              </View>
              <View style={styles.securityTextContainer}>
                <Text style={styles.securityTitle}>Security Reminder</Text>
                <Text style={styles.securityDescription}>
                  Set up 3 security questions to protect your account.
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => navigation.navigate('SecurityQuestions')}
              style={({ pressed }) => [
                styles.securityActionButton,
                pressed && styles.buttonPressed,
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Configure security questions"
            >
              <Text style={styles.securityActionText}>Complete Security Setup</Text>
              <ArrowRightIcon size={14} color={colors.warning} />
            </Pressable>
          </View>
        )}

        {/* 2. FAM Score Overview Card */}
        <View style={styles.card}>
          <View style={styles.famCardHeader}>
            <View style={styles.famDetailsCol}>
              <View style={styles.famStatusBadgeRow}>
                <View style={styles.healthBadge}>
                  <Text style={styles.healthBadgeText}>
                    {fam?.statusLabel?.toUpperCase() || (fam?.grade ? 'ASSESSED' : 'UNASSESSED')}
                  </Text>
                </View>
                <Text style={styles.famPeriodText}>Monthly Status</Text>
              </View>
              <Text style={styles.famTitle}>Financial Assessment Matrix</Text>
              <Text style={styles.famDescription}>
                Assessment weighted by 50/30/20 budget adherence, savings rate, and portfolio
                allocation.
              </Text>
              <Pressable
                onPress={() => (navigation as any).navigate('Reports')}
                style={styles.famReportLink}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="View full score report"
              >
                <Text style={styles.famReportLinkText}>View full score report</Text>
                <ChevronRightIcon size={14} color={colors.primary} />
              </Pressable>
            </View>

            <View style={styles.famDonutCol}>
              <FamDonutRing
                grade={fam?.grade || fam?.gradeDisplay || 'N/A'}
                progressPercentage={fam?.progress ?? fam?.overallProgressPercentage ?? 0}
                size={104}
                strokeWidth={9}
              />
            </View>
          </View>

          {/* 3 Area Status Chips */}
          <View style={styles.famChipsRow}>
            <View style={[styles.areaChip, styles.incomeChipBg]}>
              <View style={[styles.chipDot, { backgroundColor: colors.success }]} />
              <Text style={styles.areaChipText}>
                Income:{' '}
                <Text style={styles.areaChipBold}>
                  {fam?.areas?.income?.statusLabel || 'Not Set'}
                </Text>
              </Text>
            </View>

            <View style={[styles.areaChip, styles.expenseChipBg]}>
              <View style={[styles.chipDot, { backgroundColor: colors.danger }]} />
              <Text style={styles.areaChipText}>
                Expense:{' '}
                <Text style={styles.areaChipBold}>
                  {fam?.areas?.expense?.statusLabel || 'Not Set'}
                </Text>
              </Text>
            </View>

            <View style={[styles.areaChip, styles.investmentChipBg]}>
              <View style={[styles.chipDot, { backgroundColor: colors.investment }]} />
              <Text style={styles.areaChipText}>
                Invest:{' '}
                <Text style={styles.areaChipBold}>
                  {fam?.areas?.investment?.statusLabel || 'Not Set'}
                </Text>
              </Text>
            </View>
          </View>
        </View>

        {/* 3. Targets Overview Cards: Income, Expense, Investment */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>MONTHLY ALLOCATIONS</Text>
        </View>

        {/* Income Card */}
        <View style={styles.targetCard}>
          <View style={styles.targetCardHeader}>
            <View style={[styles.targetIconBox, { backgroundColor: colors.successBg }]}>
              <TrendingUpIcon size={18} color={colors.success} />
            </View>
            <View style={styles.targetTitleCol}>
              <Text style={styles.targetLabel}>Monthly Income</Text>
              <Text style={styles.targetAmountText}>
                {formatCurrency(targets?.income?.actual || 0)} /{' '}
                <Text style={styles.targetSubAmount}>
                  {formatCurrency(targets?.income?.target || 0)}
                </Text>
              </Text>
            </View>
            <View style={styles.targetPercentBox}>
              <Text style={[styles.targetPercentText, { color: colors.success }]}>
                {Math.round(targets?.income?.percent || 0)}%
              </Text>
            </View>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: colors.success,
                  width: `${Math.min(100, Math.max(0, targets?.income?.percent || 0))}%`,
                },
              ]}
            />
          </View>
          <View style={styles.targetFooterRow}>
            <Text style={styles.targetFooterText}>
              Remaining to Target:{' '}
              <Text style={styles.targetFooterBold}>
                {formatCurrency(targets?.income?.remaining || 0)}
              </Text>
            </Text>
          </View>
        </View>

        {/* Expense Card */}
        <View style={styles.targetCard}>
          <View style={styles.targetCardHeader}>
            <View style={[styles.targetIconBox, { backgroundColor: colors.dangerBg }]}>
              <TrendingDownIcon size={18} color={colors.danger} />
            </View>
            <View style={styles.targetTitleCol}>
              <Text style={styles.targetLabel}>Monthly Expenses</Text>
              <Text style={styles.targetAmountText}>
                {formatCurrency(targets?.expense?.actual || 0)} /{' '}
                <Text style={styles.targetSubAmount}>
                  {formatCurrency(targets?.expense?.target || 0)}
                </Text>
              </Text>
            </View>
            <View style={styles.targetPercentBox}>
              <Text style={[styles.targetPercentText, { color: colors.danger }]}>
                {Math.round(targets?.expense?.percent || 0)}%
              </Text>
            </View>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: colors.danger,
                  width: `${Math.min(100, Math.max(0, targets?.expense?.percent || 0))}%`,
                },
              ]}
            />
          </View>
          <View style={styles.targetFooterRow}>
            <Text style={styles.targetFooterText}>
              Remaining Budget:{' '}
              <Text style={styles.targetFooterBold}>
                {formatCurrency(targets?.expense?.remaining || 0)}
              </Text>
            </Text>
          </View>
        </View>

        {/* Investment Card */}
        <View style={styles.targetCard}>
          <View style={styles.targetCardHeader}>
            <View style={[styles.targetIconBox, { backgroundColor: colors.investmentBg }]}>
              <PiggyBankIcon size={18} color={colors.investment} />
            </View>
            <View style={styles.targetTitleCol}>
              <Text style={styles.targetLabel}>Monthly Investments</Text>
              <Text style={styles.targetAmountText}>
                {formatCurrency(targets?.investment?.actual || 0)} /{' '}
                <Text style={styles.targetSubAmount}>
                  {formatCurrency(targets?.investment?.target || 0)}
                </Text>
              </Text>
            </View>
            <View style={styles.targetPercentBox}>
              <Text style={[styles.targetPercentText, { color: colors.investment }]}>
                {Math.round(targets?.investment?.percent || 0)}%
              </Text>
            </View>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: colors.investment,
                  width: `${Math.min(100, Math.max(0, targets?.investment?.percent || 0))}%`,
                },
              ]}
            />
          </View>
          <View style={styles.targetFooterRow}>
            <Text style={styles.targetFooterText}>
              Remaining Target:{' '}
              <Text style={styles.targetFooterBold}>
                {formatCurrency(targets?.investment?.remaining || 0)}
              </Text>
            </Text>
          </View>
        </View>

        {/* 4. Category Breakdown Summary */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>
            {breakdownView === 'EXPENSE' ? 'EXPENSE BREAKDOWN' : 'INCOME BREAKDOWN'}
          </Text>
          <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 8, padding: 2 }}>
            <Pressable
              onPress={() => setBreakdownView('EXPENSE')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Show expense breakdown"
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: breakdownView === 'EXPENSE' ? '#FFFFFF' : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: breakdownView === 'EXPENSE' ? colors.danger : colors.textMuted,
                }}
              >
                Expenses
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setBreakdownView('INCOME')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Show income breakdown"
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: breakdownView === 'INCOME' ? '#FFFFFF' : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: breakdownView === 'INCOME' ? colors.success : colors.textMuted,
                }}
              >
                Income
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          {activeBreakdown.length === 0 ? (
            <View style={styles.emptyBreakdownBox}>
              <Text style={styles.emptyBreakdownText}>
                {breakdownView === 'EXPENSE'
                  ? 'No expense transactions recorded this month.'
                  : 'No income transactions recorded this month.'}
              </Text>
            </View>
          ) : (
            <View style={styles.breakdownList}>
              {activeBreakdown.map((item: any, index: number) => (
                <View key={item.categoryId || index} style={styles.breakdownRow}>
                  <View style={styles.breakdownInfoRow}>
                    <Text style={styles.breakdownCatName} numberOfLines={1}>
                      {item.categoryName}
                    </Text>
                    <Text style={styles.breakdownAmountText}>
                      {formatCurrency(item.amount)}{' '}
                      <Text style={styles.breakdownPercent}>({item.percentage}%)</Text>
                    </Text>
                  </View>
                  <View style={styles.breakdownBarTrack}>
                    <View
                      style={[
                        styles.breakdownBarFill,
                        {
                          width: `${Math.min(100, Math.max(0, item.percentage))}%`,
                          backgroundColor:
                            breakdownView === 'INCOME'
                              ? colors.success
                              : index % 3 === 0
                              ? colors.danger
                              : index % 3 === 1
                              ? colors.warning
                              : colors.investment,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 5. Account Summary Card */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>ACCOUNTS & NET WORTH</Text>
        </View>

        <Pressable
          onPress={() => navigation.navigate('Accounts')}
          style={({ pressed }) => [styles.accountSummaryCard, pressed && styles.cardPressed]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="View linked bank and investment accounts"
        >
          <View style={styles.accountCardHeader}>
            <View style={styles.accountIconBox}>
              <CreditCardIcon size={20} color={colors.primary} />
            </View>
            <View style={styles.accountTitleCol}>
              <Text style={styles.accountTitleLabel}>Total Net Worth</Text>
              <Text style={styles.accountBalanceText}>
                {formatCurrency(accountSummary?.totalBalance || 0)}
              </Text>
            </View>
            <View style={styles.chevronBox}>
              <ChevronRightIcon size={18} color={colors.textMuted} />
            </View>
          </View>
          <View style={styles.accountFooterRow}>
            <Text style={styles.activeAccountsCountText}>
              {accountSummary?.activeCount || 0} active financial account
              {accountSummary?.activeCount === 1 ? '' : 's'} linked
            </Text>
            <Text style={styles.manageAccountsLink}>Manage Accounts</Text>
          </View>
        </Pressable>

        {/* 6. Recent Transactions Card */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>RECENT ACTIVITY</Text>
        </View>

        <View style={styles.card}>
          {recentTransactions.length === 0 ? (
            <View style={styles.emptyRecentBox}>
              <View style={styles.emptyIconCircle}>
                <ReceiptIcon size={24} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyRecentTitle}>No transactions recorded</Text>
              <Text style={styles.emptyRecentSubtext}>
                Add transactions to track spending and income here.
              </Text>
              <Pressable
                onPress={() => navigation.navigate('AddTransactionModal')}
                style={({ pressed }) => [
                  styles.addTxnButton,
                  pressed && styles.buttonPressed,
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Record new transaction"
              >
                <PlusIcon size={14} color="#FFFFFF" />
                <Text style={styles.addTxnButtonText}>Add Transaction</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.recentList}>
              {recentTransactions.map((txn, index) => {
                const anyTxn = txn as any;
                const isIncome = anyTxn.type === 'INCOME' || anyTxn.direction === 'CREDIT';
                const isInvestment = anyTxn.type === 'INVESTMENT';
                const isTransfer = (anyTxn.type as string) === 'TRANSFER';
                const isLast = index === recentTransactions.length - 1;

                const chipBg = isIncome
                  ? colors.successBg
                  : isInvestment
                  ? colors.investmentBg
                  : isTransfer
                  ? colors.transferBg
                  : colors.dangerBg;

                const chipColor = isIncome
                  ? colors.success
                  : isInvestment
                  ? colors.investment
                  : isTransfer
                  ? colors.transfer
                  : colors.danger;

                return (
                  <View
                    key={anyTxn.id || index}
                    style={[styles.txnRow, !isLast && styles.txnRowBorder]}
                  >
                    <View style={styles.txnLeftCol}>
                      <Text style={styles.txnDescription} numberOfLines={1}>
                        {anyTxn.description || anyTxn.merchant || 'Transaction'}
                      </Text>
                      <View style={styles.txnMetaRow}>
                        <View style={[styles.txnChip, { backgroundColor: chipBg }]}>
                          <Text style={[styles.txnChipText, { color: chipColor }]}>
                            {anyTxn.type}
                          </Text>
                        </View>
                        {anyTxn.category?.name && (
                          <Text style={styles.txnCategoryName} numberOfLines={1}>
                            {anyTxn.category.name}
                          </Text>
                        )}
                        <Text style={styles.txnDateText}>
                          {formatDate(anyTxn.txnDate || anyTxn.date || anyTxn.createdAt)}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.txnAmountText,
                        { color: isIncome ? colors.success : colors.text },
                      ]}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(anyTxn.amount || 0)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 12,
    fontWeight: '500',
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
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    flex: 1,
    fontWeight: '500',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 44,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  securityBanner: {
    backgroundColor: colors.warningBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F9DBA5',
    gap: 10,
  },
  securityBannerHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  securityIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityTextContainer: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  securityDescription: {
    fontSize: 12,
    color: '#8A4B00',
    lineHeight: 17,
    marginTop: 2,
  },
  securityActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 44,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  securityActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.88,
  },
  famCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  famDetailsCol: {
    flex: 1,
  },
  famStatusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  healthBadge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  healthBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: 0.5,
  },
  famPeriodText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  famTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  famDescription: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: 4,
  },
  famReportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    minHeight: 44,
  },
  famReportLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  famDonutCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  famChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  areaChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  incomeChipBg: {
    backgroundColor: colors.successBg,
  },
  expenseChipBg: {
    backgroundColor: colors.dangerBg,
  },
  investmentChipBg: {
    backgroundColor: colors.investmentBg,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  areaChipText: {
    fontSize: 10,
    color: colors.text,
    fontWeight: '500',
  },
  areaChipBold: {
    fontWeight: '700',
  },
  sectionHeaderRow: {
    paddingHorizontal: 2,
    marginTop: 6,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  targetCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  targetCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  targetIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetTitleCol: {
    flex: 1,
  },
  targetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  targetAmountText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  targetSubAmount: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  targetPercentBox: {
    alignItems: 'flex-end',
  },
  targetPercentText: {
    fontSize: 15,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  targetFooterRow: {
    marginTop: 8,
  },
  targetFooterText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  targetFooterBold: {
    fontWeight: '700',
    color: colors.text,
  },
  emptyBreakdownBox: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyBreakdownText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  breakdownList: {
    gap: 10,
  },
  breakdownRow: {
    gap: 4,
  },
  breakdownInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownCatName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  breakdownAmountText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  breakdownPercent: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
  },
  breakdownBarTrack: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  breakdownBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  accountSummaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  accountCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountTitleCol: {
    flex: 1,
  },
  accountTitleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  accountBalanceText: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
    letterSpacing: -0.3,
  },
  chevronBox: {
    padding: 4,
  },
  accountFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  activeAccountsCountText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  manageAccountsLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyRecentBox: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRecentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  emptyRecentSubtext: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 16,
  },
  addTxnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 44,
    borderRadius: 10,
    marginTop: 4,
  },
  addTxnButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recentList: {
    gap: 0,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  txnRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  txnLeftCol: {
    flex: 1,
    marginRight: 10,
  },
  txnDescription: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  txnMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  txnChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  txnChipText: {
    fontSize: 9,
    fontWeight: '700',
  },
  txnCategoryName: {
    fontSize: 11,
    color: colors.textMuted,
    maxWidth: 100,
  },
  txnDateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  txnAmountText: {
    fontSize: 14,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
