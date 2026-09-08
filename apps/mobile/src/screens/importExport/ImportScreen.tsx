import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '@finance/shared-ui-tokens';
import { BrandedHeader } from '../../components/BrandedHeader';
import {
  UploadIcon,
  CreditCardIcon,
  FileTextIcon,
  CheckIcon,
  AlertCircleIcon,
  ChevronDownIcon,
} from '../../components/icons';
import { apiClient } from '../../services/apiClient';
import type { Account, ImportCsvResponse } from '@finance/shared-types';

const getSampleCsvTemplate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `date,amount,type,category,description
${year}-${month}-01,1500,expense,Food & Dining,Supermarket Groceries
${year}-${month}-02,50000,income,Salary,Monthly Tech Retainer
${year}-${month}-03,10000,investment,Mutual Funds,Index Equity SIP`;
};

export const ImportScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [csvContent, setCsvContent] = useState<string>('');
  const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(true);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<ImportCsvResponse | null>(null);
  const [isAccountPickerOpen, setIsAccountPickerOpen] = useState<boolean>(false);

  const loadAccounts = useCallback(async () => {
    try {
      const res = await apiClient.accounts.list();
      const list: Account[] = Array.isArray(res) ? res : (res as any)?.accounts || [];
      if (list.length > 0) {
        setAccounts(list);
        setSelectedAccountId(list[0].id);
      }
    } catch {
      setAccounts([]);
      setSelectedAccountId('');
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    setIsLoadingAccounts(true);
    void loadAccounts();
  }, [loadAccounts]);

  const handleImport = async () => {
    if (!selectedAccountId) {
      Alert.alert('Selection Required', 'Please select a destination account for the import.');
      return;
    }
    if (!csvContent.trim()) {
      Alert.alert('Empty Content', 'Please enter or paste CSV formatted transaction data.');
      return;
    }

    setIsImporting(true);
    setImportResult(null);
    try {
      const result = await apiClient.import.importCsv(selectedAccountId, csvContent);
      setImportResult(result);
    } catch (err: any) {
      Alert.alert(
        'Import Processing Error',
        err?.response?.data?.error?.message || 'Could not parse or validate the CSV payload.'
      );
    } finally {
      setIsImporting(false);
    }
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <BrandedHeader
        variant="nested"
        title="Import Data"
        subtitle="Batch transaction upload via CSV"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Selector Card */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>DESTINATION ACCOUNT</Text>
          <View style={styles.card}>
            {isLoadingAccounts ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Loading accounts...</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => setIsAccountPickerOpen(!isAccountPickerOpen)}
                style={styles.pickerTrigger}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Select destination account"
              >
                <View style={styles.pickerTriggerLeft}>
                  <View style={styles.iconCircle}>
                    <CreditCardIcon size={18} color={colors.primary} />
                  </View>
                  <View style={styles.accountTextColumn}>
                    <Text style={styles.accountNameText}>
                      {selectedAccount ? selectedAccount.name : accounts.length === 0 ? 'No accounts available' : 'Choose an account'}
                    </Text>
                    <Text style={styles.accountSubText}>
                      {selectedAccount
                        ? selectedAccount.institutionName || selectedAccount.type
                        : 'Destination ledger'}
                    </Text>
                  </View>
                </View>
                <ChevronDownIcon size={18} color="#98A2B3" />
              </Pressable>
            )}

            {isAccountPickerOpen && (
              <View style={styles.accountsDropdown}>
                {accounts.length === 0 ? (
                  <View style={{ padding: 12 }}>
                    <Text style={{ fontSize: 13, color: colors.textMuted }}>
                      No accounts found. Please add an account before importing.
                    </Text>
                  </View>
                ) : (
                  accounts.map((acc) => {
                  const isSelected = acc.id === selectedAccountId;
                  return (
                    <Pressable
                      key={acc.id}
                      onPress={() => {
                        setSelectedAccountId(acc.id);
                        setIsAccountPickerOpen(false);
                      }}
                      style={[
                        styles.accountOptionRow,
                        isSelected && styles.accountOptionRowSelected,
                      ]}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Select account ${acc.name}`}
                    >
                      <View>
                        <Text
                          style={[
                            styles.accountOptionName,
                            isSelected && styles.accountOptionTextSelected,
                          ]}
                        >
                          {acc.name}
                        </Text>
                        <Text style={styles.accountOptionInstitution}>
                          {acc.institutionName ? `${acc.institutionName} · ` : ''}
                          {acc.type}
                        </Text>
                      </View>
                      {isSelected && <CheckIcon size={16} color={colors.primary} />}
                    </Pressable>
                  );
                }))}
              </View>
            )}
          </View>
        </View>

        {/* CSV Payload Card */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>CSV TRANSACTION PAYLOAD</Text>
            <Pressable
              onPress={() => setCsvContent(getSampleCsvTemplate())}
              style={styles.templateButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Load standard CSV template"
            >
              <FileTextIcon size={14} color={colors.primary} />
              <Text style={styles.templateButtonText}>Load Template</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <TextInput
              style={styles.csvTextInput}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              placeholder={`date,amount,type,category,description\n${new Date().toISOString().slice(0, 7)}-01,1500,expense,Food,Grocery`}
              placeholderTextColor={colors.textMuted}
              value={csvContent}
              onChangeText={setCsvContent}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Import Action CTA */}
        <Pressable
          onPress={handleImport}
          disabled={isImporting}
          style={({ pressed }) => [
            styles.importButton,
            pressed && styles.buttonPressed,
          ]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Parse and Import CSV"
        >
          {isImporting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <UploadIcon size={18} color="#FFFFFF" />
              <Text style={styles.importButtonText}>Parse & Import CSV</Text>
            </>
          )}
        </Pressable>

        {/* Results Summary Card */}
        {importResult && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>IMPORT EXECUTION SUMMARY</Text>
            <View style={styles.resultCard}>
              <View style={styles.resultMetricsRow}>
                <View style={styles.resultMetricBox}>
                  <Text style={styles.resultMetricNumberSuccess}>
                    {importResult.importedCount}
                  </Text>
                  <Text style={styles.resultMetricLabel}>Imported</Text>
                </View>

                <View style={styles.resultMetricBox}>
                  <Text style={styles.resultMetricNumberWarning}>
                    {importResult.skippedCount}
                  </Text>
                  <Text style={styles.resultMetricLabel}>Skipped</Text>
                </View>

                <View style={styles.resultMetricBox}>
                  <Text style={styles.resultMetricNumberDanger}>
                    {importResult.errors ? importResult.errors.length : 0}
                  </Text>
                  <Text style={styles.resultMetricLabel}>Errors</Text>
                </View>
              </View>

              {importResult.errors && importResult.errors.length > 0 && (
                <View style={styles.errorsContainer}>
                  <Text style={styles.errorsHeading}>Parsing Notices:</Text>
                  {importResult.errors.map((errStr, idx) => (
                    <View key={idx} style={styles.errorRow}>
                      <AlertCircleIcon size={14} color={colors.danger} />
                      <Text style={styles.errorText}>{errStr}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
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
  content: {
    padding: 16,
    gap: 18,
    paddingBottom: 40,
  },
  sectionContainer: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 8,
  },
  templateButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    padding: 14,
  },
  pickerTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountTextColumn: {
    flex: 1,
  },
  accountNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  accountSubText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  accountsDropdown: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#FAFCFF',
  },
  accountOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  accountOptionRowSelected: {
    backgroundColor: colors.primarySoft,
  },
  accountOptionName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  accountOptionTextSelected: {
    fontWeight: '700',
    color: colors.primary,
  },
  accountOptionInstitution: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  csvTextInput: {
    minHeight: 160,
    padding: 14,
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.text,
    lineHeight: 18,
  },
  importButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 3,
  },
  importButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  resultMetricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  resultMetricBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultMetricNumberSuccess: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.success,
  },
  resultMetricNumberWarning: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.warning,
  },
  resultMetricNumberDanger: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.danger,
  },
  resultMetricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
  },
  errorsContainer: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  errorsHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    fontSize: 11,
    color: colors.danger,
    flex: 1,
  },
});
