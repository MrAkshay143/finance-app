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
import type { UserProfile } from '@finance/shared-types';
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  ShieldIcon,
  HelpCircleIcon,
  ChevronRightIcon,
  CheckIcon,
  AlertCircleIcon,
  SaveIcon,
  InfoIcon,
} from '../../components/icons';
import { BrandedHeader } from '../../components/BrandedHeader';
import { PhoneInputWithCountry } from '../../components/PhoneInputWithCountry';
import { validateAndNormalizePhone } from '@finance/shared-types';
import { apiClient } from '../../services/apiClient';
import { useAuthStore } from '../../store/authStore';
import type { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const BasicProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { user: authUser, setUser } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [kbaConfigured, setKbaConfigured] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const res: any = await apiClient.profile.get();
        const data = res?.user || res?.data?.user || res?.data || res;
        const fp = res?.financeProfile || res?.data?.financeProfile;
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setMobileNumber(data.mobileNumber || data.phone || '');
        setEmail(data.email || '');
        setKbaConfigured(Boolean(data.kbaConfigured));
        if (fp?.dateOfBirth || data.dateOfBirth) {
          const rawDob = fp?.dateOfBirth || data.dateOfBirth;
          setDateOfBirth(typeof rawDob === 'string' ? rawDob.slice(0, 10) : new Date(rawDob).toISOString().slice(0, 10));
        }
        if (fp?.address || data.address) {
          setAddress(fp?.address || data.address);
        }
      } catch {
        if (authUser) {
          setFirstName(authUser.firstName || authUser.fullName?.split(' ')[0] || '');
          setLastName(authUser.lastName || authUser.fullName?.split(' ').slice(1).join(' ') || '');
          setMobileNumber(authUser.mobileNumber || '');
          setEmail(authUser.email || '');
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, [authUser]);

  const handleSave = async () => {
    setErrorMessage(null);
    setSaveSuccess(false);

    if (!firstName.trim()) {
      setErrorMessage('First name is required.');
      return;
    }

    if (dateOfBirth.trim()) {
      const dob = new Date(dateOfBirth.trim());
      const now = new Date();
      if (isNaN(dob.getTime())) {
        setErrorMessage('Please enter a valid date of birth (YYYY-MM-DD).');
        return;
      }
      if (dob > now) {
        setErrorMessage('Date of birth cannot be in the future.');
        return;
      }
      const minAge = new Date();
      minAge.setFullYear(now.getFullYear() - 16);
      if (dob > minAge) {
        setErrorMessage('You must be at least 16 years old to use Finance Tracker.');
        return;
      }
    }

    if (mobileNumber.trim()) {
      const phoneValidation = validateAndNormalizePhone(mobileNumber.trim());
      if (!phoneValidation.isValid) {
        setErrorMessage(phoneValidation.error || 'Please enter a valid mobile number.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const normalizedPhone = mobileNumber.trim()
        ? validateAndNormalizePhone(mobileNumber.trim()).e164 || mobileNumber.trim()
        : undefined;

      const updated = await apiClient.profile.update({
        fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        mobileNumber: normalizedPhone,
        dateOfBirth: dateOfBirth.trim() || undefined,
        address: address.trim() || undefined,
      });

      if (authUser) {
        setUser({
          ...authUser,
          fullName: updated?.fullName || fullName,
          firstName: updated?.firstName || firstName.trim(),
          lastName: updated?.lastName || lastName.trim() || undefined,
          mobileNumber: (updated?.mobileNumber ?? normalizedPhone) || undefined,
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Failed to update profile. Please try again.'
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
        title="Basic Profile"
        subtitle="Manage your personal information"
        onBackPress={() => navigation.goBack()}
        rightAction={
          <View style={styles.secureHeaderBadge}>
            <ShieldIcon size={12} color={colors.primary} />
            <Text style={styles.secureBadgeText}>Your data is secure and private</Text>
          </View>
        }
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
            <CheckIcon size={16} color={colors.success} />
            <Text style={styles.successBannerText}>Profile updated successfully.</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <AlertCircleIcon size={16} color={colors.danger} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Card 1: Personal Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.headerIconSquare, { backgroundColor: '#EFF4FF' }]}>
              <UserIcon size={20} color="#2554EE" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Personal Details</Text>
              <Text style={styles.cardSubtitle}>Tell us about yourself</Text>
            </View>
          </View>

          {/* First & Last Name Fields */}
          <View style={styles.nameRow}>
            <View style={styles.halfInputGroup}>
              <Text style={styles.inputLabel}>
                First Name <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <UserIcon size={16} color={colors.textMuted} />
                </View>
                <TextInput
                  style={styles.textInput}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  placeholderTextColor="#98A2B3"
                  accessibilityLabel="First Name"
                />
              </View>
            </View>

            <View style={styles.halfInputGroup}>
              <Text style={styles.inputLabel}>
                Last Name <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <UserIcon size={16} color={colors.textMuted} />
                </View>
                <TextInput
                  style={styles.textInput}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  placeholderTextColor="#98A2B3"
                  accessibilityLabel="Last Name"
                />
              </View>
            </View>
          </View>

          {/* Mobile Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Mobile Number <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <PhoneInputWithCountry
              value={mobileNumber}
              onChangeText={setMobileNumber}
              accessibilityLabel="Mobile Number"
            />
          </View>

          {/* Email Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Email Address <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={[styles.inputWrapper, styles.disabledInputWrapper]}>
              <View style={styles.inputIcon}>
                <MailIcon size={16} color={colors.textMuted} />
              </View>
              <TextInput
                style={[styles.textInput, styles.disabledTextInput]}
                value={email}
                editable={false}
                placeholder="name@example.com"
                placeholderTextColor="#98A2B3"
                accessibilityLabel="Email Address"
              />
            </View>
          </View>

          {/* Date of Birth */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Date of Birth <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <CalendarIcon size={16} color={colors.textMuted} />
              </View>
              <TextInput
                style={styles.textInput}
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#98A2B3"
                accessibilityLabel="Date of Birth"
              />
            </View>
            <Text style={styles.helperText}>
              Used to provide age-tailored financial insights.
            </Text>
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <View style={styles.textAreaWrapper}>
              <View style={styles.textAreaIcon}>
                <MapPinIcon size={16} color={colors.textMuted} />
              </View>
              <TextInput
                style={styles.textAreaInput}
                value={address}
                onChangeText={(text) => {
                  if (text.length <= 200) {
                    setAddress(text);
                  }
                }}
                placeholder="Street address, city, state"
                placeholderTextColor="#98A2B3"
                multiline
                numberOfLines={3}
                accessibilityLabel="Address"
              />
            </View>
            <Text style={styles.counterText}>{address.length}/200</Text>
          </View>

          {/* Guidance Callout */}
          <View style={styles.infoCallout}>
            <InfoIcon size={16} color={colors.primary} />
            <Text style={styles.infoCalloutText}>
              Keep your profile updated for accurate financial recommendations.
            </Text>
          </View>
        </View>

        {/* Card 2: Security */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.headerIconSquare, { backgroundColor: '#FEF0C7' }]}>
              <ShieldIcon size={20} color="#D97706" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Security</Text>
              <Text style={styles.cardSubtitle}>Protect your account</Text>
            </View>
          </View>

          <Pressable
            onPress={() => navigation.navigate('SecurityQuestions')}
            style={({ pressed }) => [styles.kbaRow, pressed && styles.itemPressed]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Security Questions Setup"
          >
            <View style={styles.kbaIconSquare}>
              <HelpCircleIcon size={20} color={kbaConfigured ? '#1F9D55' : '#E23D3D'} />
            </View>
            <View style={styles.kbaTextContainer}>
              <Text style={styles.kbaTitle}>Security Questions</Text>
              <Text style={styles.kbaSubtitle}>
                {kbaConfigured
                  ? 'Configured: answers enable secure recovery'
                  : 'Not set: set them to enable password recovery'}
              </Text>
            </View>
            <ChevronRightIcon size={18} color="#98A2B3" />
          </Pressable>
        </View>

        {/* Save Profile Button */}
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
          accessibilityLabel="Save Profile"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.saveButtonContent}>
              <SaveIcon size={18} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Profile</Text>
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
  secureHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF4FF',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  secureBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
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
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInputGroup: {
    flex: 1,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  requiredAsterisk: {
    color: colors.danger,
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
  disabledInputWrapper: {
    backgroundColor: '#F2F4F7',
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
  disabledTextInput: {
    color: colors.textMuted,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 46,
    gap: 6,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  phoneInputWrapper: {
    flex: 1,
  },
  helperText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  textAreaWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    minHeight: 80,
  },
  textAreaIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  textAreaInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: 'top',
    padding: 0,
  },
  counterText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 2,
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
  kbaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemPressed: {
    backgroundColor: '#F2F4F7',
  },
  kbaIconSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kbaTextContainer: {
    flex: 1,
  },
  kbaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  kbaSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
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
