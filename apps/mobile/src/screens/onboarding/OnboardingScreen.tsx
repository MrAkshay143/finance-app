import React, { useState } from 'react';
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
import {
  DollarSignIcon,
  ShieldIcon,
  CheckIcon,
  ArrowRightIcon,
  UserIcon,
} from '../../components/icons';
import { apiClient } from '../../services/apiClient';
import { useAuthStore } from '../../store/authStore';
import { useUserCurrency } from '../../hooks/useUserCurrency';
import type { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const OnboardingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { user, setUser } = useAuthStore();
  const { symbol: userSymbol } = useUserCurrency();

  const [step, setStep] = useState<1 | 2>(1);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [expenseBudget, setExpenseBudget] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinueToStep2 = () => {
    setError(null);
    const incomeNum = parseFloat(monthlyIncome);
    if (!monthlyIncome || isNaN(incomeNum) || incomeNum <= 0) {
      setError('Please enter your expected monthly income.');
      return;
    }
    const expenseNum = parseFloat(expenseBudget);
    if (!expenseBudget || isNaN(expenseNum) || expenseNum < 0) {
      setError('Please enter your expected monthly expense budget.');
      return;
    }
    setStep(2);
  };

  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
    try {
      const incomeNum = parseFloat(monthlyIncome) || 0;
      const expenseNum = parseFloat(expenseBudget) || 0;

      await apiClient.profile.updateFinanceProfile({
        monthlyIncome: incomeNum,
        monthlyExpenseBudget: expenseNum,
        monthlyInvestmentTarget: Math.round(incomeNum * 0.2),
      });

      if (user) {
        setUser({ ...user, onboardingCompleted: true });
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to save onboarding preferences. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top > 0 ? insets.top + 28 : 40,
            paddingBottom: insets.bottom > 0 ? insets.bottom + 24 : 32,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Badge */}
        <View style={styles.headerBlock}>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>GETTING STARTED</Text>
          </View>
          <Text style={styles.headerTitle}>Welcome to Finance Tracker</Text>
          <Text style={styles.headerSubtitle}>
            Set your monthly baselines to activate financial tracking.
          </Text>
        </View>

        {step === 1 ? (
          <View style={styles.card}>
            <View style={styles.stepIndicatorRow}>
              <Text style={styles.stepIndicator}>STEP 1 OF 2: BASELINE BUDGET</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Monthly Expected Income ({userSymbol})</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <DollarSignIcon size={16} color={colors.textMuted} />
                </View>
                <TextInput
                  style={styles.textInput}
                  value={monthlyIncome}
                  onChangeText={(val) => {
                    setMonthlyIncome(val);
                    setError(null);
                  }}
                  placeholder="e.g. 50000"
                  placeholderTextColor="#98A2B3"
                  keyboardType="numeric"
                  accessibilityLabel="Monthly Income"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Monthly Expense Budget ({userSymbol})</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <DollarSignIcon size={16} color={colors.textMuted} />
                </View>
                <TextInput
                  style={styles.textInput}
                  value={expenseBudget}
                  onChangeText={(val) => {
                    setExpenseBudget(val);
                    setError(null);
                  }}
                  placeholder="e.g. 25000"
                  placeholderTextColor="#98A2B3"
                  keyboardType="numeric"
                  accessibilityLabel="Monthly Expense Budget"
                />
              </View>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable
              onPress={handleContinueToStep2}
              style={styles.primaryButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Continue to Security Step"
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
              <ArrowRightIcon size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.stepIndicatorRow}>
              <Text style={styles.stepIndicator}>STEP 2 OF 2: SECURITY READY</Text>
            </View>

            <View style={styles.securityHighlightBox}>
              <View style={styles.shieldSquare}>
                <ShieldIcon size={24} color="#2554EE" />
              </View>
              <View style={styles.securityTextContainer}>
                <Text style={styles.securityTitle}>Account Recovery Setup</Text>
                <Text style={styles.securityDescription}>
                  Set up 3 security questions now or configure them later in Settings.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => navigation.navigate('SecurityQuestions')}
              style={styles.secondaryButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Setup Security Questions Now"
            >
              <ShieldIcon size={16} color={colors.primary} />
              <Text style={styles.secondaryButtonText}>Setup Security Questions Now</Text>
            </Pressable>

            <Pressable
              onPress={handleFinishOnboarding}
              disabled={isSubmitting}
              style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Complete Onboarding and Go to Dashboard"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
                  <CheckIcon size={18} color="#FFFFFF" />
                </>
              )}
            </Pressable>
          </View>
        )}
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
    justifyContent: 'center',
    gap: 20,
  },
  headerBlock: {
    alignItems: 'center',
    textAlign: 'center',
  },
  badgePill: {
    backgroundColor: '#EFF4FF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 320,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    gap: 16,
  },
  stepIndicatorRow: {
    marginBottom: 4,
  },
  stepIndicator: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
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
    height: 48,
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
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  securityHighlightBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF4FF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'flex-start',
    gap: 12,
  },
  shieldSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCE7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityTextContainer: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  securityDescription: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    height: 46,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginTop: -4,
  },
});
