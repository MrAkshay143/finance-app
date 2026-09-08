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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@finance/shared-ui-tokens';
import type { AiAnalysisResponse } from '@finance/shared-types';
import { apiClient } from '../../services/apiClient';
import {
  ChevronLeftIcon,
  SparklesIcon,
  CalendarIcon,
  ChevronDownIcon,
  CheckIcon,
  TrendingUpIcon,
  LightbulbIcon,
  TargetIcon,
  InfoIcon,
} from '../../components/icons';
import { formatCurrency } from '../../utils/currency';

export { formatCurrency };

const generateMonthCycles = (): { value: string; label: string }[] => {
  const cycles: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = String(d.getMonth() + 1).padStart(2, '0');
    const value = `${d.getFullYear()}-${monthStr}`;
    const monthName = d.toLocaleString('en-IN', { month: 'short' });
    const label = i === 0 ? `${monthName} ${d.getFullYear()} (current)` : `${monthName} ${d.getFullYear()}`;
    cycles.push({ value, label });
  }
  return cycles;
};

const MONTH_CYCLES = generateMonthCycles();

export const AiAnalysisScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    MONTH_CYCLES[0]?.value ?? new Date().toISOString().slice(0, 7)
  );
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState<boolean>(false);
  const [analysisData, setAnalysisData] = useState<AiAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const fetchAnalysis = useCallback(async (monthToFetch?: string) => {
    try {
      const data = await apiClient.aiAnalysis.get(monthToFetch || selectedMonth);
      setAnalysisData(data);
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsAnalyzing(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    setIsLoading(true);
    void fetchAnalysis();
  }, [fetchAnalysis]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    void fetchAnalysis();
  }, [fetchAnalysis]);

  const handleAnalysePress = () => {
    setIsAnalyzing(true);
    void fetchAnalysis(selectedMonth);
  };

  const currentMonthLabel =
    MONTH_CYCLES.find((m) => m.value === selectedMonth)?.label ?? selectedMonth;

  const monthlyAnalysis = analysisData?.monthlyAnalysis ?? {
    earned: 0,
    earnedPaise: 0,
    spent: 0,
    spentPaise: 0,
    invested: 0,
    investedPaise: 0,
    netSavings: 0,
    netSavingsPaise: 0,
    needsRatio: 0,
    investmentRatio: 0,
    savingsRate: 0,
    benchmarks: {
      needsTarget: 50,
      wantsTarget: 30,
      savingsAndInvestmentTarget: 20,
    },
  };

  const forwardProjections = analysisData?.forwardProjections ?? [];
  const suggestions = analysisData?.suggestions ?? [];

  const getPriorityStyle = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'HIGH':
        return { bg: '#FEF2F2', text: colors.danger };
      case 'MEDIUM':
        return { bg: '#FFFBEB', text: colors.warning };
      default:
        return { bg: '#F0FDF4', text: colors.success };
    }
  };

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
              <Text style={styles.headerTitle}>AI Analysis</Text>
              <Text style={styles.headerSubtitle}>Automated allocation & wealth projections</Text>
            </View>
          </View>

          {/* Status Chip: Financial Intelligence */}
          <View style={styles.statusChip}>
            <SparklesIcon size={12} color={colors.primary} />
            <Text style={styles.statusChipText}>Financial Intelligence</Text>
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
        {/* Month Selector & Analyse Action Button */}
        <View style={styles.controlCard}>
          <View style={styles.monthSelectorSection}>
            <Pressable
              onPress={() => setIsMonthPickerOpen((prev) => !prev)}
              style={styles.monthSelectorButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Select analysis cycle"
            >
              <View style={styles.monthSelectorLeft}>
                <CalendarIcon size={18} color={colors.primary} />
                <View>
                  <Text style={styles.controlSub}>ANALYSIS CYCLE</Text>
                  <Text style={styles.controlTitle}>{currentMonthLabel}</Text>
                </View>
              </View>
              <ChevronDownIcon size={18} color={colors.textMuted} />
            </Pressable>

            {isMonthPickerOpen && (
              <View style={styles.dropdown}>
                {MONTH_CYCLES.map((cycle) => {
                  const isCurrent = cycle.value === selectedMonth;
                  return (
                    <Pressable
                      key={cycle.value}
                      onPress={() => {
                        setSelectedMonth(cycle.value);
                        setIsMonthPickerOpen(false);
                      }}
                      style={[styles.dropdownItem, isCurrent && styles.dropdownItemActive]}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${cycle.label}`}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isCurrent && styles.dropdownItemTextActive,
                        ]}
                      >
                        {cycle.label}
                      </Text>
                      {isCurrent && <CheckIcon size={16} color={colors.primary} />}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <Pressable
            onPress={handleAnalysePress}
            disabled={isAnalyzing}
            style={({ pressed }) => [
              styles.analyseButton,
              pressed && styles.analyseButtonPressed,
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Analyse"
          >
            {isAnalyzing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <SparklesIcon size={16} color="#FFFFFF" />
                <Text style={styles.analyseButtonText}>Analyse</Text>
              </>
            )}
          </Pressable>
        </View>

        {isLoading && !analysisData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Running financial intelligence model...</Text>
          </View>
        ) : (
          <>
            {/* Monthly Analysis Card */}
            <View style={styles.analysisCard}>
              <View style={styles.analysisCardHeader}>
                <View style={styles.sparkleBadge}>
                  <SparklesIcon size={16} color={colors.primary} />
                </View>
                <View style={styles.analysisCardTitleWrap}>
                  <Text style={styles.analysisCardTitle}>Monthly Allocation Health</Text>
                  <Text style={styles.analysisCardSub}>
                    {analysisData?.summaryNote || '50/30/20 target distribution evaluation'}
                  </Text>
                </View>
              </View>

              {/* 4 Allocation Metrics: Income, Expenses, Investments, Savings Rate */}
              <View style={styles.allocationGrid}>
                {/* Income */}
                <View style={styles.allocationBox}>
                  <Text style={styles.allocationLabel}>Income</Text>
                  <Text style={[styles.allocationValue, { color: colors.success }]}>
                    {formatCurrency(monthlyAnalysis.earned)}
                  </Text>
                  <Text style={styles.allocationSub}>100% Inflow</Text>
                </View>

                {/* Expenses */}
                <View style={styles.allocationBox}>
                  <Text style={styles.allocationLabel}>Expenses</Text>
                  <Text style={[styles.allocationValue, { color: colors.danger }]}>
                    {formatCurrency(monthlyAnalysis.spent)}
                  </Text>
                  <Text style={styles.allocationSub}>{Math.round(monthlyAnalysis.needsRatio)}% of earned</Text>
                </View>

                {/* Investments */}
                <View style={styles.allocationBox}>
                  <Text style={styles.allocationLabel}>Investments</Text>
                  <Text style={[styles.allocationValue, { color: colors.investment }]}>
                    {formatCurrency(monthlyAnalysis.invested)}
                  </Text>
                  <Text style={styles.allocationSub}>{Math.round(monthlyAnalysis.investmentRatio)}% allocation</Text>
                </View>

                {/* Savings Rate */}
                <View style={styles.allocationBox}>
                  <Text style={styles.allocationLabel}>Savings Rate</Text>
                  <Text style={[styles.allocationValue, { color: colors.primary }]}>
                    {Math.round(monthlyAnalysis.savingsRate)}%
                  </Text>
                  <Text style={styles.allocationSub}>Target: {monthlyAnalysis.benchmarks?.savingsAndInvestmentTarget || 20}%</Text>
                </View>
              </View>
            </View>

            {/* Forward Projection Card (3, 6, 12 Month Projections) */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <TrendingUpIcon size={18} color={colors.primary} />
                  <Text style={styles.sectionHeading}>FORWARD WEALTH PROJECTIONS</Text>
                </View>
                <Text style={styles.sectionSubHeading}>Compound Growth</Text>
              </View>

              <Text style={styles.projectionExplainer}>
                Projected wealth based on steady savings and compounding returns.
              </Text>

              {forwardProjections.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Projection metrics are calculating...</Text>
                </View>
              ) : (
                <View style={styles.projectionsList}>
                  {forwardProjections.map((proj, idx) => {
                    const savings = proj.projectedSavings ?? (proj.projectedSavingsPaise ? proj.projectedSavingsPaise / 100 : 0);
                    const wealth = proj.projectedWealth ?? (proj.projectedWealthPaise ? proj.projectedWealthPaise / 100 : 0);
                    return (
                      <View key={proj.label ?? `proj-${idx}`} style={styles.projectionRow}>
                        <View style={styles.projectionLeft}>
                          <Text style={styles.projectionHorizon}>{proj.label}</Text>
                          <Text style={styles.projectionSub}>
                            Return rate: {proj.assumedAnnualReturnRate}% p.a.
                          </Text>
                        </View>
                        <View style={styles.projectionRight}>
                          <Text style={styles.projectionWealth}>{formatCurrency(wealth)}</Text>
                          <Text style={styles.projectionSavings}>
                            +{formatCurrency(savings)} net saved
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Actionable Personalized Suggestions Cards */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <LightbulbIcon size={18} color={colors.warning} />
                  <Text style={styles.sectionHeading}>TAILORED RECOMMENDATIONS</Text>
                </View>
                <Text style={styles.sectionSubHeading}>{suggestions.length} Actions</Text>
              </View>

              {suggestions.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No immediate optimization actions required.</Text>
                </View>
              ) : (
                <View style={styles.suggestionsList}>
                  {suggestions.map((sug, idx) => {
                    const priorityStyle = getPriorityStyle(sug.priority);
                    const impactPaise = sug.potentialImpactPaise ? sug.potentialImpactPaise / 100 : null;
                    return (
                      <View key={sug.id ?? `sug-${idx}`} style={styles.suggestionCard}>
                        <View style={styles.suggestionHeader}>
                          <View
                            style={[
                              styles.priorityBadge,
                              { backgroundColor: priorityStyle.bg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.priorityBadgeText,
                                { color: priorityStyle.text },
                              ]}
                            >
                              {sug.priority} PRIORITY
                            </Text>
                          </View>
                          <Text style={styles.suggestionCategory}>{sug.category}</Text>
                        </View>

                        <Text style={styles.suggestionTitle}>{sug.title}</Text>
                        <Text style={styles.suggestionDescription}>{sug.description}</Text>

                        {impactPaise !== null && impactPaise > 0 && (
                          <View style={styles.impactRow}>
                            <TargetIcon size={14} color={colors.success} />
                            <Text style={styles.impactText}>
                              Potential upside: {formatCurrency(impactPaise)}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* How It Works Card: 50/30/20 Rule */}
            <View style={styles.howItWorksCard}>
              <View style={styles.howItWorksHeader}>
                <InfoIcon size={18} color={colors.primary} />
                <Text style={styles.howItWorksTitle}>How Financial Intelligence Works</Text>
              </View>

              <Text style={styles.howItWorksDescription}>
                Cash flow benchmarked against the 50/30/20 rule:
              </Text>

              <View style={styles.ruleItem}>
                <View style={[styles.ruleBullet, { backgroundColor: colors.danger }]} />
                <Text style={styles.ruleText}>
                  <Text style={styles.ruleBold}>50% Needs: </Text>
                  Housing, utilities, groceries, and essential expenses.
                </Text>
              </View>

              <View style={styles.ruleItem}>
                <View style={[styles.ruleBullet, { backgroundColor: colors.warning }]} />
                <Text style={styles.ruleText}>
                  <Text style={styles.ruleBold}>30% Wants: </Text>
                  Dining out, leisure, and discretionary lifestyle spend.
                </Text>
              </View>

              <View style={styles.ruleItem}>
                <View style={[styles.ruleBullet, { backgroundColor: colors.investment }]} />
                <Text style={styles.ruleText}>
                  <Text style={styles.ruleBold}>20% Savings & Assets: </Text>
                  Investments, emergency savings, and debt payoff.
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
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  controlCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  monthSelectorSection: {
    position: 'relative',
  },
  monthSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  monthSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  controlSub: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  controlTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  dropdown: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    minHeight: 44,
  },
  dropdownItemActive: {
    backgroundColor: colors.background,
  },
  dropdownItemText: {
    fontSize: 13,
    color: colors.text,
  },
  dropdownItemTextActive: {
    fontWeight: '700',
    color: colors.primary,
  },
  analyseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    minHeight: 44,
  },
  analyseButtonPressed: {
    opacity: 0.85,
  },
  analyseButtonText: {
    fontSize: 13,
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
  analysisCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 14,
  },
  analysisCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sparkleBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisCardTitleWrap: {
    flex: 1,
  },
  analysisCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  analysisCardSub: {
    fontSize: 11,
    color: colors.textMuted,
  },
  allocationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allocationBox: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  allocationLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  allocationValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  allocationSub: {
    fontSize: 10,
    color: colors.textMuted,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  projectionExplainer: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  emptyContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  projectionsList: {
    gap: 8,
  },
  projectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderRadius: 10,
  },
  projectionLeft: {
    gap: 2,
  },
  projectionHorizon: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  projectionSub: {
    fontSize: 10,
    color: colors.textMuted,
  },
  projectionRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  projectionWealth: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  projectionSavings: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.success,
  },
  suggestionsList: {
    gap: 10,
  },
  suggestionCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  suggestionCategory: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  suggestionDescription: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  impactText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  howItWorksCard: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  howItWorksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  howItWorksTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  howItWorksDescription: {
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 18,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  ruleBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  ruleText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
  },
  ruleBold: {
    fontWeight: '700',
  },
});
