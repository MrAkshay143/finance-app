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
  UserIcon,
  MailIcon,
  PhoneIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  AlertCircleIcon,
  ArrowRightIcon,
} from '../../components/icons';
import { useAuthStore } from '../../store/authStore';
import { PhoneInputWithCountry } from '../../components/PhoneInputWithCountry';
import { validateAndNormalizePhone } from '@finance/shared-types';
import type { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Signup'>;

export const SignupScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { signup, isLoading, error: storeError, clearError } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    setValidationError(null);
    clearError();

    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setValidationError('Full name must be at least 2 characters.');
      return false;
    }

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

    const trimmedMobile = mobileNumber.trim();
    if (trimmedMobile) {
      const phoneValidation = validateAndNormalizePhone(trimmedMobile);
      if (!phoneValidation.isValid) {
        setValidationError(phoneValidation.error || 'Please enter a valid mobile number.');
        return false;
      }
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters.');
      return false;
    }

    if (!/[A-Z]/.test(password)) {
      setValidationError('Password must contain at least one uppercase letter.');
      return false;
    }

    if (!/[a-z]/.test(password)) {
      setValidationError('Password must contain at least one lowercase letter.');
      return false;
    }

    if (!/[0-9]/.test(password)) {
      setValidationError('Password must contain at least one number.');
      return false;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;
      const normalizedPhone = mobileNumber.trim()
        ? validateAndNormalizePhone(mobileNumber.trim()).e164 || mobileNumber.trim()
        : undefined;

      await signup({
        fullName: fullName.trim(),
        firstName,
        lastName,
        email: email.trim().toLowerCase(),
        mobileNumber: normalizedPhone,
        password,
      });

      // Navigate to Onboarding stack upon account creation
      navigation.reset({
        index: 0,
        routes: [{ name: 'Onboarding' }],
      });
    } catch {
      // Error handled in store and displayed in activeError banner
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
            paddingTop: insets.top > 0 ? insets.top + 20 : 32,
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
          <Text style={styles.brandSubtitle}>Create your personal account</Text>
        </View>

        {/* Signup Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Register Account</Text>
          <Text style={styles.formDescription}>
            Create your profile to start tracking your finances.
          </Text>

          {/* Error Banner */}
          {activeError ? (
            <View style={styles.errorBanner}>
              <AlertCircleIcon size={18} color={colors.danger} />
              <Text style={styles.errorBannerText}>{activeError}</Text>
            </View>
          ) : null}

          {/* Full Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconContainer}>
                <UserIcon size={18} color={colors.textMuted} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="First and last name"
                placeholderTextColor="#98A2B3"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (activeError) {
                    setValidationError(null);
                    clearError();
                  }
                }}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="name"
                accessibilityLabel="Full Name"
              />
            </View>
          </View>

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

          {/* Mobile Number Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <PhoneInputWithCountry
              value={mobileNumber}
              onChangeText={(text) => {
                setMobileNumber(text);
                if (activeError) {
                  setValidationError(null);
                  clearError();
                }
              }}
              accessibilityLabel="Mobile Number"
              testID="mobile-number-input"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconContainer}>
                <LockIcon size={18} color={colors.textMuted} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Minimum 8 chars, 1 upper, 1 number"
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
                textContentType="newPassword"
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

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIconContainer}>
                <LockIcon size={18} color={colors.textMuted} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Re-enter your password"
                placeholderTextColor="#98A2B3"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (activeError) {
                    setValidationError(null);
                    clearError();
                  }
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                accessibilityLabel="Confirm Password"
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.passwordToggle}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {showConfirmPassword ? (
                  <EyeOffIcon size={18} color={colors.textMuted} />
                ) : (
                  <EyeIcon size={18} color={colors.textMuted} />
                )}
              </Pressable>
            </View>
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleSignup}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              isLoading && styles.buttonDisabled,
            ]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Create Account"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.primaryButtonText}>Create Account</Text>
                <ArrowRightIcon size={18} color="#FFFFFF" />
              </View>
            )}
          </Pressable>
        </View>

        {/* Login Navigation Link */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Already registered?</Text>
          <Pressable
            onPress={() => {
              clearError();
              navigation.navigate('Login');
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Sign in to existing account"
            style={styles.footerButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.footerLink}>Sign In</Text>
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
    marginBottom: 24,
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
    marginBottom: 14,
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
    marginTop: 10,
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
    marginTop: 20,
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
