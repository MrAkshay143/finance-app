import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@finance/shared-ui-tokens';
import { BrandedHeader } from '../../components/BrandedHeader';
import {
  ShieldCheckIcon,
  PieChartIcon,
  CalendarIcon,
  ReceiptIcon,
  AwardIcon,
  BarChartIcon,
  BookOpenIcon,
  CheckIcon,
  ChevronDownIcon,
  ShieldIcon,
  DollarSignIcon,
  RepeatIcon,
} from '../../components/icons';

interface StepGuide {
  num: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  icon: React.ReactNode;
}

export const AboutScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  const guideSteps: StepGuide[] = [
    {
      num: '1',
      title: 'Set up your basic profile & KBA',
      shortDesc: 'Configure personal details and security recovery questions',
      fullDesc:
        'Complete your profile details and set up 3 security questions for account recovery.',
      icon: <ShieldCheckIcon size={20} color={colors.primary} />,
    },
    {
      num: '2',
      title: 'Set your monthly budget & targets',
      shortDesc: 'Define earned income, expense ceiling, and investment target',
      fullDesc:
        'Set earned income baseline, living expense ceiling, and savings targets to power FAM scoring.',
      icon: <PieChartIcon size={20} color={colors.primary} />,
    },
    {
      num: '3',
      title: 'Tell the app your regular money items',
      shortDesc: 'Register recurring salaries, rent, and SIP schedules',
      fullDesc:
        'Add salary, rent, bills, and SIP investments under Recurring Transactions.',
      icon: <CalendarIcon size={20} color={colors.primary} />,
    },
    {
      num: '4',
      title: 'Record your transactions',
      shortDesc: 'Log income, expenses, investments, and transfers',
      fullDesc:
        'Record incoming and outgoing money across accounts with real-time categorization.',
      icon: <ReceiptIcon size={20} color={colors.primary} />,
    },
    {
      num: '5',
      title: 'Check your FAM score',
      shortDesc: 'Monitor expense discipline, investment rate, and income stability',
      fullDesc:
        'Check your 3-segment FAM score comparing actual monthly cash flow against targets.',
      icon: <AwardIcon size={20} color={colors.primary} />,
    },
    {
      num: '6',
      title: 'Plan ahead & review reports',
      shortDesc: 'Export monthly financial reports and simulate projections',
      fullDesc:
        'Configure category budgets, set milestone goals, and review monthly target variance reports.',
      icon: <BarChartIcon size={20} color={colors.primary} />,
    },
  ];

  const trustBadges = [
    {
      id: 'badge-1',
      title: 'Zero-Trust Security',
      desc: 'Multi-factor verification and KBA recovery with encrypted session handling.',
      icon: <ShieldIcon size={18} color={colors.primary} />,
    },
    {
      id: 'badge-2',
      title: 'Real Data Engine',
      desc: '100% authoritative calculations from the backend API with no placeholder numbers.',
      icon: <DollarSignIcon size={18} color={colors.success} />,
    },
    {
      id: 'badge-3',
      title: 'Automated Allocation',
      desc: 'Continuous FAM analysis measuring expenses, investments, and earnings against targets.',
      icon: <RepeatIcon size={18} color={colors.investment} />,
    },
  ];

  const v1Deliverables = [
    'Income, expenses, investments & transfers tracking across multiple accounts',
    'Financial Allocation Meter (FAM) monthly health grade',
    'Planned vs. Actual breakdowns with interactive donut visualizations',
    'Category budgets and long-term financial goals',
    'Deep analytics (savings rate, category breakdowns, 6-month trends)',
    'Due-date reminders for recurring expenses & investments',
    'Immutable audit trail of recorded transactions',
    'Account balances and net-worth views',
    'Automated CSV data import & export',
  ];

  return (
    <View style={styles.container}>
      <BrandedHeader
        variant="nested"
        title="About & Guide"
        subtitle="Platform architecture & methodology"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom > 0 ? insets.bottom + 24 : 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Block */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIconSquare}>
              <Text style={styles.heroIconText}>FT</Text>
            </View>
            <View style={styles.heroTextColumn}>
              <View style={styles.heroTitleRow}>
                <Text style={styles.heroTitle}>Finance Tracker V1.0</Text>
                <View style={styles.releaseBadge}>
                  <Text style={styles.releaseBadgeText}>Production Release</Text>
                </View>
              </View>
              <Text style={styles.heroSubtitle}>Institutional Personal Finance</Text>
            </View>
          </View>
          <Text style={styles.heroDescription}>
            Finance Tracker tracks income, expenses, and investments with real-time health grading via the Financial Allocation Meter (FAM).
          </Text>
        </View>

        {/* 3 Trust Badges */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>CORE ARCHITECTURAL PILLARS</Text>
          <View style={styles.badgesColumn}>
            {trustBadges.map((badge) => (
              <View key={badge.id} style={styles.badgeCard}>
                <View style={styles.badgeIconContainer}>{badge.icon}</View>
                <View style={styles.badgeTextColumn}>
                  <Text style={styles.badgeTitle}>{badge.title}</Text>
                  <Text style={styles.badgeDesc}>{badge.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 6-Step Interactive Guide */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <BookOpenIcon size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>HOW TO USE FINANCE TRACKER (6 STEPS)</Text>
          </View>

          <View style={styles.stepsCard}>
            {guideSteps.map((step, idx) => {
              const isActive = activeStepIndex === idx;
              const isLast = idx === guideSteps.length - 1;
              return (
                <View
                  key={step.num}
                  style={[
                    styles.stepRow,
                    !isLast && styles.stepRowBorder,
                    isActive && styles.stepRowActive,
                  ]}
                >
                  <Pressable
                    onPress={() => setActiveStepIndex(idx)}
                    accessible={true}
                    style={styles.stepHeaderPressable}
                    accessibilityRole="button"
                    accessibilityLabel={`Step ${step.num}: ${step.title}`}
                  >
                    <View
                      style={[
                        styles.stepBadge,
                        isActive && styles.stepBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepBadgeText,
                          isActive && styles.stepBadgeTextActive,
                        ]}
                      >
                        {step.num}
                      </Text>
                    </View>
                    <View style={styles.stepTitleColumn}>
                      <Text style={styles.stepTitleText}>{step.title}</Text>
                      <Text style={styles.stepShortDesc}>{step.shortDesc}</Text>
                    </View>
                    <View
                      style={[
                        styles.expandChevron,
                        isActive && styles.expandChevronActive,
                      ]}
                    >
                      <ChevronDownIcon size={16} color={isActive ? colors.primary : colors.textMuted} />
                    </View>
                  </Pressable>

                  {isActive && (
                    <View style={styles.stepExpandedBody}>
                      <Text style={styles.stepFullDescText}>{step.fullDesc}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* FAM Score Methodology */}
        <View style={styles.famCard}>
          <View style={styles.famHeaderRow}>
            <AwardIcon size={20} color={colors.primary} />
            <Text style={styles.famCardTitle}>FAM Score Calculation Rules</Text>
          </View>
          <Text style={styles.famIntroText}>
            The Financial Allocation Meter compares actual monthly movements against configured targets:
          </Text>

          <View style={styles.famRulesList}>
            {/* Expense rule */}
            <View style={styles.ruleItem}>
              <Text style={styles.ruleLabel}>1. Expense Grade (Lower is Better)</Text>
              <Text style={styles.ruleFormula}>Ratio = actual living expenses ÷ expense target</Text>
              <View style={styles.tierRow}>
                <View style={[styles.tierChip, styles.tierChipSuccess]}>
                  <Text style={styles.tierChipSuccessText}>≤ 80%: A+ · Excellent</Text>
                </View>
                <View style={[styles.tierChip, styles.tierChipWarning]}>
                  <Text style={styles.tierChipWarningText}>81–100%: B · Good</Text>
                </View>
                <View style={[styles.tierChip, styles.tierChipDanger]}>
                  <Text style={styles.tierChipDangerText}>&gt; 100%: C · Poor</Text>
                </View>
              </View>
            </View>

            {/* Investment rule */}
            <View style={styles.ruleItem}>
              <Text style={styles.ruleLabel}>2. Investment Grade (Higher is Better)</Text>
              <Text style={styles.ruleFormula}>Ratio = actual invested amount ÷ investment target</Text>
              <View style={styles.tierRow}>
                <View style={[styles.tierChip, styles.tierChipSuccess]}>
                  <Text style={styles.tierChipSuccessText}>≥ 100%: A+ · Excellent</Text>
                </View>
                <View style={[styles.tierChip, styles.tierChipWarning]}>
                  <Text style={styles.tierChipWarningText}>70–99%: B · Good</Text>
                </View>
                <View style={[styles.tierChip, styles.tierChipDanger]}>
                  <Text style={styles.tierChipDangerText}>&lt; 70%: C · Poor</Text>
                </View>
              </View>
            </View>

            {/* Income rule */}
            <View style={styles.ruleItem}>
              <Text style={styles.ruleLabel}>3. Income Grade (Higher is Better)</Text>
              <Text style={styles.ruleFormula}>Ratio = actual earned income ÷ income target</Text>
              <View style={styles.tierRow}>
                <View style={[styles.tierChip, styles.tierChipSuccess]}>
                  <Text style={styles.tierChipSuccessText}>≥ 100%: A+ · Excellent</Text>
                </View>
                <View style={[styles.tierChip, styles.tierChipWarning]}>
                  <Text style={styles.tierChipWarningText}>70–99%: B · Good</Text>
                </View>
                <View style={[styles.tierChip, styles.tierChipDanger]}>
                  <Text style={styles.tierChipDangerText}>&lt; 70%: C · Poor</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.famFooterNote}>
            <Text style={styles.famFooterText}>
              Overall Health Rule: Determined by the{' '}
              <Text style={styles.famFooterBold}>worst-of-three rule</Text> (if any pillar is C →
              C · Poor; else if any is B → B · Good; else A+ · Excellent).
            </Text>
          </View>
        </View>

        {/* Full V1 Deliverables List */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>WHAT FINANCE TRACKER DELIVERS IN V1</Text>
          <View style={styles.card}>
            {v1Deliverables.map((item, index) => {
              const isLast = index === v1Deliverables.length - 1;
              return (
                <View
                  key={item}
                  style={[
                    styles.deliverableRow,
                    !isLast && styles.rowBorder,
                  ]}
                >
                  <View style={styles.checkCircle}>
                    <CheckIcon size={14} color={colors.success} />
                  </View>
                  <Text style={styles.deliverableText}>{item}</Text>
                </View>
              );
            })}
          </View>
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
  content: {
    padding: 16,
    gap: 18,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: colors.navyHeaderStart,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: colors.navyHeaderStart,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIconSquare: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  heroTextColumn: {
    flex: 1,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  releaseBadge: {
    backgroundColor: 'rgba(31, 157, 85, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success,
  },
  releaseBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DFF5E6',
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#DCE7FF',
    marginTop: 2,
  },
  heroDescription: {
    fontSize: 12,
    color: '#E0E7FF',
    lineHeight: 18,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 12,
  },
  sectionContainer: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  badgesColumn: {
    gap: 8,
  },
  badgeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  badgeIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTextColumn: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  badgeDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  stepRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  stepRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepRowActive: {
    backgroundColor: '#F8FAFC',
  },
  stepHeaderPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
    gap: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeActive: {
    backgroundColor: colors.primary,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  stepBadgeTextActive: {
    color: '#FFFFFF',
  },
  stepTitleColumn: {
    flex: 1,
  },
  stepTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  stepShortDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  expandChevron: {
    width: 20,
    alignItems: 'center',
  },
  expandChevronActive: {
    transform: [{ rotate: '180deg' }],
  },
  stepExpandedBody: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingLeft: 40,
  },
  stepFullDescText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
  },
  famCard: {
    backgroundColor: '#F0F5FF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D0E0FD',
    gap: 12,
  },
  famHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  famCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  famIntroText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  famRulesList: {
    gap: 10,
  },
  ruleItem: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DCE7FF',
    gap: 6,
  },
  ruleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  ruleFormula: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  tierRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  tierChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tierChipSuccess: {
    backgroundColor: colors.successBg,
  },
  tierChipSuccessText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  tierChipWarning: {
    backgroundColor: colors.warningBg,
  },
  tierChipWarningText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.warning,
  },
  tierChipDanger: {
    backgroundColor: colors.dangerBg,
  },
  tierChipDangerText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.danger,
  },
  famFooterNote: {
    borderTopWidth: 1,
    borderTopColor: '#D0E0FD',
    paddingTop: 8,
  },
  famFooterText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
  famFooterBold: {
    fontWeight: '700',
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  deliverableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliverableText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
    lineHeight: 16,
  },
});
