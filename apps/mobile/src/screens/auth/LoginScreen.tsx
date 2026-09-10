import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '@finance/shared-ui-tokens';
import {
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  AlertCircleIcon,
  ArrowRightIcon,
} from '../../components/icons';
import { useAuthStore } from '../../store/authStore';
import type { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { login, isLoading, error: storeError, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    setValidationError(null);
    clearError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setValidationError('Email address is required.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setValidationError('Please enter a valid email address.');
      return false;
    }

    if (!password) {
      setValidationError('Password is required.');
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const response = await login({
        email: email.trim().toLowerCase(),
        password,
      });
      const dest = response?.user?.onboardingCompleted ? 'MainTabs' : 'Onboarding';
      navigation.reset({
        index: 0,
        routes: [{ name: dest as any }],
      });
    } catch {
      // Rely on auth store reactive error state for screen error banner
    }
  };

  const activeError = validationError || storeError;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingTop: insets.top > 0 ? insets.top + 24 : 36,
            paddingBottom: insets.bottom > 0 ? insets.bottom + 24 : 32,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header Banner */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>FT</Text>
          </View>
          <Text style={styles.brandTitle}>Finance Tracker</Text>
          <Text style={styles.brandSubtitle}>Personal Finance Management System</Text>
        </View>

        {/* Login Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Sign In</Text>
          <Text style={styles.formDescription}>
            Enter your email and password to access your financial records.
          </Text>

          {/* Error Banner */}
          {activeError ? (
            <View style={styles.errorBanner}>
              <AlertCircleIcon size={18} color={colors.danger} />
              <Text style={styles.errorBannerText}>{activeError}</Text>
            </View>
          ) : null}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconContainer}>
                <MailIcon size={18} color={colors.textMuted} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="name@example.com"
                placeholderTextColor="#98A2B3"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (activeError) {
                    setValidationError(null);
                    clearError();
                  }
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                accessibilityLabel="Email Address"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.passwordLabelRow}>
              <Text style={styles.inputLabel}>Password</Text>
            </View>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconContainer}>
                <LockIcon size={18} color={colors.textMuted} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your account password"
                placeholderTextColor="#98A2B3"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (activeError) {
                    setValidationError(null);
                    clearError();
                  }
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                accessibilityLabel="Password"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {showPassword ? (
                  <EyeOffIcon size={18} color={colors.textMuted} />
                ) : (
                  <EyeIcon size={18} color={colors.textMuted} />
                )}
              </Pressable>
            </View>
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              isLoading && styles.buttonDisabled,
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Sign In"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.primaryButtonText}>Sign In</Text>
                <ArrowRightIcon size={18} color="#FFFFFF" />
              </View>
            )}
          </Pressable>
        </View>

        {/* Signup Navigation Link */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Do not have an account yet?</Text>
          <Pressable
            onPress={() => {
              clearError();
              navigation.navigate('Signup');
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Create an account"
            style={styles.footerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.footerLink}>Create Account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.navyHeaderStart,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.navyHeaderStart,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    color: '#FDB022',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  formDescription: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECDCA',
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: colors.danger,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
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
  inputIconContainer: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },
  passwordToggle: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
  },
  footerButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});
