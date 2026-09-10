import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@finance/shared-ui-tokens';
import { BrandedHeader } from '../../components/BrandedHeader';
import {
  ClockIcon,
  AlertCircleIcon,
  ShieldIcon,
  CheckIcon,
  MinusIcon,
  PlusIcon,
} from '../../components/icons';
import { apiClient } from '../../services/apiClient';

export const AdminSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [sessionTimeout, setSessionTimeout] = useState<number>(30);
  const [maxFailedAttempts, setMaxFailedAttempts] = useState<number>(5);
  const [lockoutDuration, setLockoutDuration] = useState<number>(15);
  const [requireKba, setRequireKba] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const loadSettings = useCallback(async () => {
    try {
      const data = await apiClient.admin.getAppSettings();
      if (data) {
        if (data.sessionTimeoutMinutes !== undefined) {
          setSessionTimeout(data.sessionTimeoutMinutes);
        }
        if (data.maxFailedLoginAttempts !== undefined) {
          setMaxFailedAttempts(data.maxFailedLoginAttempts);
        } else if (data.maxFailedAttempts !== undefined) {
          setMaxFailedAttempts(data.maxFailedAttempts);
        }
        if (data.lockoutDurationMinutes !== undefined) {
          setLockoutDuration(data.lockoutDurationMinutes);
        }
        if (data.requireKbaForSensitiveActions !== undefined) {
          setRequireKba(data.requireKbaForSensitiveActions);
        }
      }
    } catch {
      // Offline fallback: keep standard defaults
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    void loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.admin.updateAppSettings({
        sessionTimeoutMinutes: sessionTimeout,
        maxFailedLoginAttempts: maxFailedAttempts,
        maxFailedAttempts: maxFailedAttempts,
        lockoutDurationMinutes: lockoutDuration,
        requireKbaForSensitiveActions: requireKba,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      Alert.alert(
        'Save Failed',
        err?.response?.data?.error?.message || 'Could not update admin settings.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <BrandedHeader
        variant="nested"
        title="App Settings"
        subtitle="Platform policies & security thresholds"
        onBackPress={() => navigation.goBack()}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {savedSuccess && (
            <View style={styles.successBanner}>
              <CheckIcon size={16} color={colors.success} />
              <Text style={styles.successText}>
                Platform security policies saved and applied across cluster!
              </Text>
            </View>
          )}

          {/* Session & Security Thresholds */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>SECURITY THRESHOLDS</Text>
            <View style={styles.card}>
              {/* Session Timeout */}
              <View style={[styles.settingRow, styles.rowBorder]}>
                <View style={styles.settingLabelColumn}>
                  <View style={styles.labelWithIcon}>
                    <ClockIcon size={16} color={colors.primary} />
                    <Text style={styles.settingLabel}>Session Timeout</Text>
                  </View>
                  <Text style={styles.settingHelper}>
                    Inactivity duration before automatic session timeout.
                  </Text>
                </View>
                <View style={styles.stepperContainer}>
                  <Pressable
                    onPress={() => setSessionTimeout((prev) => Math.max(5, prev - 5))}
                    style={styles.stepperButton}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease session timeout"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MinusIcon size={14} color={colors.text} />
                  </Pressable>
                  <View style={styles.stepperValueBox}>
                    <Text style={styles.stepperValueText}>{sessionTimeout}m</Text>
                  </View>
                  <Pressable
                    onPress={() => setSessionTimeout((prev) => Math.min(1440, prev + 5))}
                    style={styles.stepperButton}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Increase session timeout"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <PlusIcon size={14} color={colors.text} />
                  </Pressable>
                </View>
              </View>

              {/* Max Failed Login Attempts */}
              <View style={[styles.settingRow, styles.rowBorder]}>
                <View style={styles.settingLabelColumn}>
                  <View style={styles.labelWithIcon}>
                    <AlertCircleIcon size={16} color={colors.danger} />
                    <Text style={styles.settingLabel}>Max Failed Attempts</Text>
                  </View>
                  <Text style={styles.settingHelper}>
                    Consecutive invalid attempts before automatic account lock
                  </Text>
                </View>
                <View style={styles.stepperContainer}>
                  <Pressable
                    onPress={() => setMaxFailedAttempts((prev) => Math.max(3, prev - 1))}
                    style={styles.stepperButton}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease max failed attempts"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MinusIcon size={14} color={colors.text} />
                  </Pressable>
                  <View style={styles.stepperValueBox}>
                    <Text style={styles.stepperValueText}>{maxFailedAttempts}</Text>
                  </View>
                  <Pressable
                    onPress={() => setMaxFailedAttempts((prev) => Math.min(20, prev + 1))}
                    style={styles.stepperButton}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Increase max failed attempts"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <PlusIcon size={14} color={colors.text} />
                  </Pressable>
                </View>
              </View>

              {/* Lockout Duration */}
              <View style={styles.settingRow}>
                <View style={styles.settingLabelColumn}>
                  <View style={styles.labelWithIcon}>
                    <ClockIcon size={16} color={colors.warning} />
                    <Text style={styles.settingLabel}>Lockout Duration</Text>
                  </View>
                  <Text style={styles.settingHelper}>
                    Cooldown duration before locked accounts can retry.
                  </Text>
                </View>
                <View style={styles.stepperContainer}>
                  <Pressable
                    onPress={() => setLockoutDuration((prev) => Math.max(5, prev - 5))}
                    style={styles.stepperButton}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease lockout duration"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MinusIcon size={14} color={colors.text} />
                  </Pressable>
                  <View style={styles.stepperValueBox}>
                    <Text style={styles.stepperValueText}>{lockoutDuration}m</Text>
                  </View>
                  <Pressable
                    onPress={() => setLockoutDuration((prev) => Math.min(1440, prev + 5))}
                    style={styles.stepperButton}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Increase lockout duration"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <PlusIcon size={14} color={colors.text} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* System Policy Controls */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>SYSTEM POLICY CONTROLS</Text>
            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextColumn}>
                  <View style={styles.labelWithIcon}>
                    <ShieldIcon size={16} color={colors.primary} />
                    <Text style={styles.settingLabel}>Required Security Questions</Text>
                  </View>
                  <Text style={styles.settingHelper}>
                    Require 3 security questions for sensitive operations.
                  </Text>
                </View>
                <Switch
                  value={requireKba}
                  onValueChange={setRequireKba}
                  trackColor={{ false: '#E4E7EC', true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            accessible={true}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Save Admin Settings"
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Admin Settings</Text>
            )}
          </Pressable>
        </ScrollView>
      )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBanner: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(31, 157, 85, 0.2)',
  },
  successText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
    flex: 1,
  },
  sectionContainer: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  settingRow: {
    padding: 16,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabelColumn: {
    gap: 4,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  settingHelper: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
  },
  stepperButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
  },
  stepperValueBox: {
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  stepperValueText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  toggleTextColumn: {
    flex: 1,
    gap: 4,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
