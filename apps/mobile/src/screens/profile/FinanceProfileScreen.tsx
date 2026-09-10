import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '@finance/shared-ui-tokens';
import type {
  FinanceProfile,
  RiskAppetite,
  InvestmentHorizon,
} from '@finance/shared-types';
import {
  DollarSignIcon,
  ShieldIcon,
  SaveIcon,
  CheckIcon,
  AlertCircleIcon,
  InfoIcon,
} from '../../components/icons';
import { BrandedHeader } from '../../components/BrandedHeader';
import { apiClient } from '../../services/apiClient';
import { useUserCurrency } from '../../hooks/useUserCurrency';
import type { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const FinanceProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { symbol: userSymbol } = useUserCurrency();

  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [expenseBudget, setExpenseBudget] = useState('');
  const [investmentTarget, setInvestmentTarget] = useState('');
  const [savingsTargetPercentage, setSavingsTargetPercentage] = useState('');
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetite>('MEDIUM');
  const [investmentHorizon, setInvestmentHorizon] = useState<InvestmentHorizon>('MEDIUM');

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadFinanceProfile = async () => {
      setIsLoading(true);
      try {
        const data: FinanceProfile = await apiClient.profile.getFinanceProfile();
        if (data.monthlyIncome !== undefined) {
          setMonthlyIncome(String(data.monthlyIncome));
        }
        if (data.monthlyExpenseBudget !== undefined) {
          setExpenseBudget(String(data.monthlyExpenseBudget));
        }
        if (data.monthlyInvestmentTarget !== undefined) {
          setInvestmentTarget(String(data.monthlyInvestmentTarget));
        }
        if (data.savingsTargetPercentage !== undefined) {
          setSavingsTargetPercentage(String(data.savingsTargetPercentage));
        }
        if (data.riskAppetite) {
          setRiskAppetite(data.riskAppetite);
        }
        if (data.investmentHorizon) {
          setInvestmentHorizon(data.investmentHorizon);
        }
      } catch {
        // Retain default financial targets if profile fetch fails
      } finally {
        setIsLoading(false);
      }
    };

    void loadFinanceProfile();
  }, []);

  const handleSave = async () => {
    setErrorMessage(null);
    setSaveSuccess(false);

    const incomeNum = parseFloat(monthlyIncome);
    const expenseNum = parseFloat(expenseBudget);
    const investNum = parseFloat(investmentTarget);
    const savingsPct = parseFloat(savingsTargetPercentage);

    if (isNaN(incomeNum) || incomeNum < 0) {
      setErrorMessage('Monthly income must be a valid positive number.');
      return;
    }

    if (isNaN(expenseNum) || expenseNum < 0) {
      setErrorMessage('Monthly expense budget must be a valid positive number.');
      return;
    }

    if (isNaN(investNum) || investNum < 0) {
      setErrorMessage('Monthly investment target must be a valid positive number.');
      return;
    }

    if (isNaN(savingsPct) || savingsPct < 0 || savingsPct > 100) {
      setErrorMessage('Savings target percentage must be between 0 and 100.');
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.profile.updateFinanceProfile({
        monthlyIncome: incomeNum,
        monthlyIncomeTarget: incomeNum,
        monthlyExpenseBudget: expenseNum,
        monthlyInvestmentTarget: investNum,
        savingsTargetPercentage: savingsPct,
        riskAppetite,
        investmentHorizon,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to update financial profile. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BrandedHeader
        variant="nested"
        title="Finance Profile"
        subtitle="Monthly targets and allocation baselines"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom + 28 : 36,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null}

        {/* Feedback Banners */}
        {saveSuccess ? (
          <View style={styles.successBanner}>
            <CheckIcon size={18} color={colors.success} />
            <Text style={styles.successBannerText}>Financial targets updated successfully.</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <AlertCircleIcon size={18} color={colors.danger} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Card 1: Monthly Baseline Targets */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.headerIconSquare, { backgroundColor: '#EFF4FF' }]}>
              <DollarSignIcon size={20} color="#2554EE" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Monthly Baseline Targets</Text>
              <Text style={styles.cardSubtitle}>Core parameters for FAM score calculations</Text>
            </View>
          </View>

          {/* Monthly Income Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Expected Monthly Income ({userSymbol})</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <DollarSignIcon size={16} color={colors.textMuted} />
              </View>
              <TextInput
                style={styles.textInput}
                value={monthlyIncome}
                onChangeText={setMonthlyIncome}
                placeholder="50000"
                placeholderTextColor="#98A2B3"
                keyboardType="numeric"
                accessibilityLabel="Expected Monthly Income"
              />
            </View>
            <Text style={styles.helperText}>Baseline for income grade and capacity benchmark.</Text>
          </View>

          {/* Monthly Expense Budget */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Monthly Expense Budget ({userSymbol})</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <DollarSignIcon size={16} color={colors.textMuted} />
              </View>
              <TextInput
                style={styles.textInput}
                value={expenseBudget}
                onChangeText={setExpenseBudget}
                placeholder="25000"
                placeholderTextColor="#98A2B3"
                keyboardType="numeric"
                accessibilityLabel="Monthly Expense Budget"
              />
            </View>
            <Text style={styles.helperText}>Benchmark for 50/30 needs and wants envelope.</Text>
          </View>

          {/* Monthly Investment Target */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Monthly Investment Target ({userSymbol})</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <DollarSignIcon size={16} color={colors.textMuted} />
              </View>
              <TextInput
                style={styles.textInput}
                value={investmentTarget}
                onChangeText={setInvestmentTarget}
                placeholder="15000"
                placeholderTextColor="#98A2B3"
                keyboardType="numeric"
                accessibilityLabel="Monthly Investment Target"
              />
            </View>
            <Text style={styles.helperText}>Monthly allocation for mutual funds, equity, and PPF.</Text>
          </View>

          {/* Savings Target Percentage */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Savings Target (%)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={savingsTargetPercentage}
                onChangeText={setSavingsTargetPercentage}
                placeholder="20"
                placeholderTextColor="#98A2B3"
                keyboardType="numeric"
                accessibilityLabel="Savings Target Percentage"
              />
              <Text style={styles.percentSuffix}>%</Text>
            </View>
            <Text style={styles.helperText}>Recommended target: 20% or higher.</Text>
          </View>
        </View>

        {/* Card 2: Financial Preferences & Risk Profile */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.headerIconSquare, { backgroundColor: '#F4EBFF' }]}>
              <ShieldIcon size={20} color="#7C4DE0" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Investment Preferences</Text>
              <Text style={styles.cardSubtitle}>Risk tolerance and planning horizon</Text>
            </View>
          </View>

          {/* Risk Appetite Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Risk Tolerance</Text>
            <View style={styles.segmentedControl}>
              {(
                [
                  { key: 'LOW', label: 'Conservative' },
                  { key: 'MEDIUM', label: 'Moderate' },
                  { key: 'HIGH', label: 'Aggressive' },
                ] as const
              ).map((item) => {
                const isSelected = riskAppetite === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setRiskAppetite(item.key)}
                    style={[
                      styles.segmentButton,
                      isSelected && styles.segmentButtonActive,
                    ]}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        isSelected && styles.segmentTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Investment Horizon Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Investment Horizon</Text>
            <View style={styles.segmentedControl}>
              {(
                [
                  { key: 'SHORT', label: 'Short (< 2 yrs)' },
                  { key: 'MEDIUM', label: 'Medium (2-5 yrs)' },
                  { key: 'LONG', label: 'Long (> 5 yrs)' },
                ] as const
              ).map((item) => {
                const isSelected = investmentHorizon === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setInvestmentHorizon(item.key)}
                    style={[
                      styles.segmentButton,
                      isSelected && styles.segmentButtonActive,
                    ]}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        isSelected && styles.segmentTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Advisory Notice */}
          <View style={styles.infoCallout}>
            <InfoIcon size={16} color={colors.primary} />
            <Text style={styles.infoCalloutText}>
              These parameters feed into your FAM health score and monthly spending analysis.
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          style={({ pressed }) => [
            styles.saveButton,
            pressed && styles.buttonPressed,
            isSaving && styles.buttonDisabled,
          ]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Save Financial Targets"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.saveButtonContent}>
              <SaveIcon size={18} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Financial Targets</Text>
            </View>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  loaderContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#A6F4C5',
    gap: 8,
  },
  successBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FECDCA',
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.danger,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  headerIconSquare: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },
  percentSuffix: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  helperText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
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
    fontWeight: '700',
  },
  infoCallout: {
    flexDirection: 'row',
    backgroundColor: '#EFF4FF',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    alignItems: 'flex-start',
  },
  infoCalloutText: {
    flex: 1,
    fontSize: 12,
    color: colors.primary,
    lineHeight: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
