import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@finance/shared-ui-tokens';
import { BrandedHeader } from '../../components/BrandedHeader';
import {
  DownloadIcon,
  CheckIcon,
  FileTextIcon,
  ShieldCheckIcon,
} from '../../components/icons';
import { apiClient } from '../../services/apiClient';
import type { ExportUserDataResponse } from '@finance/shared-types';

export const ExportScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [exportData, setExportData] = useState<ExportUserDataResponse | null>(null);
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);

  const handleExport = async () => {
    setIsGenerating(true);
    setCopiedNotice(false);
    try {
      const res = await apiClient.export.exportUserData(format);
      setExportData(res);
    } catch (err: any) {
      Alert.alert(
        'Export Generation Error',
        err?.response?.data?.error?.message || 'Could not compile user export package.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyData = async () => {
    if (!exportData?.data) return;
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
    const content = typeof exportData.data === 'string' ? exportData.data : JSON.stringify(exportData.data, null, 2);
    try {
      await Share.share({
        title: `Finance Tracker Export (${format.toUpperCase()})`,
        message: content,
      });
    } catch {
      // Ignored or cancelled
    }
  };

  return (
    <View style={styles.container}>
      <BrandedHeader
        variant="nested"
        title="Export Data"
        subtitle="Complete financial record download"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Format Selector Card */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>SELECT EXPORT FORMAT</Text>
          <View style={styles.card}>
            <View style={styles.formatRow}>
              {/* Option 1: JSON */}
              <Pressable
                onPress={() => setFormat('json')}
                style={[
                  styles.formatOption,
                  format === 'json' && styles.formatOptionActive,
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Select JSON export format"
              >
                <View style={styles.formatIconCircle}>
                  <FileTextIcon
                    size={20}
                    color={format === 'json' ? colors.primary : colors.textMuted}
                  />
                </View>
                <Text
                  style={[
                    styles.formatTitle,
                    format === 'json' && styles.formatTitleActive,
                  ]}
                >
                  JSON Backup
                </Text>
                <Text style={styles.formatDesc}>
                  Full backup of accounts, transactions, budgets, and goals.
                </Text>
              </Pressable>

              {/* Option 2: CSV */}
              <Pressable
                onPress={() => setFormat('csv')}
                style={[
                  styles.formatOption,
                  format === 'csv' && styles.formatOptionActive,
                ]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Select CSV export format"
              >
                <View style={styles.formatIconCircle}>
                  <DownloadIcon
                    size={20}
                    color={format === 'csv' ? colors.primary : colors.textMuted}
                  />
                </View>
                <Text
                  style={[
                    styles.formatTitle,
                    format === 'csv' && styles.formatTitleActive,
                  ]}
                >
                  CSV Flat Ledger
                </Text>
                <Text style={styles.formatDesc}>
                  Spreadsheet format for external analysis and tax records.
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Security / Policy Note */}
        <View style={styles.infoBanner}>
          <ShieldCheckIcon size={18} color={colors.primary} />
          <Text style={styles.infoBannerText}>
            Exported files contain sensitive data. Files are securely encrypted in transit.
          </Text>
        </View>

        {/* Generate Export CTA */}
        <Pressable
          onPress={handleExport}
          disabled={isGenerating}
          style={({ pressed }) => [
            styles.generateButton,
            pressed && styles.buttonPressed,
          ]}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Generate Financial Export"
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <DownloadIcon size={18} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>
                Generate {format.toUpperCase()} Export
              </Text>
            </>
          )}
        </Pressable>

        {/* Result Summary */}
        {exportData && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>GENERATED PACKAGE DETAILS</Text>
            <View style={styles.resultCard}>
              <View style={styles.resultHeaderRow}>
                <View style={styles.fileIconCircle}>
                  <FileTextIcon size={20} color={colors.success} />
                </View>
                <View style={styles.fileDetailsColumn}>
                  <Text style={styles.filenameText} numberOfLines={1}>
                    {exportData.filename}
                  </Text>
                  <Text style={styles.fileMimeText}>
                    {exportData.contentType} · {exportData.data.length.toLocaleString()} bytes
                  </Text>
                </View>
              </View>

              <View style={styles.previewContainer}>
                <Text style={styles.previewHeaderLabel}>FILE DATA STREAM:</Text>
                <ScrollView
                  style={styles.previewScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={true}
                >
                  <Text style={styles.previewDataText} numberOfLines={8}>
                    {exportData.data.slice(0, 1000)}
                    {exportData.data.length > 1000 ? '\n... [Remaining data included in full download]' : ''}
                  </Text>
                </ScrollView>
              </View>

              <Pressable
                onPress={handleCopyData}
                style={styles.copyButton}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Copy Exported Data"
              >
                {copiedNotice ? (
                  <>
                    <CheckIcon size={16} color={colors.success} />
                    <Text style={styles.copyButtonTextSuccess}>Copied to Clipboard!</Text>
                  </>
                ) : (
                  <>
                    <FileTextIcon size={16} color={colors.primary} />
                    <Text style={styles.copyButtonText}>Copy Export Data</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
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
  content: {
    padding: 16,
    gap: 18,
    paddingBottom: 40,
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
    padding: 14,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formatOption: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  formatOptionActive: {
    borderColor: colors.primary,
    backgroundColor: '#F4F7FF',
  },
  formatIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  formatTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  formatTitleActive: {
    color: colors.primary,
  },
  formatDesc: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
  infoBanner: {
    backgroundColor: colors.primarySoft,
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(37, 84, 238, 0.2)',
  },
  infoBannerText: {
    fontSize: 11,
    color: colors.primary,
    flex: 1,
    lineHeight: 16,
  },
  generateButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    minHeight: 48,
    paddingVertical: 14,
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
  generateButtonText: {
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
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 14,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileDetailsColumn: {
    flex: 1,
  },
  filenameText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  fileMimeText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  previewContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  previewHeaderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  previewScroll: {
    maxHeight: 120,
  },
  previewDataText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.text,
    lineHeight: 16,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  copyButtonTextSuccess: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
});
